-- RoadProfile: search RPCs combining exact/partial VIN, year/make/model,
-- and keyword search across public content. All security_invoker so RLS
-- on underlying tables still applies (drafts/private lists stay hidden).

create or replace function public.search_vehicles(q text, max_results int default 20)
returns setof public.vehicles
language sql
stable
security invoker
set search_path = public
as $$
  select v.* from public.vehicles v
  left join public.vehicle_details d on d.vehicle_id = v.id
  where v.merged_into_vehicle_id is null
    and (
      v.vin ilike (upper(regexp_replace(q, '[^a-zA-Z0-9]', '', 'g')) || '%')
      or v.vin ilike ('%' || upper(regexp_replace(q, '[^a-zA-Z0-9]', '', 'g')) || '%')
      or d.make ilike ('%' || q || '%')
      or d.model ilike ('%' || q || '%')
      or d.trim ilike ('%' || q || '%')
      or d.year::text = q
    )
  order by (v.vin = upper(regexp_replace(q, '[^a-zA-Z0-9]', '', 'g'))) desc, v.created_at desc
  limit max_results;
$$;

create or replace function public.search_records(q text, max_results int default 20)
returns setof public.records
language sql
stable
security invoker
set search_path = public
as $$
  select r.* from public.records r
  where r.status = 'published' and r.deleted_at is null
    and to_tsvector('english', coalesce(r.title, '') || ' ' || coalesce(r.description, ''))
      @@ plainto_tsquery('english', q)
  order by r.event_date desc
  limit max_results;
$$;

create or replace function public.search_profiles(q text, max_results int default 20)
returns setof public.profiles
language sql
stable
security invoker
set search_path = public
as $$
  select p.* from public.profiles p
  where p.username ilike ('%' || q || '%') or p.display_name ilike ('%' || q || '%')
  order by (p.username ilike (q || '%')) desc
  limit max_results;
$$;

create or replace function public.search_lists(q text, max_results int default 20)
returns setof public.lists
language sql
stable
security invoker
set search_path = public
as $$
  select l.* from public.lists l
  where l.is_public and (l.name ilike ('%' || q || '%') or l.description ilike ('%' || q || '%'))
  order by l.created_at desc
  limit max_results;
$$;
