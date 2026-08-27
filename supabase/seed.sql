-- RoadProfile demo/dev seed data.
-- Entirely fictional users, vehicles, VINs, records, lists, comments,
-- notifications, and conversations. No names, photos, or VINs from any
-- reference material. All demo rows are flagged is_demo = true where
-- applicable so the UI can show a "Demo data" badge.
--
-- Run via `supabase db reset` (applies migrations then this file) in a
-- local/dev project only. Never run against production.

-- ---------------------------------------------------------------------------
-- 1. Fictional auth users + identities (local/dev only)
-- ---------------------------------------------------------------------------
-- Password for every seed account: "RoadProfileDemo123!"

do $$
declare
  pw text := crypt('RoadProfileDemo123!', gen_salt('bf'));
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values
    ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'demo.mara@example.com', pw, now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'demo.theo@example.com', pw, now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'demo.priya@example.com', pw, now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'demo.jules@example.com', pw, now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-4000-8000-000000000005', 'authenticated', 'authenticated', 'demo.wyatt@example.com', pw, now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-4000-8000-000000000006', 'authenticated', 'authenticated', 'demo.sana@example.com', pw, now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-4000-8000-000000000007', 'authenticated', 'authenticated', 'demo.finn@example.com', pw, now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-4000-8000-000000000008', 'authenticated', 'authenticated', 'demo.moderator@example.com', pw, now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '')
  on conflict (id) do nothing;

  insert into auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  select gen_random_uuid(), u.id::text, u.id,
    jsonb_build_object('sub', u.id::text, 'email', u.email),
    'email', now(), now(), now()
  from auth.users u
  where u.id::text like 'a0000000-0000-4000-8000-%'
  on conflict do nothing;
end $$;

-- public.users / user_roles / user_standing rows are created automatically
-- by the on_auth_user_created trigger. Promote the moderator account.
update public.user_roles set role = 'moderator' where user_id = 'a0000000-0000-4000-8000-000000000008';
update public.users set onboarding_completed = true, minimum_age_confirmed = true,
  terms_accepted_at = now(), privacy_accepted_at = now(), guidelines_accepted_at = now()
  where id::text like 'a0000000-0000-4000-8000-%';

-- ---------------------------------------------------------------------------
-- 2. Profiles
-- ---------------------------------------------------------------------------
insert into public.profiles (user_id, username, display_name, avatar_url, location_text, bio, is_demo) values
  ('a0000000-0000-4000-8000-000000000001', 'mara_overland', 'Mara Ionescu', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&h=256&fit=crop', 'Portland, OR', 'Daily driver mechanic. I fix what I break.', true),
  ('a0000000-0000-4000-8000-000000000002', 'theo_wrench', 'Theo Bergman', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=256&h=256&fit=crop', 'Austin, TX', 'Independent shop owner, 15 years turning wrenches.', true),
  ('a0000000-0000-4000-8000-000000000003', 'priya_drives', 'Priya Nair', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=256&h=256&fit=crop', 'Toronto, ON', 'Second owner of a very tired hatchback.', true),
  ('a0000000-0000-4000-8000-000000000004', 'jules_offroad', 'Jules Fontaine', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=256&h=256&fit=crop', 'Denver, CO', 'Overlanding and suspension nerd.', true),
  ('a0000000-0000-4000-8000-000000000005', 'wyatt_classics', 'Wyatt Coleman', 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=256&h=256&fit=crop', 'Nashville, TN', 'Restoring one project at a time.', true),
  ('a0000000-0000-4000-8000-000000000006', 'sana_ev', 'Sana Rahimi', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=256&h=256&fit=crop', 'Seattle, WA', 'EV convert, tracking every mile.', true),
  ('a0000000-0000-4000-8000-000000000007', 'finn_dealer', 'Finn Ahern', 'https://images.unsplash.com/photo-1546456073-92b9f0a8d413?w=256&h=256&fit=crop', 'Columbus, OH', 'Used car dealer. I read history reports for fun.', true),
  ('a0000000-0000-4000-8000-000000000008', 'rp_moderator', 'RoadProfile Moderation', null, 'Remote', 'RoadProfile community moderation team.', true);

-- ---------------------------------------------------------------------------
-- 3. Vehicles + vehicle_details
-- ---------------------------------------------------------------------------
insert into public.vehicles (id, vin, cover_photo_url, created_by, is_demo) values
  ('b0000000-0000-4000-8000-000000000001', '1HGCM82633A004352', 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1200&h=800&fit=crop', 'a0000000-0000-4000-8000-000000000001', true),
  ('b0000000-0000-4000-8000-000000000002', 'JH4KA7650MC012345', 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&h=800&fit=crop', 'a0000000-0000-4000-8000-000000000004', true),
  ('b0000000-0000-4000-8000-000000000003', '5YJ3E1EA7KF317000', 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=1200&h=800&fit=crop', 'a0000000-0000-4000-8000-000000000006', true),
  ('b0000000-0000-4000-8000-000000000004', 'WBAAM3348VFM12345', 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200&h=800&fit=crop', 'a0000000-0000-4000-8000-000000000005', true),
  ('b0000000-0000-4000-8000-000000000005', '1FTFW1ET5BFC12345', 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200&h=800&fit=crop', 'a0000000-0000-4000-8000-000000000003', true);

insert into public.vehicle_details (vehicle_id, year, make, model, trim, body_style, exterior_color, interior_color, engine, transmission, drivetrain, short_description, data_status) values
  ('b0000000-0000-4000-8000-000000000001', 2003, 'Honda', 'Accord', 'EX', 'Sedan', 'Satin Silver', 'Gray Cloth', '2.4L I4', '5-speed automatic', 'FWD', 'High-mileage commuter, meticulously maintained since 2015.', 'community_submitted'),
  ('b0000000-0000-4000-8000-000000000002', 1991, 'Acura', 'NSX', 'Base', 'Coupe', 'Formula Red', 'Black Leather', '3.0L V6', '5-speed manual', 'RWD', 'Weekend driver, mostly original.', 'community_submitted'),
  ('b0000000-0000-4000-8000-000000000003', 2019, 'Tesla', 'Model 3', 'Long Range', 'Sedan', 'Pearl White', 'Black', 'Dual Motor Electric', '1-speed automatic', 'AWD', 'Daily driver, supercharger-heavy road trips.', 'community_submitted'),
  ('b0000000-0000-4000-8000-000000000004', 1997, 'BMW', 'M3', 'Base', 'Coupe', 'Estoril Blue', 'Tan Leather', '3.2L I6', '5-speed manual', 'RWD', 'Track-day car, roll bar installed.', 'community_submitted'),
  ('b0000000-0000-4000-8000-000000000005', 2011, 'Ford', 'F-150', 'XLT', 'Pickup', 'Oxford White', 'Gray Cloth', '5.0L V8', '6-speed automatic', 'RWD', 'Work truck, previously fleet-owned.', 'community_submitted');

-- ---------------------------------------------------------------------------
-- 4. Records across categories (published)
-- ---------------------------------------------------------------------------
insert into public.records (id, vehicle_id, author_id, relationship, category, title, description, work_performed, parts_replaced, facility_or_technician, event_date, mileage, mileage_unit, location_text, status, is_demo) values
  ('c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'current_owner', 'maintenance', 'Timing belt and water pump service', 'Preventive service at the manufacturer-recommended interval, done proactively before any symptoms appeared.', 'Replaced timing belt, water pump, tensioner, and idler pulley.', 'Timing belt kit, water pump', 'Riverside Import Service', '2023-04-12', 128400, 'mi', 'Portland, OR', 'published', true),
  ('c0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002', 'mechanic', 'repair', 'Front brake rotors and pads', 'Customer reported a pulsation under braking above 40 mph.', 'Machined found unusable, replaced rotors and pads front axle.', 'Brake rotors, ceramic pads', 'Bergman Auto Repair', '2022-11-02', 121980, 'mi', 'Austin, TX', 'published', true),
  ('c0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'current_owner', 'mileage_update', 'Odometer check-in', 'Routine mileage log entry.', null, null, null, '2024-01-20', 131500, 'mi', 'Portland, OR', 'published', true),
  ('c0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000004', 'current_owner', 'modification', 'Suspension refresh with OEM-spec dampers', 'Replaced tired factory shocks to restore ride height and handling.', 'Installed new dampers and springs all four corners.', 'OEM-spec dampers, progressive springs', null, '2023-08-05', 68210, 'mi', 'Denver, CO', 'published', true),
  ('c0000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000005', 'enthusiast', 'ownership_experience', 'Test drove this car in 2019', 'Rode along when the previous owner was considering selling. Ran strong, no leaks noticed at the time.', null, null, null, '2019-06-14', 61000, 'mi', 'Denver, CO', 'published', true),
  ('c0000000-0000-4000-8000-000000000006', 'b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000006', 'current_owner', 'mileage_update', 'Year-end mileage log', 'Annual check-in.', null, null, null, '2023-12-30', 42100, 'mi', 'Seattle, WA', 'published', true),
  ('c0000000-0000-4000-8000-000000000007', 'b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000006', 'current_owner', 'repair', '12V battery replacement', 'Vehicle failed to wake from sleep one morning.', 'Replaced low-voltage auxiliary battery under warranty.', '12V auxiliary battery', 'Service Center - Seattle', '2023-03-18', 31850, 'mi', 'Seattle, WA', 'published', true),
  ('c0000000-0000-4000-8000-000000000008', 'b0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000005', 'current_owner', 'damage', 'Curbed front wheel at track day', 'Clipped an apex curb during an open-track event, cosmetic rim damage only.', 'Inspected suspension and alignment, no structural damage found.', null, 'Track-day tech inspection', '2022-09-10', 89210, 'mi', 'Nashville, TN', 'published', true),
  ('c0000000-0000-4000-8000-000000000009', 'b0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000003', 'former_owner', 'sale_auction', 'Sold at regional dealer auction', 'Traded in and sold at a dealer auction after fleet service.', null, null, 'Midwest Dealer Auction', '2018-02-22', 74300, 'mi', 'Columbus, OH', 'published', true),
  ('c0000000-0000-4000-8000-000000000010', 'b0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000007', 'dealer', 'inspection', 'Pre-purchase inspection', 'Full 120-point inspection prior to resale.', 'Inspected fluids, brakes, frame, and undercarriage.', null, 'Ahern Motors', '2018-03-01', 74450, 'mi', 'Columbus, OH', 'published', true);

-- ---------------------------------------------------------------------------
-- 5. Comments + replies
-- ---------------------------------------------------------------------------
insert into public.comments (id, record_id, author_id, body) values
  ('d0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002', 'Good call doing this proactively — interference engine, so a snapped belt would''ve been ugly.'),
  ('d0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000005', 'Which spring rate did you end up going with?');

insert into public.replies (id, comment_id, author_id, body) values
  ('e0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Exactly the logic — better safe than towed.'),
  ('e0000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000004', 'Went with the factory-progressive rate, nothing exotic.');

-- ---------------------------------------------------------------------------
-- 6. Follows + bookmarks
-- ---------------------------------------------------------------------------
insert into public.follows (follower_id, followee_type, followee_id) values
  ('a0000000-0000-4000-8000-000000000002', 'user', 'a0000000-0000-4000-8000-000000000001'),
  ('a0000000-0000-4000-8000-000000000003', 'user', 'a0000000-0000-4000-8000-000000000001'),
  ('a0000000-0000-4000-8000-000000000003', 'vehicle', 'b0000000-0000-4000-8000-000000000002'),
  ('a0000000-0000-4000-8000-000000000005', 'vehicle', 'b0000000-0000-4000-8000-000000000002'),
  ('a0000000-0000-4000-8000-000000000006', 'user', 'a0000000-0000-4000-8000-000000000004');

insert into public.bookmarks (user_id, record_id) values
  ('a0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000004'),
  ('a0000000-0000-4000-8000-000000000007', 'c0000000-0000-4000-8000-000000000010');

-- ---------------------------------------------------------------------------
-- 7. Lists
-- ---------------------------------------------------------------------------
insert into public.lists (id, owner_id, name, description, cover_image_url, is_public, is_demo) values
  ('f0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000004', '90s Japanese Icons', 'Cars I''d buy tomorrow if I had the garage space.', 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&h=630&fit=crop', true, true),
  ('f0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000005', 'Track Day Builds', 'Documented track cars with real maintenance history.', 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200&h=630&fit=crop', true, true);

insert into public.list_vehicles (list_id, vehicle_id, position, added_by) values
  ('f0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000002', 1, 'a0000000-0000-4000-8000-000000000004'),
  ('f0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000004', 1, 'a0000000-0000-4000-8000-000000000005');

insert into public.follows (follower_id, followee_type, followee_id) values
  ('a0000000-0000-4000-8000-000000000001', 'list', 'f0000000-0000-4000-8000-000000000001');

-- ---------------------------------------------------------------------------
-- 8. A conversation + messages (one-to-one)
-- ---------------------------------------------------------------------------
insert into public.conversations (id) values ('11110000-0000-4000-8000-000000000001');
insert into public.conversation_members (conversation_id, user_id, last_read_at) values
  ('11110000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', now()),
  ('11110000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002', now() - interval '1 day');

insert into public.messages (conversation_id, sender_id, body, created_at) values
  ('11110000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Hey — saw your brake job note on my Accord, thanks for the detail!', now() - interval '2 days'),
  ('11110000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002', 'Anytime. Let me know if the pulsation comes back.', now() - interval '1 day');

-- ---------------------------------------------------------------------------
-- 9. A pending report, VIN correction request, and duplicate request so the
--    moderator dashboard has something to review out of the box.
-- ---------------------------------------------------------------------------
insert into public.reports (reporter_id, target_type, target_id, reason, details, status) values
  ('a0000000-0000-4000-8000-000000000007', 'record', 'c0000000-0000-4000-8000-000000000008', 'sensitive_information', 'Description may reference a specific track marshal by name — please review.', 'open');

insert into public.vin_correction_requests (vehicle_id, original_vin, suggested_vin, reason, submitted_by, status) values
  ('b0000000-0000-4000-8000-000000000005', '1FTFW1ET5BFC12345', '1FTFW1ET5BFC12346', 'Original listing had a transposed digit versus the title.', 'a0000000-0000-4000-8000-000000000007', 'pending');

insert into public.duplicate_vehicle_requests (vehicle_id_a, vehicle_id_b, reason, submitted_by, status) values
  ('b0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000005', 'Flagging for review — cover photos look similar, please confirm these are distinct vehicles.', 'a0000000-0000-4000-8000-000000000002', 'pending');

-- ---------------------------------------------------------------------------
-- 10. Recently viewed (for the signed-in demo user, Mara)
-- ---------------------------------------------------------------------------
insert into public.recently_viewed (user_id, target_type, target_id) values
  ('a0000000-0000-4000-8000-000000000001', 'vehicle', 'b0000000-0000-4000-8000-000000000002'),
  ('a0000000-0000-4000-8000-000000000001', 'user', 'a0000000-0000-4000-8000-000000000004');
