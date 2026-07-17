-- =====================================================================
-- FIX: "Database error saving new user" on sign-up
--
-- Cause: the trigger that auto-creates a profiles row on sign-up is
-- actually fired by the `supabase_auth_admin` role, which doesn't have
-- automatic access to the public schema — it needs explicit grants.
--
-- This file only needs to be run once, and only if you hit this exact
-- error. If you're setting up a brand-new project instead, you don't
-- need this file — the fix is already included in 0001_init.sql.
-- =====================================================================

create or replace function handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), split_part(new.email, '@', 1), 'New User'),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'volunteer')
  )
  on conflict (id) do nothing;
  return new;
end; $$ language plpgsql security definer set search_path = public;

grant usage on schema public to supabase_auth_admin;
grant all on public.profiles to supabase_auth_admin;
grant execute on function handle_new_user() to supabase_auth_admin;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
