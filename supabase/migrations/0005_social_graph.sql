-- RoadProfile: follows, bookmarks, and blocks. Created before comments/
-- messaging so their RLS policies can reference public.blocks.

create table public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references auth.users(id) on delete cascade,
  followee_type text not null check (followee_type in ('user', 'vehicle', 'list')),
  followee_id uuid not null,
  created_at timestamptz not null default now(),
  unique (follower_id, followee_type, followee_id)
);

alter table public.follows enable row level security;

create index follows_followee_idx on public.follows (followee_type, followee_id);
create index follows_follower_idx on public.follows (follower_id);

-- Follow graphs are public (mirrors public follower/following counts shown
-- on profiles, vehicles, and lists).
create policy follows_select_public on public.follows
  for select using (true);

create policy follows_insert_own on public.follows
  for insert with check (auth.uid() = follower_id and public.is_active_standing(auth.uid()));

create policy follows_delete_own on public.follows
  for delete using (auth.uid() = follower_id);

-- ---------------------------------------------------------------------------
create table public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  record_id uuid not null references public.records(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, record_id)
);

alter table public.bookmarks enable row level security;

create index bookmarks_user_idx on public.bookmarks (user_id, created_at desc);

-- Bookmarks are private to the user who saved them.
create policy bookmarks_select_own on public.bookmarks
  for select using (auth.uid() = user_id);

create policy bookmarks_insert_own on public.bookmarks
  for insert with check (auth.uid() = user_id);

create policy bookmarks_delete_own on public.bookmarks
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
create table public.blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_id),
  constraint no_self_block check (blocker_id <> blocked_id)
);

alter table public.blocks enable row level security;

create index blocks_blocker_idx on public.blocks (blocker_id);
create index blocks_blocked_idx on public.blocks (blocked_id);

-- A user may see only the block rows they created (their own block list).
create policy blocks_select_own on public.blocks
  for select using (auth.uid() = blocker_id);

create policy blocks_insert_own on public.blocks
  for insert with check (auth.uid() = blocker_id);

create policy blocks_delete_own on public.blocks
  for delete using (auth.uid() = blocker_id);

-- Now that public.blocks exists, define the pairwise-block helper used by
-- messaging, comments, and follow/mention enforcement.
create or replace function public.is_blocked_pair(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = a and blocked_id = b)
       or (blocker_id = b and blocked_id = a)
  );
$$;

-- Blocking must also stop the blocked user from following the blocker.
create or replace function public.guard_follow_not_blocked()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.followee_type = 'user' and public.is_blocked_pair(new.follower_id, new.followee_id) then
    raise exception 'Cannot follow a user you are blocked by or have blocked.';
  end if;
  return new;
end;
$$;

create trigger follows_guard_not_blocked before insert on public.follows
  for each row execute function public.guard_follow_not_blocked();
