-- RoadProfile: notifications.

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  type text not null check (type in (
    'new_follower', 'new_comment', 'comment_reply', 'mention', 'list_invitation',
    'new_contribution', 'record_correction', 'moderation_update', 'message_request'
  )),
  target_type text,
  target_id uuid,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

create index notifications_recipient_idx on public.notifications (recipient_id, created_at desc);
create index notifications_recipient_unread_idx on public.notifications (recipient_id) where is_read = false;

create policy notifications_select_own on public.notifications
  for select using (recipient_id = auth.uid());

-- Notifications are inserted by SECURITY DEFINER trigger functions (below
-- and in later migrations) or edge functions — never directly by a client,
-- so recipients can't be spoofed.
create policy notifications_update_own on public.notifications
  for update using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());

create or replace function public.notify(
  p_recipient uuid, p_actor uuid, p_type text, p_target_type text, p_target_id uuid
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_recipient = p_actor then
    return; -- never notify users about their own actions
  end if;
  if p_actor is not null and public.is_blocked_pair(p_recipient, p_actor) then
    return;
  end if;
  insert into public.notifications (recipient_id, actor_id, type, target_type, target_id)
  values (p_recipient, p_actor, p_type, p_target_type, p_target_id);
end;
$$;

-- Wire up automatic notifications for the events that originate from
-- straightforward table inserts.
create or replace function public.notify_on_follow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.followee_type = 'user' then
    perform public.notify(new.followee_id, new.follower_id, 'new_follower', 'user', new.followee_id);
  end if;
  return new;
end;
$$;

create trigger follows_notify after insert on public.follows
  for each row execute function public.notify_on_follow();

create or replace function public.notify_on_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_record_author uuid;
begin
  select author_id into v_record_author from public.records where id = new.record_id;
  perform public.notify(v_record_author, new.author_id, 'new_comment', 'record', new.record_id);
  return new;
end;
$$;

create trigger comments_notify after insert on public.comments
  for each row execute function public.notify_on_comment();

create or replace function public.notify_on_reply()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_comment_author uuid;
begin
  select author_id into v_comment_author from public.comments where id = new.comment_id;
  perform public.notify(v_comment_author, new.author_id, 'comment_reply', 'comment', new.comment_id);
  return new;
end;
$$;

create trigger replies_notify after insert on public.replies
  for each row execute function public.notify_on_reply();

create or replace function public.notify_on_list_invitation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify(new.user_id, new.invited_by, 'list_invitation', 'list', new.list_id);
  return new;
end;
$$;

create trigger list_collaborators_notify after insert on public.list_collaborators
  for each row execute function public.notify_on_list_invitation();

-- New contribution to a followed vehicle: fan out to followers on publish.
create or replace function public.notify_followers_on_publish()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  follower record;
begin
  if new.status = 'published' and old.status = 'draft' then
    for follower in
      select follower_id from public.follows
      where followee_type = 'vehicle' and followee_id = new.vehicle_id and follower_id <> new.author_id
    loop
      perform public.notify(follower.follower_id, new.author_id, 'new_contribution', 'record', new.id);
    end loop;
  end if;
  return new;
end;
$$;

create trigger records_notify_followers after update on public.records
  for each row execute function public.notify_followers_on_publish();

-- Simple @mention detection: any @username found in a comment/reply body
-- that matches an existing profile gets a mention notification.
create or replace function public.notify_mentions_in_text(p_body text, p_actor uuid, p_target_type text, p_target_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  handle text;
  mentioned_user uuid;
begin
  for handle in select (regexp_matches(p_body, '@([a-zA-Z0-9_]{3,24})', 'g'))[1] loop
    select user_id into mentioned_user from public.profiles where username = handle::citext;
    if mentioned_user is not null then
      perform public.notify(mentioned_user, p_actor, 'mention', p_target_type, p_target_id);
    end if;
  end loop;
end;
$$;

create or replace function public.comments_notify_mentions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_mentions_in_text(new.body, new.author_id, 'comment', new.id);
  return new;
end;
$$;

create trigger comments_mentions_notify after insert on public.comments
  for each row execute function public.comments_notify_mentions();

create or replace function public.replies_notify_mentions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_mentions_in_text(new.body, new.author_id, 'comment', new.comment_id);
  return new;
end;
$$;

create trigger replies_mentions_notify after insert on public.replies
  for each row execute function public.replies_notify_mentions();
