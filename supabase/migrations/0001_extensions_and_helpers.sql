-- RoadProfile: extensions, enums, and security-definer helper functions
-- Helper functions here are used throughout RLS policies in later migrations.

create extension if not exists "pgcrypto";
create extension if not exists "citext";
create extension if not exists "pg_trgm"; -- trigram search for VIN/keyword lookups

-- ---------------------------------------------------------------------------
-- Roles (kept in a table the client can never write to; only service_role
-- or a moderator-invoked edge function may insert/update it)
-- ---------------------------------------------------------------------------
create table public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('user', 'moderator', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_roles enable row level security;

create or replace function public.is_moderator(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = uid and role in ('moderator', 'admin')
  );
$$;

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = uid and role = 'admin'
  );
$$;

create or replace function public.current_user_is_moderator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_moderator(auth.uid());
$$;

-- Row-owner-only visibility of one's own role; moderators can see all roles.
create policy user_roles_select_own_or_mod on public.user_roles
  for select using (auth.uid() = user_id or public.current_user_is_moderator());
-- Deliberately no insert/update/delete policy: only service_role (which
-- bypasses RLS) or a SECURITY DEFINER edge function may change roles.

-- ---------------------------------------------------------------------------
-- Suspension / ban state lives here so RLS across many tables can check it
-- without joining to a mutable client-writable table.
-- ---------------------------------------------------------------------------
create table public.user_standing (
  user_id uuid primary key references auth.users(id) on delete cascade,
  is_suspended boolean not null default false,
  suspended_until timestamptz,
  is_banned boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.user_standing enable row level security;

create or replace function public.is_active_standing(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select not (is_banned or (is_suspended and (suspended_until is null or suspended_until > now())))
    from public.user_standing
    where user_id = uid
  ), true);
$$;

create policy user_standing_select_own_or_mod on public.user_standing
  for select using (auth.uid() = user_id or public.current_user_is_moderator());

-- Note: is_blocked_pair() is defined in 0006_social_graph.sql, once the
-- public.blocks table it queries exists (SQL-language functions resolve
-- referenced objects at CREATE FUNCTION time).

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
