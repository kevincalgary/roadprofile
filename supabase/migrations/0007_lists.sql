-- RoadProfile: curated vehicle lists, their membership, and collaborators.

create table public.lists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(user_id),
  name text not null check (char_length(name) between 1 and 100),
  description text check (char_length(description) <= 1000),
  cover_image_url text,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.lists enable row level security;

create trigger lists_touch_updated_at before update on public.lists
  for each row execute function public.touch_updated_at();

create index lists_owner_idx on public.lists (owner_id);

create policy lists_select_visible on public.lists
  for select using (
    is_public
    or owner_id = auth.uid()
    or exists (select 1 from public.list_collaborators lc where lc.list_id = id and lc.user_id = auth.uid() and lc.accepted)
    or public.current_user_is_moderator()
  );

create policy lists_insert_own on public.lists
  for insert with check (auth.uid() = owner_id and public.is_active_standing(auth.uid()));

create policy lists_update_owner on public.lists
  for update using (auth.uid() = owner_id or public.current_user_is_moderator())
  with check (auth.uid() = owner_id or public.current_user_is_moderator());

create policy lists_delete_owner on public.lists
  for delete using (auth.uid() = owner_id or public.current_user_is_moderator());

-- ---------------------------------------------------------------------------
create table public.list_collaborators (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id),
  invited_by uuid not null references public.profiles(user_id),
  accepted boolean not null default false,
  created_at timestamptz not null default now(),
  unique (list_id, user_id)
);

alter table public.list_collaborators enable row level security;

create policy list_collaborators_select_involved on public.list_collaborators
  for select using (
    user_id = auth.uid()
    or exists (select 1 from public.lists l where l.id = list_id and l.owner_id = auth.uid())
  );

create policy list_collaborators_insert_owner on public.list_collaborators
  for insert with check (
    exists (select 1 from public.lists l where l.id = list_id and l.owner_id = auth.uid())
  );

-- Invited user accepts/declines their own row; owner can remove collaborators.
create policy list_collaborators_update_invitee on public.list_collaborators
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy list_collaborators_delete_owner_or_self on public.list_collaborators
  for delete using (
    user_id = auth.uid()
    or exists (select 1 from public.lists l where l.id = list_id and l.owner_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
create table public.list_vehicles (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  position integer not null default 0,
  added_by uuid not null references public.profiles(user_id),
  added_at timestamptz not null default now(),
  unique (list_id, vehicle_id)
);

alter table public.list_vehicles enable row level security;

create index list_vehicles_list_idx on public.list_vehicles (list_id, position);

create or replace function public.can_edit_list(target_list_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.lists l
    where l.id = target_list_id and l.owner_id = auth.uid()
  ) or exists (
    select 1 from public.list_collaborators lc
    where lc.list_id = target_list_id and lc.user_id = auth.uid() and lc.accepted
  );
$$;

create policy list_vehicles_select_visible on public.list_vehicles
  for select using (
    exists (
      select 1 from public.lists l
      where l.id = list_id and (
        l.is_public or l.owner_id = auth.uid() or public.can_edit_list(list_id) or public.current_user_is_moderator()
      )
    )
  );

create policy list_vehicles_insert_editor on public.list_vehicles
  for insert with check (public.can_edit_list(list_id) and public.is_active_standing(auth.uid()));

create policy list_vehicles_update_editor on public.list_vehicles
  for update using (public.can_edit_list(list_id)) with check (public.can_edit_list(list_id));

create policy list_vehicles_delete_editor on public.list_vehicles
  for delete using (public.can_edit_list(list_id));
