-- =====================================================================
-- DHIREN & MEERA'S WEDDING PLANNER — CORE SCHEMA
-- Run in Supabase SQL Editor, in order, as migration 1.
--
-- This file is safe to run more than once — if you accidentally run it
-- twice, or re-run it after a partial failure, it will skip anything
-- that already exists instead of erroring.
-- =====================================================================

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- ENUMS (wrapped so re-running this file never errors on "already exists")
-- ---------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('admin', 'family', 'volunteer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type wedding_side as enum ('bride', 'groom', 'both');
exception when duplicate_object then null; end $$;

do $$ begin
  create type task_priority as enum ('critical', 'high', 'medium', 'low');
exception when duplicate_object then null; end $$;

do $$ begin
  create type task_status as enum ('not_started', 'in_progress', 'waiting', 'blocked', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type booking_status as enum ('not_booked', 'enquired', 'negotiating', 'booked', 'confirmed', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type booking_category as enum (
    'makeup_artist', 'clothes_tailor', 'decoration', 'catering', 'photographer',
    'videographer', 'mehendi_artist', 'dj_sound', 'lighting', 'transportation',
    'venue', 'flowers', 'jeweler', 'invitation_printing', 'accommodation', 'other'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type rsvp_status as enum ('pending', 'confirmed', 'declined', 'no_response');
exception when duplicate_object then null; end $$;

do $$ begin
  create type guest_category as enum ('family', 'friend', 'vip');
exception when duplicate_object then null; end $$;

do $$ begin
  create type vendor_category as enum (
    'photographer', 'decorator', 'catering', 'makeup', 'mehendi_artist',
    'dj', 'venue', 'flowers', 'jeweler', 'other'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type activity_type as enum (
    'task_created','task_updated','task_completed','task_assigned',
    'booking_updated','budget_updated','shopping_updated','guest_updated',
    'event_created','event_archived','comment_added'
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- PROFILES (extends auth.users)
-- ---------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role user_role not null default 'volunteer',
  side wedding_side default 'both',
  phone text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up
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

-- The auth signup trigger actually fires as the `supabase_auth_admin` role,
-- not as the function owner's default privileges — without these explicit
-- grants, signups fail with a generic "Database error saving new user".
grant usage on schema public to supabase_auth_admin;
grant all on public.profiles to supabase_auth_admin;
grant execute on function handle_new_user() to supabase_auth_admin;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------
-- EVENTS (Mehendi, Haldi, Nikah, Reception ... fully dynamic)
-- ---------------------------------------------------------------------
create table if not exists events (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  description text,
  event_date date,
  event_time time,
  venue text,
  color_theme text not null default 'emerald', -- mehendi/haldi/nikah/reception/custom -> gradient in UI
  icon text default 'sparkles',
  is_archived boolean not null default false,
  sort_order int not null default 0,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- TASKS
-- ---------------------------------------------------------------------
create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references events(id) on delete cascade,
  name text not null,
  description text,
  category text,
  priority task_priority not null default 'medium',
  status task_status not null default 'not_started',
  due_date date,
  completion_pct int not null default 0 check (completion_pct between 0 and 100),
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists task_assignees (
  task_id uuid references tasks(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  primary key (task_id, user_id)
);

create table if not exists task_checklist_items (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid references tasks(id) on delete cascade,
  label text not null,
  is_done boolean not null default false,
  sort_order int not null default 0
);

create table if not exists task_comments (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid references tasks(id) on delete cascade,
  author_id uuid references profiles(id),
  body text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- SHOPPING
-- ---------------------------------------------------------------------
create table if not exists shopping_items (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references events(id) on delete cascade,
  name text not null,
  category text not null,
  quantity int default 1,
  budget numeric(12,2) default 0,
  actual_price numeric(12,2),
  store text,
  is_purchased boolean not null default false,
  assigned_to uuid references profiles(id),
  receipt_url text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- BUDGET
-- ---------------------------------------------------------------------
create table if not exists budget_lines (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references events(id) on delete cascade,
  category text not null,
  planned_amount numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists expenses (
  id uuid primary key default uuid_generate_v4(),
  budget_line_id uuid references budget_lines(id) on delete cascade,
  event_id uuid references events(id) on delete cascade,
  description text not null,
  amount numeric(12,2) not null,
  paid_to text,
  paid_by uuid references profiles(id),
  expense_date date not null default current_date,
  receipt_url text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- GUESTS
-- ---------------------------------------------------------------------
create table if not exists guests (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  category guest_category not null default 'family',
  side wedding_side not null default 'both',
  phone text,
  email text,
  rsvp_status rsvp_status not null default 'pending',
  invitation_sent boolean not null default false,
  food_preference text,
  plus_ones int not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists guest_events (
  guest_id uuid references guests(id) on delete cascade,
  event_id uuid references events(id) on delete cascade,
  primary key (guest_id, event_id)
);

-- ---------------------------------------------------------------------
-- VENDORS (general contact/rating registry)
-- ---------------------------------------------------------------------
create table if not exists vendors (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category vendor_category not null,
  phone text,
  email text,
  advance_paid numeric(12,2) default 0,
  balance_due numeric(12,2) default 0,
  rating int check (rating between 1 and 5),
  notes text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- BOOKING TRACKER (critical, separate from vendors table)
-- ---------------------------------------------------------------------
create table if not exists booking_lead_times (
  category booking_category primary key,
  lead_time_days int not null -- ideal days-before-wedding this should be booked by
);

insert into booking_lead_times (category, lead_time_days) values
  ('venue', 270), ('catering', 270),
  ('photographer', 240), ('videographer', 240),
  ('decoration', 180), ('jeweler', 180),
  ('accommodation', 150),
  ('dj_sound', 120), ('mehendi_artist', 120), ('lighting', 120), ('clothes_tailor', 120),
  ('makeup_artist', 105),
  ('transportation', 90), ('invitation_printing', 90), ('other', 90),
  ('flowers', 60)
on conflict (category) do nothing;

create table if not exists bookings (
  id uuid primary key default uuid_generate_v4(),
  vendor_name text not null,
  category booking_category not null,
  event_id uuid references events(id) on delete set null,
  status booking_status not null default 'not_booked',
  booking_date date,
  contract_signed boolean not null default false,
  advance_paid numeric(12,2) default 0,
  balance_due numeric(12,2) default 0,
  final_payment_due date,
  contact_person text,
  contact_phone text,
  trial_scheduled_at timestamptz,
  fitting_dates date[],
  notes text,
  contract_url text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- FILES / NOTES / ACTIVITY LOG / NOTIFICATIONS
-- ---------------------------------------------------------------------
create table if not exists event_files (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references events(id) on delete cascade,
  name text not null,
  url text not null,
  uploaded_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists notes (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references events(id) on delete cascade,
  author_id uuid references profiles(id),
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists activity_log (
  id uuid primary key default uuid_generate_v4(),
  type activity_type not null,
  actor_id uuid references profiles(id),
  event_id uuid references events(id) on delete set null,
  entity_id uuid,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  title text not null,
  body text,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- TRIGGERS: updated_at, task completion sync, activity log, notifications
-- ---------------------------------------------------------------------
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end; $$ language plpgsql;

drop trigger if exists trg_tasks_updated on tasks;
create trigger trg_tasks_updated before update on tasks
  for each row execute function set_updated_at();

drop trigger if exists trg_bookings_updated on bookings;
create trigger trg_bookings_updated before update on bookings
  for each row execute function set_updated_at();

create or replace function sync_task_completion() returns trigger as $$
begin
  if new.status = 'completed' then
    new.completion_pct := 100;
  end if;
  return new;
end; $$ language plpgsql;

drop trigger if exists trg_task_completion on tasks;
create trigger trg_task_completion before insert or update on tasks
  for each row execute function sync_task_completion();

create or replace function log_task_activity() returns trigger as $$
begin
  if (tg_op = 'UPDATE' and old.status <> 'completed' and new.status = 'completed') then
    insert into activity_log (type, actor_id, event_id, entity_id, message)
    values ('task_completed', new.created_by, new.event_id, new.id, new.name || ' was marked completed');
  elsif (tg_op = 'INSERT') then
    insert into activity_log (type, actor_id, event_id, entity_id, message)
    values ('task_created', new.created_by, new.event_id, new.id, new.name || ' was created');
  end if;
  return new;
end; $$ language plpgsql;

drop trigger if exists trg_task_activity on tasks;
create trigger trg_task_activity after insert or update on tasks
  for each row execute function log_task_activity();

create or replace function notify_task_assignment() returns trigger as $$
begin
  insert into notifications (user_id, title, body, link)
  select new.user_id, 'New task assigned', t.name, '/tasks?task=' || t.id
  from tasks t where t.id = new.task_id;
  return new;
end; $$ language plpgsql;

drop trigger if exists trg_notify_assignment on task_assignees;
create trigger trg_notify_assignment after insert on task_assignees
  for each row execute function notify_task_assignment();

-- =====================================================================
-- end of 0001_init.sql — continue with 0002_rls.sql
-- =====================================================================
