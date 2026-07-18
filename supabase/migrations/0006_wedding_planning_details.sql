-- =====================================================================
-- ADD: real event structure, key decisions tracker, editable wedding date
--
-- This is purely additive — nothing from 0001-0005 is changed or removed.
-- Safe to run more than once.
-- =====================================================================

-- ---------------------------------------------------------------------
-- WEDDING SETTINGS (single row) — lets the admin set/update the wedding
-- date and registry date from inside the app instead of redeploying,
-- since the actual wedding date is TBD pending an auspicious date pick.
-- ---------------------------------------------------------------------
create table if not exists wedding_settings (
  id boolean primary key default true check (id), -- forces exactly one row
  wedding_date date,               -- null until an auspicious date is chosen
  wedding_date_is_confirmed boolean not null default false,
  registry_wedding_date date,      -- civil/registry wedding, separate from main event
  notes text,
  updated_at timestamptz not null default now()
);

insert into wedding_settings (id, wedding_date, registry_wedding_date)
values (true, null, null)
on conflict (id) do nothing;

alter table wedding_settings enable row level security;
drop policy if exists "wedding_settings: read all" on wedding_settings;
create policy "wedding_settings: read all" on wedding_settings for select using (auth.uid() is not null);
drop policy if exists "wedding_settings: admin update" on wedding_settings;
create policy "wedding_settings: admin update" on wedding_settings for update using (is_admin());

do $$ begin
  execute 'alter publication supabase_realtime add table wedding_settings';
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- KEY DECISIONS TRACKER (Decided / Pending) — a lightweight running list
-- of the big open questions, so nothing needs to be held in your head.
-- ---------------------------------------------------------------------
do $$ begin
  create type decision_status as enum ('pending', 'decided');
exception when duplicate_object then null; end $$;

create table if not exists key_decisions (
  id uuid primary key default uuid_generate_v4(),
  label text not null,
  status decision_status not null default 'pending',
  answer text,              -- filled in once decided, e.g. "150 guests"
  category text,             -- e.g. "Guest List", "Budget", "Date", "Venue"
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table key_decisions enable row level security;
drop policy if exists "key_decisions: read all" on key_decisions;
create policy "key_decisions: read all" on key_decisions for select using (auth.uid() is not null);
drop policy if exists "key_decisions: admin insert" on key_decisions;
create policy "key_decisions: admin insert" on key_decisions for insert with check (is_admin());
drop policy if exists "key_decisions: admin update" on key_decisions;
create policy "key_decisions: admin update" on key_decisions for update using (is_admin());
drop policy if exists "key_decisions: admin delete" on key_decisions;
create policy "key_decisions: admin delete" on key_decisions for delete using (is_admin());

do $$ begin
  execute 'alter publication supabase_realtime add table key_decisions';
exception when duplicate_object then null; end $$;

drop trigger if exists trg_key_decisions_updated on key_decisions;
create trigger trg_key_decisions_updated before update on key_decisions
  for each row execute function set_updated_at();

insert into key_decisions (label, category, sort_order)
select label, category, sort_order from (values
  ('Total guest numbers (per event)', 'Guest List', 1),
  ('Overall budget and how it splits across events', 'Budget', 2),
  ('Auspicious wedding date (muhurat) — June or July 2028', 'Date', 3),
  ('Registry (civil) wedding date — Summer 2027', 'Date', 4),
  ('Main venue for Mendhi / Wedding / Reception', 'Venue', 5),
  ('Locations for midweek events (Leicester vs Wakefield vs joint)', 'Venue', 6),
  ('Caterer for Gujarati food', 'Vendors', 7)
) as d(label, category, sort_order)
where not exists (select 1 from key_decisions);

-- ---------------------------------------------------------------------
-- REAL EVENT STRUCTURE — added alongside the original demo events
-- (Mehendi/Haldi/Nikah/Reception), which are left untouched. Archive
-- or edit either set from the Events page as an admin.
-- ---------------------------------------------------------------------
insert into events (name, slug, description, venue, color_theme, icon, sort_order) values
  ('Ganesh Puja (Bride)', 'ganesh-puja-bride', 'Midweek ceremony, bride''s side', 'Leicester', 'mehendi', 'flower-2', 10),
  ('Ganesh Puja (Groom)', 'ganesh-puja-groom', 'Midweek ceremony, groom''s side', 'Wakefield', 'mehendi', 'flower-2', 11),
  ('Pithi (Bride)', 'pithi-bride', 'Midweek ceremony, bride''s side', 'Leicester', 'haldi', 'sun', 12),
  ('Pithi (Groom)', 'pithi-groom', 'Midweek ceremony, groom''s side', 'Wakefield', 'haldi', 'sun', 13),
  ('Santak (Bride)', 'santak-bride', 'Midweek ceremony, bride''s side', 'Leicester', 'haldi', 'sun', 14),
  ('Santak (Groom)', 'santak-groom', 'Midweek ceremony, groom''s side', 'Wakefield', 'haldi', 'sun', 15),
  ('Mendhi', 'mendhi-main', 'Friday — joint event, main venue', null, 'mehendi', 'flower-2', 16),
  ('Wedding Ceremony', 'wedding-ceremony', 'Saturday — joint event, main venue', null, 'nikah', 'heart', 17),
  ('Reception', 'reception-main', 'Saturday — joint event, main venue', null, 'reception', 'champagne', 18),
  ('Registry Wedding', 'registry-wedding', 'Civil ceremony — Summer 2027', null, 'nikah', 'heart', 0)
on conflict (slug) do nothing;

-- =====================================================================
-- end of 0006_wedding_planning_details.sql
-- =====================================================================
