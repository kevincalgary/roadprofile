-- RoadProfile: vehicles, their correctable specification data, and the
-- revision trail for corrections. VIN is normalized (uppercase, no
-- separators) but never re-guessed or auto-corrected character-by-character.

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  vin text not null,
  vin_length smallint generated always as (char_length(vin)) stored,
  is_short_vin_exception boolean not null default false,
  short_vin_exception_approved_by uuid references public.profiles(user_id),
  short_vin_exception_approved_at timestamptz,
  cover_photo_url text,
  created_by uuid not null references public.profiles(user_id),
  merged_into_vehicle_id uuid references public.vehicles(id),
  is_flagged boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vin_charset check (vin ~ '^[A-HJ-NPR-Z0-9]+$'),
  constraint vin_length_range check (char_length(vin) between 5 and 17),
  constraint vin_modern_length_requires_no_exception check (
    char_length(vin) = 17 or is_short_vin_exception = true
  ),
  constraint vin_is_uppercase check (vin = upper(vin))
);

-- Duplicate-VIN prevention. Only enforced for non-merged vehicles so a
-- moderator-approved merge can retire the losing record's VIN safely.
create unique index vehicles_vin_unique_idx on public.vehicles (vin)
  where merged_into_vehicle_id is null;

create index vehicles_vin_trgm_idx on public.vehicles using gin (vin gin_trgm_ops);

alter table public.vehicles enable row level security;

create trigger vehicles_touch_updated_at before update on public.vehicles
  for each row execute function public.touch_updated_at();

-- Vehicle profiles are public and searchable by anyone, including anon.
create policy vehicles_select_public on public.vehicles
  for select using (true);

-- A short-VIN exception is auto-flagged (is_flagged) for moderator review,
-- but the exception must not appear pre-approved: a non-moderator insert
-- can never set short_vin_exception_approved_by/_at itself (only a
-- moderator UPDATE, guarded by guard_vehicle_protected_fields below, may).
create policy vehicles_insert_authenticated on public.vehicles
  for insert with check (
    auth.uid() = created_by
    and public.is_active_standing(auth.uid())
    and (
      public.current_user_is_moderator()
      or (short_vin_exception_approved_by is null and short_vin_exception_approved_at is null)
    )
  );

-- Core identity fields (vin, merges) are moderator-controlled; any active
-- contributor may otherwise update a vehicle row (e.g. its cover photo) —
-- a trigger below rejects attempts to change protected fields unless the
-- actor is a moderator.
create policy vehicles_update_authenticated on public.vehicles
  for update using (public.is_active_standing(auth.uid()))
  with check (public.is_active_standing(auth.uid()));

create or replace function public.guard_vehicle_protected_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.current_user_is_moderator() then
    if new.vin is distinct from old.vin
      or new.merged_into_vehicle_id is distinct from old.merged_into_vehicle_id
      or new.created_by is distinct from old.created_by
      or new.is_short_vin_exception is distinct from old.is_short_vin_exception
    then
      raise exception 'Only a moderator can change VIN, merge status, or exception flags.';
    end if;
  end if;
  return new;
end;
$$;

create trigger vehicles_guard_protected_fields before update on public.vehicles
  for each row execute function public.guard_vehicle_protected_fields();

-- ---------------------------------------------------------------------------
-- Current specification fields, editable only through the correction /
-- revision workflow below (client never updates this table directly).
-- ---------------------------------------------------------------------------
create table public.vehicle_details (
  vehicle_id uuid primary key references public.vehicles(id) on delete cascade,
  year integer not null check (year between 1885 and extract(year from now())::int + 2),
  make text not null,
  model text not null,
  trim text,
  body_style text,
  exterior_color text,
  interior_color text,
  engine text,
  transmission text,
  drivetrain text,
  short_description text check (char_length(short_description) <= 1000),
  data_status text not null default 'community_submitted' check (data_status in ('community_submitted', 'verified')),
  updated_at timestamptz not null default now()
);

alter table public.vehicle_details enable row level security;

create trigger vehicle_details_touch_updated_at before update on public.vehicle_details
  for each row execute function public.touch_updated_at();

create policy vehicle_details_select_public on public.vehicle_details
  for select using (true);

-- Insert only happens once, at vehicle-creation time, by the creator.
create policy vehicle_details_insert_creator on public.vehicle_details
  for insert with check (
    exists (
      select 1 from public.vehicles v
      where v.id = vehicle_id and v.created_by = auth.uid()
    )
  );

-- All subsequent field changes go through moderator-approved corrections.
create policy vehicle_details_update_moderator on public.vehicle_details
  for update using (public.current_user_is_moderator())
  with check (public.current_user_is_moderator());

-- ---------------------------------------------------------------------------
create table public.vehicle_detail_revisions (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  field_name text not null,
  original_value text,
  suggested_value text,
  reason text not null,
  evidence_urls text[] not null default '{}',
  submitted_by uuid not null references public.profiles(user_id),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  decided_by uuid references public.profiles(user_id),
  decided_at timestamptz,
  decision_notes text,
  created_at timestamptz not null default now()
);

alter table public.vehicle_detail_revisions enable row level security;

create index vehicle_detail_revisions_vehicle_idx on public.vehicle_detail_revisions (vehicle_id, created_at desc);

-- Revision history is public (transparency of what's been corrected/disputed).
create policy vehicle_detail_revisions_select_public on public.vehicle_detail_revisions
  for select using (true);

create policy vehicle_detail_revisions_insert_authenticated on public.vehicle_detail_revisions
  for insert with check (
    auth.uid() = submitted_by and public.is_active_standing(auth.uid())
  );

create policy vehicle_detail_revisions_update_moderator on public.vehicle_detail_revisions
  for update using (public.current_user_is_moderator())
  with check (public.current_user_is_moderator());
