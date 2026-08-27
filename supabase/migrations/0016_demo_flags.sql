-- RoadProfile: explicit demo-data flags so seeded fictional content can
-- always be labeled "Demo data" in the UI and excluded from production
-- exports/reports if desired.

alter table public.vehicles add column is_demo boolean not null default false;
alter table public.records add column is_demo boolean not null default false;
alter table public.lists add column is_demo boolean not null default false;
