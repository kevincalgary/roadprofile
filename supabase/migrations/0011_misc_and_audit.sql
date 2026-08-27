-- RoadProfile: recently viewed, audit log.

create table public.recently_viewed (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('vehicle', 'user', 'list')),
  target_id uuid not null,
  viewed_at timestamptz not null default now(),
  unique (user_id, target_type, target_id)
);

alter table public.recently_viewed enable row level security;

create index recently_viewed_user_idx on public.recently_viewed (user_id, viewed_at desc);

create policy recently_viewed_select_own on public.recently_viewed
  for select using (user_id = auth.uid());

create policy recently_viewed_upsert_own on public.recently_viewed
  for insert with check (user_id = auth.uid());

create policy recently_viewed_update_own on public.recently_viewed
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy recently_viewed_delete_own on public.recently_viewed
  for delete using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  -- Points at profiles (not auth.users) so audit history survives account
  -- deletion — see 0002_users_and_profiles.sql for why profiles is the
  -- durable identity anchor.
  actor_id uuid references public.profiles(user_id),
  action text not null,
  target_type text,
  target_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.audit_logs enable row level security;

create index audit_logs_target_idx on public.audit_logs (target_type, target_id, created_at desc);
create index audit_logs_actor_idx on public.audit_logs (actor_id, created_at desc);

-- Audit logs are written only by SECURITY DEFINER functions/edge functions
-- (service role); moderators/admins may read them, no one may edit or delete.
create policy audit_logs_select_mod on public.audit_logs
  for select using (public.current_user_is_moderator());

create or replace function public.log_audit(
  p_actor uuid, p_action text, p_target_type text, p_target_id uuid, p_metadata jsonb default '{}'
) returns void
language sql
security definer
set search_path = public
as $$
  insert into public.audit_logs (actor_id, action, target_type, target_id, metadata)
  values (p_actor, p_action, p_target_type, p_target_id, p_metadata);
$$;

-- Log moderator actions and moderation-relevant decisions automatically.
create or replace function public.audit_moderation_action()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.log_audit(new.moderator_id, 'moderation_action:' || new.action, new.target_type, new.target_id,
    jsonb_build_object('reason', new.reason, 'notes', new.notes));
  return new;
end;
$$;

create trigger moderation_actions_audit after insert on public.moderation_actions
  for each row execute function public.audit_moderation_action();
