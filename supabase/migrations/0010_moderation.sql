-- RoadProfile: reports, moderation actions, VIN correction requests, and
-- duplicate-vehicle merge requests. All moderator-facing.

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(user_id),
  target_type text not null check (target_type in ('record', 'comment', 'reply', 'message', 'user', 'list', 'vehicle')),
  target_id uuid not null,
  reason text not null check (reason in (
    'spam', 'harassment', 'sensitive_information', 'incorrect_vin', 'duplicate_vehicle',
    'inappropriate_content', 'impersonation', 'unsupported_accusation', 'other'
  )),
  details text check (char_length(details) <= 2000),
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  resolved_by uuid references public.profiles(user_id),
  resolved_at timestamptz,
  resolution_notes text,
  created_at timestamptz not null default now()
);

alter table public.reports enable row level security;

create index reports_status_idx on public.reports (status, created_at desc);
create index reports_target_idx on public.reports (target_type, target_id);

create policy reports_select_own_or_mod on public.reports
  for select using (reporter_id = auth.uid() or public.current_user_is_moderator());

create policy reports_insert_authenticated on public.reports
  for insert with check (reporter_id = auth.uid() and public.is_active_standing(auth.uid()));

create policy reports_update_moderator on public.reports
  for update using (public.current_user_is_moderator()) with check (public.current_user_is_moderator());

-- ---------------------------------------------------------------------------
create table public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  moderator_id uuid not null references public.profiles(user_id),
  target_type text not null check (target_type in ('record', 'comment', 'reply', 'user', 'vehicle', 'list', 'report')),
  target_id uuid not null,
  action text not null check (action in (
    'warn', 'suspend', 'ban', 'lift_suspension', 'remove_content', 'restore_content',
    'merge_vehicles', 'approve_correction', 'reject_correction', 'dismiss_report'
  )),
  reason text not null,
  notes text,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.moderation_actions enable row level security;

create index moderation_actions_target_idx on public.moderation_actions (target_type, target_id, created_at desc);

create policy moderation_actions_select_mod on public.moderation_actions
  for select using (public.current_user_is_moderator());

create policy moderation_actions_insert_mod on public.moderation_actions
  for insert with check (public.current_user_is_moderator() and moderator_id = auth.uid());

-- ---------------------------------------------------------------------------
create table public.vin_correction_requests (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  original_vin text not null,
  suggested_vin text not null,
  reason text not null,
  evidence_urls text[] not null default '{}',
  submitted_by uuid not null references public.profiles(user_id),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  moderator_id uuid references public.profiles(user_id),
  decided_at timestamptz,
  decision_notes text,
  created_at timestamptz not null default now(),
  constraint suggested_vin_charset check (suggested_vin ~ '^[A-HJ-NPR-Z0-9]+$')
);

alter table public.vin_correction_requests enable row level security;

create index vin_correction_requests_status_idx on public.vin_correction_requests (status, created_at desc);

create policy vin_correction_requests_select on public.vin_correction_requests
  for select using (submitted_by = auth.uid() or public.current_user_is_moderator());

create policy vin_correction_requests_insert on public.vin_correction_requests
  for insert with check (submitted_by = auth.uid() and public.is_active_standing(auth.uid()));

create policy vin_correction_requests_update_mod on public.vin_correction_requests
  for update using (public.current_user_is_moderator()) with check (public.current_user_is_moderator());

-- ---------------------------------------------------------------------------
create table public.duplicate_vehicle_requests (
  id uuid primary key default gen_random_uuid(),
  vehicle_id_a uuid not null references public.vehicles(id) on delete cascade,
  vehicle_id_b uuid not null references public.vehicles(id) on delete cascade,
  reason text not null,
  evidence_urls text[] not null default '{}',
  submitted_by uuid not null references public.profiles(user_id),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  moderator_id uuid references public.profiles(user_id),
  decided_at timestamptz,
  merged_into uuid references public.vehicles(id),
  created_at timestamptz not null default now(),
  constraint distinct_vehicles check (vehicle_id_a <> vehicle_id_b)
);

alter table public.duplicate_vehicle_requests enable row level security;

create index duplicate_vehicle_requests_status_idx on public.duplicate_vehicle_requests (status, created_at desc);

create policy duplicate_vehicle_requests_select on public.duplicate_vehicle_requests
  for select using (submitted_by = auth.uid() or public.current_user_is_moderator());

create policy duplicate_vehicle_requests_insert on public.duplicate_vehicle_requests
  for insert with check (submitted_by = auth.uid() and public.is_active_standing(auth.uid()));

create policy duplicate_vehicle_requests_update_mod on public.duplicate_vehicle_requests
  for update using (public.current_user_is_moderator()) with check (public.current_user_is_moderator());
