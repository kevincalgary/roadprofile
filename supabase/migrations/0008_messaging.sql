-- RoadProfile: one-to-one private messaging. No group chats, no calls,
-- no arbitrary file attachments — only text/emoji and shared internal
-- object references (vehicle, record, list, profile).

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);

alter table public.conversations enable row level security;

create table public.conversation_members (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  is_request_pending boolean not null default false,
  muted boolean not null default false,
  deleted_at timestamptz,
  last_read_at timestamptz,
  unique (conversation_id, user_id)
);

alter table public.conversation_members enable row level security;

create index conversation_members_user_idx on public.conversation_members (user_id);

create or replace function public.is_conversation_member(target_conversation_id uuid, uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.conversation_members cm
    where cm.conversation_id = target_conversation_id and cm.user_id = uid
  );
$$;

-- Enforce exactly two distinct, non-blocked members per conversation.
create or replace function public.guard_conversation_member_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  member_count integer;
  other_member uuid;
begin
  select count(*) into member_count from public.conversation_members where conversation_id = new.conversation_id;
  if member_count >= 2 then
    raise exception 'RoadProfile conversations are one-to-one only.';
  end if;
  select user_id into other_member from public.conversation_members where conversation_id = new.conversation_id limit 1;
  if other_member is not null and public.is_blocked_pair(other_member, new.user_id) then
    raise exception 'Cannot start a conversation with a blocked user.';
  end if;
  return new;
end;
$$;

create trigger conversation_members_guard before insert on public.conversation_members
  for each row execute function public.guard_conversation_member_insert();

create policy conversations_select_member on public.conversations
  for select using (public.is_conversation_member(id, auth.uid()));

-- Conversations are created via an edge function using the service role
-- (so both members can be inserted atomically); no direct client insert.
create policy conversation_members_select_member on public.conversation_members
  for select using (public.is_conversation_member(conversation_id, auth.uid()));

create policy conversation_members_update_own on public.conversation_members
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text check (char_length(body) <= 2000),
  shared_object_type text check (shared_object_type in ('vehicle', 'record', 'list', 'profile')),
  shared_object_id uuid,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint body_or_share check (body is not null or shared_object_type is not null)
);

alter table public.messages enable row level security;

create index messages_conversation_idx on public.messages (conversation_id, created_at);

create policy messages_select_member on public.messages
  for select using (public.is_conversation_member(conversation_id, auth.uid()));

create policy messages_insert_member on public.messages
  for insert with check (
    sender_id = auth.uid()
    and public.is_active_standing(auth.uid())
    and public.is_conversation_member(conversation_id, auth.uid())
  );

create policy messages_update_own on public.messages
  for update using (sender_id = auth.uid()) with check (sender_id = auth.uid());

create or replace function public.touch_conversation_last_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations set last_message_at = new.created_at where id = new.conversation_id;
  return new;
end;
$$;

create trigger messages_touch_conversation after insert on public.messages
  for each row execute function public.touch_conversation_last_message();

-- ---------------------------------------------------------------------------
create table public.message_reads (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  read_at timestamptz not null default now(),
  unique (message_id, user_id)
);

alter table public.message_reads enable row level security;

create policy message_reads_select_member on public.message_reads
  for select using (
    exists (
      select 1 from public.messages m
      where m.id = message_id and public.is_conversation_member(m.conversation_id, auth.uid())
    )
  );

create policy message_reads_insert_own on public.message_reads
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.messages m
      where m.id = message_id and public.is_conversation_member(m.conversation_id, auth.uid())
    )
  );
