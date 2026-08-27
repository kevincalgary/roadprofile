-- RoadProfile: moderator decision RPCs and self-service account RPCs.
-- Moderator RPCs are SECURITY DEFINER but each checks
-- current_user_is_moderator() internally before doing anything, so they are
-- safe to expose to any authenticated client — non-moderators simply get a
-- permission error.

create or replace function public.rpc_approve_vin_correction(p_request_id uuid, p_notes text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  req public.vin_correction_requests;
begin
  if not public.current_user_is_moderator() then
    raise exception 'Moderator role required.';
  end if;
  select * into req from public.vin_correction_requests where id = p_request_id and status = 'pending';
  if not found then
    raise exception 'Request not found or already decided.';
  end if;

  update public.vehicles set vin = req.suggested_vin where id = req.vehicle_id;
  update public.vin_correction_requests
    set status = 'approved', moderator_id = auth.uid(), decided_at = now(), decision_notes = p_notes
    where id = p_request_id;

  insert into public.moderation_actions (moderator_id, target_type, target_id, action, reason, notes)
  values (auth.uid(), 'vehicle', req.vehicle_id, 'approve_correction', req.reason, p_notes);

  perform public.notify(req.submitted_by, auth.uid(), 'moderation_update', 'vehicle', req.vehicle_id);
end;
$$;

create or replace function public.rpc_reject_vin_correction(p_request_id uuid, p_notes text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  req public.vin_correction_requests;
begin
  if not public.current_user_is_moderator() then
    raise exception 'Moderator role required.';
  end if;
  select * into req from public.vin_correction_requests where id = p_request_id and status = 'pending';
  if not found then
    raise exception 'Request not found or already decided.';
  end if;

  update public.vin_correction_requests
    set status = 'rejected', moderator_id = auth.uid(), decided_at = now(), decision_notes = p_notes
    where id = p_request_id;

  insert into public.moderation_actions (moderator_id, target_type, target_id, action, reason, notes)
  values (auth.uid(), 'vehicle', req.vehicle_id, 'reject_correction', req.reason, p_notes);

  perform public.notify(req.submitted_by, auth.uid(), 'moderation_update', 'vehicle', req.vehicle_id);
end;
$$;

-- ---------------------------------------------------------------------------
create or replace function public.rpc_approve_detail_revision(p_revision_id uuid, p_notes text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  rev public.vehicle_detail_revisions;
begin
  if not public.current_user_is_moderator() then
    raise exception 'Moderator role required.';
  end if;
  select * into rev from public.vehicle_detail_revisions where id = p_revision_id and status = 'pending';
  if not found then
    raise exception 'Revision not found or already decided.';
  end if;

  if rev.field_name = 'year' then
    execute format('update public.vehicle_details set %I = $1::integer where vehicle_id = $2', rev.field_name)
      using rev.suggested_value, rev.vehicle_id;
  else
    execute format('update public.vehicle_details set %I = $1 where vehicle_id = $2', rev.field_name)
      using rev.suggested_value, rev.vehicle_id;
  end if;

  update public.vehicle_detail_revisions
    set status = 'approved', decided_by = auth.uid(), decided_at = now(), decision_notes = p_notes
    where id = p_revision_id;

  insert into public.moderation_actions (moderator_id, target_type, target_id, action, reason, notes)
  values (auth.uid(), 'vehicle', rev.vehicle_id, 'approve_correction', rev.reason, p_notes);

  perform public.notify(rev.submitted_by, auth.uid(), 'moderation_update', 'vehicle', rev.vehicle_id);
end;
$$;

create or replace function public.rpc_reject_detail_revision(p_revision_id uuid, p_notes text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  rev public.vehicle_detail_revisions;
begin
  if not public.current_user_is_moderator() then
    raise exception 'Moderator role required.';
  end if;
  select * into rev from public.vehicle_detail_revisions where id = p_revision_id and status = 'pending';
  if not found then
    raise exception 'Revision not found or already decided.';
  end if;

  update public.vehicle_detail_revisions
    set status = 'rejected', decided_by = auth.uid(), decided_at = now(), decision_notes = p_notes
    where id = p_revision_id;

  insert into public.moderation_actions (moderator_id, target_type, target_id, action, reason, notes)
  values (auth.uid(), 'vehicle', rev.vehicle_id, 'reject_correction', rev.reason, p_notes);

  perform public.notify(rev.submitted_by, auth.uid(), 'moderation_update', 'vehicle', rev.vehicle_id);
end;
$$;

-- Note: rpc_approve_detail_revision uses a dynamic column update guarded by
-- an allow-list to prevent SQL injection via field_name.
create or replace function public.vehicle_details_editable_columns()
returns text[]
language sql
immutable
as $$
  select array['make', 'model', 'trim', 'body_style', 'exterior_color', 'interior_color', 'engine', 'transmission', 'drivetrain', 'short_description'];
$$;

alter table public.vehicle_detail_revisions
  add constraint field_name_allowlist check (field_name = any (public.vehicle_details_editable_columns() || array['year']));

-- ---------------------------------------------------------------------------
create or replace function public.rpc_merge_vehicles(p_loser_id uuid, p_winner_id uuid, p_request_id uuid default null, p_notes text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.current_user_is_moderator() then
    raise exception 'Moderator role required.';
  end if;
  if p_loser_id = p_winner_id then
    raise exception 'Cannot merge a vehicle into itself.';
  end if;

  update public.records set vehicle_id = p_winner_id where vehicle_id = p_loser_id;

  -- Drop any loser-side rows that would collide with an existing
  -- winner-side row under a unique constraint, then repoint the rest.
  delete from public.list_vehicles lv
  using public.list_vehicles lv2
  where lv.vehicle_id = p_loser_id
    and lv2.vehicle_id = p_winner_id
    and lv2.list_id = lv.list_id;
  update public.list_vehicles set vehicle_id = p_winner_id where vehicle_id = p_loser_id;

  delete from public.follows f
  using public.follows f2
  where f.followee_type = 'vehicle' and f.followee_id = p_loser_id
    and f2.followee_type = 'vehicle' and f2.followee_id = p_winner_id
    and f2.follower_id = f.follower_id;
  update public.follows set followee_id = p_winner_id where followee_type = 'vehicle' and followee_id = p_loser_id;

  update public.vehicles set merged_into_vehicle_id = p_winner_id where id = p_loser_id;

  if p_request_id is not null then
    update public.duplicate_vehicle_requests
      set status = 'approved', moderator_id = auth.uid(), decided_at = now(), merged_into = p_winner_id
      where id = p_request_id;
  end if;

  insert into public.moderation_actions (moderator_id, target_type, target_id, action, reason, notes)
  values (auth.uid(), 'vehicle', p_loser_id, 'merge_vehicles', 'Duplicate vehicle merge', p_notes);
end;
$$;

create or replace function public.rpc_reject_duplicate_request(p_request_id uuid, p_notes text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.current_user_is_moderator() then
    raise exception 'Moderator role required.';
  end if;
  update public.duplicate_vehicle_requests
    set status = 'rejected', moderator_id = auth.uid(), decided_at = now()
    where id = p_request_id and status = 'pending';
end;
$$;

-- ---------------------------------------------------------------------------
create or replace function public.rpc_resolve_report(p_report_id uuid, p_status text, p_notes text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.current_user_is_moderator() then
    raise exception 'Moderator role required.';
  end if;
  if p_status not in ('resolved', 'dismissed', 'reviewing') then
    raise exception 'Invalid status.';
  end if;
  update public.reports
    set status = p_status, resolved_by = auth.uid(), resolved_at = case when p_status in ('resolved','dismissed') then now() else resolved_at end,
        resolution_notes = p_notes
    where id = p_report_id;

  insert into public.moderation_actions (moderator_id, target_type, target_id, action, reason, notes)
  values (auth.uid(), 'report', p_report_id, 'dismiss_report', 'Report review: ' || p_status, p_notes);
end;
$$;

-- ---------------------------------------------------------------------------
create or replace function public.rpc_moderate_user(
  p_target_user_id uuid, p_action text, p_reason text, p_notes text default null, p_expires_at timestamptz default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.current_user_is_moderator() then
    raise exception 'Moderator role required.';
  end if;
  if p_action not in ('warn', 'suspend', 'ban', 'lift_suspension') then
    raise exception 'Invalid action.';
  end if;

  if p_action = 'suspend' then
    update public.user_standing set is_suspended = true, suspended_until = p_expires_at, updated_at = now() where user_id = p_target_user_id;
  elsif p_action = 'ban' then
    update public.user_standing set is_banned = true, updated_at = now() where user_id = p_target_user_id;
  elsif p_action = 'lift_suspension' then
    update public.user_standing set is_suspended = false, suspended_until = null, is_banned = false, updated_at = now() where user_id = p_target_user_id;
  end if;

  insert into public.moderation_actions (moderator_id, target_type, target_id, action, reason, notes, expires_at)
  values (auth.uid(), 'user', p_target_user_id, p_action, p_reason, p_notes, p_expires_at);

  perform public.notify(p_target_user_id, auth.uid(), 'moderation_update', 'user', p_target_user_id);
end;
$$;

-- ---------------------------------------------------------------------------
create or replace function public.rpc_moderate_content(
  p_target_type text, p_target_id uuid, p_action text, p_reason text, p_notes text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_author uuid;
begin
  if not public.current_user_is_moderator() then
    raise exception 'Moderator role required.';
  end if;
  if p_action not in ('remove_content', 'restore_content') then
    raise exception 'Invalid action.';
  end if;

  if p_target_type = 'record' then
    if p_action = 'remove_content' then
      update public.records set deleted_at = now() where id = p_target_id returning author_id into v_author;
    else
      update public.records set deleted_at = null where id = p_target_id returning author_id into v_author;
    end if;
  elsif p_target_type = 'comment' then
    if p_action = 'remove_content' then
      update public.comments set deleted_at = now() where id = p_target_id returning author_id into v_author;
    else
      update public.comments set deleted_at = null where id = p_target_id returning author_id into v_author;
    end if;
  elsif p_target_type = 'reply' then
    if p_action = 'remove_content' then
      update public.replies set deleted_at = now() where id = p_target_id returning author_id into v_author;
    else
      update public.replies set deleted_at = null where id = p_target_id returning author_id into v_author;
    end if;
  else
    raise exception 'Unsupported target_type.';
  end if;

  insert into public.moderation_actions (moderator_id, target_type, target_id, action, reason, notes)
  values (auth.uid(), p_target_type, p_target_id, p_action, p_reason, p_notes);

  if v_author is not null then
    perform public.notify(v_author, auth.uid(), 'moderation_update', p_target_type, p_target_id);
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Self-service: export the caller's own data. Runs as invoker — every
-- sub-select is already scoped to auth.uid(), so no elevated privilege
-- is needed and normal RLS continues to apply.
create or replace function public.rpc_export_my_data()
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select jsonb_build_object(
    'account', (select to_jsonb(u) from public.users u where u.id = auth.uid()),
    'profile', (select to_jsonb(p) from public.profiles p where p.user_id = auth.uid()),
    'vehicles_created', (select coalesce(jsonb_agg(to_jsonb(v)), '[]'::jsonb) from public.vehicles v where v.created_by = auth.uid()),
    'records', (select coalesce(jsonb_agg(to_jsonb(r)), '[]'::jsonb) from public.records r where r.author_id = auth.uid()),
    'comments', (select coalesce(jsonb_agg(to_jsonb(c)), '[]'::jsonb) from public.comments c where c.author_id = auth.uid()),
    'replies', (select coalesce(jsonb_agg(to_jsonb(rp)), '[]'::jsonb) from public.replies rp where rp.author_id = auth.uid()),
    'lists', (select coalesce(jsonb_agg(to_jsonb(l)), '[]'::jsonb) from public.lists l where l.owner_id = auth.uid()),
    'follows', (select coalesce(jsonb_agg(to_jsonb(f)), '[]'::jsonb) from public.follows f where f.follower_id = auth.uid()),
    'bookmarks', (select coalesce(jsonb_agg(to_jsonb(b)), '[]'::jsonb) from public.bookmarks b where b.user_id = auth.uid()),
    'sent_messages', (select coalesce(jsonb_agg(to_jsonb(m)), '[]'::jsonb) from public.messages m where m.sender_id = auth.uid()),
    'generated_at', now()
  );
$$;
