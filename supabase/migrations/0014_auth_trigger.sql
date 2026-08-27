-- RoadProfile: automatically create a public.users row (private account
-- settings) when a new auth.users row is created. public.profiles is
-- created separately at the end of onboarding, once a username is chosen.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id) values (new.id) on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'user') on conflict (user_id) do nothing;
  insert into public.user_standing (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();
