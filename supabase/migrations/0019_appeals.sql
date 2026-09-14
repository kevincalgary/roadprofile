-- RoadProfile: appeals workflow. Lets a user appeal a moderation action
-- taken against their account (warn/suspend/ban) or against content they
-- authored (remove_content), distinct from the report queue. A moderator
-- then upholds or overturns the appeal.

create table public.appeals (
  id uuid primary key default gen_random_uuid(),
  moderation_action_id uuid not null references public.moderation_actions(id) on delete cascade,
  appellant_id uuid not null references public.profiles(user_id),
  statement text not null check (char_length(statement) between 10 and 2000),
  status text not null default 'pending' check (status in ('pending', 'upheld', 'overturned')),
  decided_by uuid references public.profiles(user_id),
  decided_at timestamptz,
  decision_notes text,
  created_at timestamptz not null default now()
);

alter table public.appeals enable row level security;

create index appeals_status_idx on public.appeals (status, created_at desc);
create index appeals_moderation_action_idx on public.appeals (moderation_action_id);
create index appeals_appellant_idx on public.appeals (appellant_id, created_at desc);

-- Only one open appeal per moderation action at a time.
create unique index appeals_one_pending_per_action on public.appeals (moderation_action_id) where status = 'pending';

create policy appeals_select_own_or_mod on public.appeals
  for select using (appellant_id = auth.uid() or public.current_user_is_moderator());

-- Defense in depth: the real eligibility check (does this action target the
-- caller?) happens in rpc_submit_appeal, which is the only intended
-- write path — see the RPC comment below.
create policy appeals_insert_own on public.appeals
  for insert with check (appellant_id = auth.uid());

create policy appeals_update_moderator on public.appeals
  for update using (public.current_user_is_moderator()) with check (public.current_user_is_moderator());

-- ---------------------------------------------------------------------------
-- moderation_actions.action gains the two appeal-decision values below;
-- the constraint is otherwise unchanged from 0010_moderation.sql.
alter table public.moderation_actions drop constraint moderation_actions_action_check;
alter table public.moderation_actions add constraint moderation_actions_action_check check (action in (
  'warn', 'suspend', 'ban', 'lift_suspension', 'remove_content', 'restore_content',
  'merge_vehicles', 'approve_correction', 'reject_correction',
  'dismiss_report', 'resolve_report', 'review_report',
  'uphold_appeal', 'overturn_appeal'
));

-- ---------------------------------------------------------------------------
create or replace function public.rpc_submit_appeal(p_moderation_action_id uuid, p_statement text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  act public.moderation_actions;
  v_author uuid;
begin
  select * into act from public.moderation_actions where id = p_moderation_action_id;
  if not found then
    raise exception 'Moderation action not found.';
  end if;
  if act.action not in ('warn', 'suspend', 'ban', 'remove_content') then
    raise exception 'This action type cannot be appealed.';
  end if;

  if act.target_type = 'user' then
    if act.target_id <> auth.uid() then
      raise exception 'You can only appeal actions taken against you.';
    end if;
  elsif act.target_type in ('record', 'comment', 'reply') then
    if act.target_type = 'record' then
      select author_id into v_author from public.records where id = act.target_id;
    elsif act.target_type = 'comment' then
      select author_id into v_author from public.comments where id = act.target_id;
    else
      select author_id into v_author from public.replies where id = act.target_id;
    end if;
    if v_author is null or v_author <> auth.uid() then
      raise exception 'You can only appeal actions taken against your own content.';
    end if;
  else
    raise exception 'This action type cannot be appealed.';
  end if;

  if exists (select 1 from public.appeals where moderation_action_id = p_moderation_action_id and status = 'pending') then
    raise exception 'An appeal for this action is already pending.';
  end if;

  insert into public.appeals (moderation_action_id, appellant_id, statement)
  values (p_moderation_action_id, auth.uid(), p_statement);
end;
$$;

-- ---------------------------------------------------------------------------
create or replace function public.rpc_decide_appeal(p_appeal_id uuid, p_status text, p_notes text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  ap public.appeals;
  act public.moderation_actions;
begin
  if not public.current_user_is_moderator() then
    raise exception 'Moderator role required.';
  end if;
  if p_status not in ('upheld', 'overturned') then
    raise exception 'Invalid status.';
  end if;

  select * into ap from public.appeals where id = p_appeal_id and status = 'pending';
  if not found then
    raise exception 'Appeal not found or already decided.';
  end if;
  select * into act from public.moderation_actions where id = ap.moderation_action_id;

  update public.appeals
    set status = p_status, decided_by = auth.uid(), decided_at = now(), decision_notes = p_notes
    where id = p_appeal_id;

  if p_status = 'overturned' then
    if act.action in ('suspend', 'ban') then
      update public.user_standing
        set is_suspended = false, suspended_until = null, is_banned = false, updated_at = now()
        where user_id = act.target_id;
    elsif act.action = 'remove_content' then
      if act.target_type = 'record' then
        update public.records set deleted_at = null where id = act.target_id;
      elsif act.target_type = 'comment' then
        update public.comments set deleted_at = null where id = act.target_id;
      elsif act.target_type = 'reply' then
        update public.replies set deleted_at = null where id = act.target_id;
      end if;
    end if;
    -- 'warn' has no reversible side effect; the overturn is recorded via the
    -- moderation_actions log entry below.
  end if;

  insert into public.moderation_actions (moderator_id, target_type, target_id, action, reason, notes)
  values (
    auth.uid(), act.target_type, act.target_id,
    case p_status when 'overturned' then 'overturn_appeal' else 'uphold_appeal' end,
    'Appeal decision', p_notes
  );

  perform public.notify(ap.appellant_id, auth.uid(), 'moderation_update', act.target_type, act.target_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- Self-service: every moderation action currently eligible for appeal by the
-- caller (targets them directly, or targets content they authored), with
-- whichever appeal they've already filed against it, if any. Security
-- definer so it can read moderation_actions/records/comments/replies rows
-- that aren't the caller's own, but every branch is scoped to auth.uid().
create or replace function public.rpc_get_my_appealable_actions()
returns table (
  moderation_action_id uuid,
  target_type text,
  target_id uuid,
  action text,
  reason text,
  created_at timestamptz,
  appeal_id uuid,
  appeal_status text,
  appeal_decision_notes text
)
language sql
stable
security definer
set search_path = public
as $$
  select ma.id, ma.target_type, ma.target_id, ma.action, ma.reason, ma.created_at,
         ap.id, ap.status, ap.decision_notes
  from public.moderation_actions ma
  left join public.appeals ap on ap.moderation_action_id = ma.id and ap.appellant_id = auth.uid()
  where ma.action in ('warn', 'suspend', 'ban', 'remove_content')
    and (
      (ma.target_type = 'user' and ma.target_id = auth.uid())
      or (ma.target_type = 'record' and exists (select 1 from public.records r where r.id = ma.target_id and r.author_id = auth.uid()))
      or (ma.target_type = 'comment' and exists (select 1 from public.comments c where c.id = ma.target_id and c.author_id = auth.uid()))
      or (ma.target_type = 'reply' and exists (select 1 from public.replies rp where rp.id = ma.target_id and rp.author_id = auth.uid()))
    )
  order by ma.created_at desc;
$$;
