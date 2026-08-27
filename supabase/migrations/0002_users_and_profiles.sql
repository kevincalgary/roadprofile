-- RoadProfile: account-private data (public.users) and public profile data
-- (public.profiles). Split so profile fields can be publicly readable while
-- account fields (privacy settings, acceptance timestamps) never are.

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  minimum_age_confirmed boolean not null default false,
  terms_accepted_at timestamptz,
  privacy_accepted_at timestamptz,
  guidelines_accepted_at timestamptz,
  message_privacy text not null default 'everyone' check (message_privacy in ('everyone', 'followed_only', 'no_one')),
  notify_new_follower boolean not null default true,
  notify_comment boolean not null default true,
  notify_comment_reply boolean not null default true,
  notify_mention boolean not null default true,
  notify_list_invitation boolean not null default true,
  notify_followed_vehicle_contribution boolean not null default true,
  notify_record_correction boolean not null default true,
  notify_moderation_update boolean not null default true,
  notify_message_request boolean not null default true,
  push_token text,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users enable row level security;

create trigger users_touch_updated_at before update on public.users
  for each row execute function public.touch_updated_at();

create policy users_select_own on public.users
  for select using (auth.uid() = id or public.current_user_is_moderator());

create policy users_insert_own on public.users
  for insert with check (auth.uid() = id);

create policy users_update_own on public.users
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- Deliberately NOT `references auth.users(id) on delete cascade`: profiles
-- is the durable identity anchor for public content (records, comments,
-- vehicles created, etc. all reference profiles.user_id, not auth.users.id
-- directly). Account deletion removes the auth.users row and anonymizes
-- this row in place (see supabase/functions/delete-account) rather than
-- deleting it, so "Contributions retain author attribution" holds even
-- after a contributor deletes their account. The insert policy below still
-- only lets the authenticated owner create their own row.
create table public.profiles (
  user_id uuid primary key,
  username citext not null unique,
  display_name text not null,
  avatar_url text,
  location_text text,
  bio text check (char_length(bio) <= 500),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint username_format check (username ~ '^[a-zA-Z0-9_]{3,24}$')
);

alter table public.profiles enable row level security;

create trigger profiles_touch_updated_at before update on public.profiles
  for each row execute function public.touch_updated_at();

create index profiles_username_trgm_idx on public.profiles using gin (username gin_trgm_ops);
create index profiles_display_name_trgm_idx on public.profiles using gin (display_name gin_trgm_ops);

-- Profiles are public by design (usernames, display names, bios are shown on
-- shareable profile URLs); emails and account settings are never in this table.
create policy profiles_select_public on public.profiles
  for select using (true);

create policy profiles_insert_own on public.profiles
  for insert with check (auth.uid() = user_id);

create policy profiles_update_own on public.profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Convenience view: never exposes email/auth fields, safe for anon SELECT.
create view public.public_profiles as
  select
    p.user_id,
    p.username,
    p.display_name,
    p.avatar_url,
    p.location_text,
    p.bio,
    p.is_demo,
    p.created_at
  from public.profiles p;
