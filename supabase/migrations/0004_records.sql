-- RoadProfile: vehicle history records (the core contribution unit), their
-- photos/documents, and an automatic revision trail.

create table public.records (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  author_id uuid not null references public.profiles(user_id),
  relationship text not null check (relationship in (
    'current_owner', 'former_owner', 'mechanic', 'dealer', 'family_member', 'enthusiast', 'witness', 'other'
  )),
  category text not null check (category in (
    'maintenance', 'repair', 'inspection', 'modification', 'damage', 'recall',
    'sale_auction', 'ownership_experience', 'mileage_update', 'general_history', 'photo_sighting'
  )),
  title text not null check (char_length(title) between 1 and 140),
  description text check (char_length(description) <= 8000),
  symptoms text,
  diagnosis text,
  work_performed text,
  parts_replaced text,
  part_brand_and_numbers text,
  facility_or_technician text,
  cost_amount numeric(10, 2),
  cost_currency text default 'USD',
  cost_is_private boolean not null default true,
  warranty_info text,
  next_service_date date,
  next_service_mileage integer check (next_service_mileage is null or next_service_mileage >= 0),
  event_date date not null,
  mileage integer check (mileage is null or mileage >= 0),
  mileage_unit text check (mileage_unit in ('mi', 'km')),
  location_text text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  is_edited boolean not null default false,
  mileage_inconsistency_flag boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint mileage_requires_unit check (mileage is null or mileage_unit is not null),
  constraint cost_requires_amount_if_currency check (cost_amount is null or cost_amount >= 0)
);

alter table public.records enable row level security;

create index records_vehicle_idx on public.records (vehicle_id, event_date desc) where deleted_at is null;
create index records_author_idx on public.records (author_id);
create index records_category_idx on public.records (vehicle_id, category) where deleted_at is null;
create index records_search_idx on public.records using gin (
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
);

create trigger records_touch_updated_at before update on public.records
  for each row execute function public.touch_updated_at();

-- Published, non-deleted records are public. Drafts are visible only to
-- their author (or a moderator investigating a report).
create policy records_select_published_public on public.records
  for select using (
    (status = 'published' and deleted_at is null)
    or auth.uid() = author_id
    or public.current_user_is_moderator()
  );

create policy records_insert_authenticated on public.records
  for insert with check (
    auth.uid() = author_id and public.is_active_standing(auth.uid())
  );

create policy records_update_own on public.records
  for update using (auth.uid() = author_id or public.current_user_is_moderator())
  with check (auth.uid() = author_id or public.current_user_is_moderator());

-- Soft delete only. Hard DELETE is intentionally not granted to authors —
-- the app always issues UPDATE deleted_at = now() to preserve the audit/
-- revision trail (record_revisions, record_photos, record_documents all
-- cascade on hard delete, which would destroy that history). Only a
-- moderator may hard-delete, for legal/compliance removals.
create policy records_delete_mod_only on public.records
  for delete using (public.current_user_is_moderator());

-- ---------------------------------------------------------------------------
create table public.record_revisions (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references public.records(id) on delete cascade,
  editor_id uuid not null references public.profiles(user_id),
  previous_snapshot jsonb not null,
  changed_at timestamptz not null default now()
);

alter table public.record_revisions enable row level security;

create index record_revisions_record_idx on public.record_revisions (record_id, changed_at desc);

create policy record_revisions_select_public on public.record_revisions
  for select using (true);
-- No client insert policy: populated only by the trigger below (definer).

create or replace function public.capture_record_revision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status = 'published' and (
    new.title is distinct from old.title or
    new.description is distinct from old.description or
    new.category is distinct from old.category or
    new.event_date is distinct from old.event_date or
    new.mileage is distinct from old.mileage or
    new.mileage_unit is distinct from old.mileage_unit or
    new.work_performed is distinct from old.work_performed or
    new.parts_replaced is distinct from old.parts_replaced or
    new.diagnosis is distinct from old.diagnosis or
    new.symptoms is distinct from old.symptoms
  ) then
    insert into public.record_revisions (record_id, editor_id, previous_snapshot)
    values (old.id, auth.uid(), to_jsonb(old));
    new.is_edited := true;
  end if;
  return new;
end;
$$;

create trigger records_capture_revision before update on public.records
  for each row execute function public.capture_record_revision();

create or replace function public.set_record_published_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'published' and old.status = 'draft' then
    new.published_at := now();
  end if;
  return new;
end;
$$;

create trigger records_set_published_at before update on public.records
  for each row execute function public.set_record_published_at();

-- ---------------------------------------------------------------------------
create table public.record_photos (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references public.records(id) on delete cascade,
  url text not null,
  thumbnail_url text,
  position smallint not null check (position between 1 and 5),
  width integer,
  height integer,
  exif_stripped boolean not null default true,
  created_at timestamptz not null default now(),
  unique (record_id, position)
);

alter table public.record_photos enable row level security;

create policy record_photos_select_via_record on public.record_photos
  for select using (
    exists (
      select 1 from public.records r
      where r.id = record_id
        and ((r.status = 'published' and r.deleted_at is null) or r.author_id = auth.uid() or public.current_user_is_moderator())
    )
  );

create policy record_photos_insert_own_record on public.record_photos
  for insert with check (
    exists (select 1 from public.records r where r.id = record_id and r.author_id = auth.uid())
  );

create policy record_photos_delete_own_record on public.record_photos
  for delete using (
    exists (select 1 from public.records r where r.id = record_id and r.author_id = auth.uid())
    or public.current_user_is_moderator()
  );

-- ---------------------------------------------------------------------------
create table public.record_documents (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references public.records(id) on delete cascade,
  url text not null,
  filename text not null,
  doc_type text not null default 'other' check (doc_type in ('receipt', 'invoice', 'other')),
  redaction_ack boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.record_documents enable row level security;

create policy record_documents_select_via_record on public.record_documents
  for select using (
    exists (
      select 1 from public.records r
      where r.id = record_id
        and ((r.status = 'published' and r.deleted_at is null) or r.author_id = auth.uid() or public.current_user_is_moderator())
    )
  );

create policy record_documents_insert_own_record on public.record_documents
  for insert with check (
    redaction_ack = true
    and exists (select 1 from public.records r where r.id = record_id and r.author_id = auth.uid())
  );

create policy record_documents_delete_own_record on public.record_documents
  for delete using (
    exists (select 1 from public.records r where r.id = record_id and r.author_id = auth.uid())
    or public.current_user_is_moderator()
  );

-- ---------------------------------------------------------------------------
-- Mileage-inconsistency detection: flag (never accuse) when a newly
-- published record's mileage is lower than an earlier-dated published
-- record for the same vehicle.
create or replace function public.check_mileage_inconsistency()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  earlier_higher boolean;
begin
  if new.status = 'published' and new.mileage is not null then
    select exists (
      select 1 from public.records r
      where r.vehicle_id = new.vehicle_id
        and r.id <> new.id
        and r.status = 'published'
        and r.deleted_at is null
        and r.mileage is not null
        and r.event_date < new.event_date
        and r.mileage > new.mileage
    ) into earlier_higher;
    new.mileage_inconsistency_flag := coalesce(earlier_higher, false);
  end if;
  return new;
end;
$$;

create trigger records_check_mileage_inconsistency before insert or update on public.records
  for each row execute function public.check_mileage_inconsistency();
