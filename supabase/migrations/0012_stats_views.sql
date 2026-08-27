-- RoadProfile: read-optimized aggregate views for counts shown in the UI.
-- Views inherit RLS from their underlying tables (security_invoker) so they
-- never leak rows a caller couldn't otherwise see.

create view public.vehicle_stats
  with (security_invoker = true) as
select
  v.id as vehicle_id,
  count(distinct r.id) filter (where r.status = 'published' and r.deleted_at is null) as post_count,
  count(distinct r.author_id) filter (where r.status = 'published' and r.deleted_at is null) as contributor_count,
  (select count(*) from public.follows f where f.followee_type = 'vehicle' and f.followee_id = v.id) as follower_count,
  (
    select r2.mileage from public.records r2
    where r2.vehicle_id = v.id and r2.status = 'published' and r2.deleted_at is null and r2.mileage is not null
    order by r2.event_date desc, r2.created_at desc
    limit 1
  ) as latest_mileage,
  (
    select r2.mileage_unit from public.records r2
    where r2.vehicle_id = v.id and r2.status = 'published' and r2.deleted_at is null and r2.mileage is not null
    order by r2.event_date desc, r2.created_at desc
    limit 1
  ) as latest_mileage_unit
from public.vehicles v
left join public.records r on r.vehicle_id = v.id
group by v.id;

create view public.list_stats
  with (security_invoker = true) as
select
  l.id as list_id,
  count(distinct lv.vehicle_id) as vehicle_count,
  (select count(*) from public.follows f where f.followee_type = 'list' and f.followee_id = l.id) as follower_count
from public.lists l
left join public.list_vehicles lv on lv.list_id = l.id
group by l.id;

create view public.profile_stats
  with (security_invoker = true) as
select
  p.user_id,
  (select count(*) from public.follows f where f.followee_type = 'user' and f.followee_id = p.user_id) as follower_count,
  (select count(*) from public.follows f where f.follower_id = p.user_id and f.followee_type = 'user') as following_count,
  (select count(*) from public.records r where r.author_id = p.user_id and r.status = 'published' and r.deleted_at is null) as post_count
from public.profiles p;

create view public.unread_notification_counts
  with (security_invoker = true) as
select recipient_id as user_id, count(*) as unread_count
from public.notifications
where is_read = false
group by recipient_id;

create view public.unread_message_counts
  with (security_invoker = true) as
select
  cm.user_id,
  count(*) as unread_count
from public.conversation_members cm
join public.messages m on m.conversation_id = cm.conversation_id
  and m.created_at > coalesce(cm.last_read_at, 'epoch'::timestamptz)
  and m.sender_id <> cm.user_id
where cm.deleted_at is null
group by cm.user_id;
