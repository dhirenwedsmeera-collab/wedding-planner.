-- =====================================================================
-- SEED DATA
-- Wedding date: 26 July 2027
--
-- This file is safe to run more than once — the events insert skips
-- duplicates by slug, and the budget/booking inserts only run if those
-- tables are still completely empty (so re-running won't create doubles).
-- =====================================================================

-- Default events
insert into events (name, slug, description, event_date, color_theme, icon, sort_order) values
  ('Mehendi', 'mehendi', 'Henna ceremony for the bride and her family', '2027-07-23', 'mehendi', 'flower-2', 1),
  ('Haldi', 'haldi', 'Turmeric ceremony bringing the glow before the big day', '2027-07-24', 'haldi', 'sun', 2),
  ('Nikah', 'nikah', 'The wedding ceremony', '2027-07-26', 'nikah', 'heart', 3),
  ('Walima / Reception', 'reception', 'Reception celebration with family and friends', '2027-07-27', 'reception', 'champagne', 4)
on conflict (slug) do nothing;

-- Default budget categories per event (planned amounts left at 0 — admin fills these in)
-- Only runs the first time (skips if budget_lines already has rows), so
-- re-running this file won't create duplicate categories.
insert into budget_lines (event_id, category, planned_amount)
select e.id, c.category, 0
from events e
cross join (values
  ('Venue'), ('Catering'), ('Decoration'), ('Photography'), ('Videography'),
  ('Makeup & Hair'), ('Outfits'), ('Jewelry'), ('Flowers'), ('DJ / Music'),
  ('Invitations'), ('Gifts'), ('Transportation'), ('Miscellaneous')
) as c(category)
where e.slug in ('mehendi','haldi','nikah','reception')
  and not exists (select 1 from budget_lines);

-- Booking tracker rows for every required category, seeded as "not booked"
-- so the booking dashboard has full coverage from day one. Only runs the
-- first time (skips if bookings already has rows).
insert into bookings (vendor_name, category, status)
select 'TBD', cat, 'not_booked'
from unnest(enum_range(null::booking_category)) as cat
where not exists (select 1 from bookings);

-- =====================================================================
-- end of 0004_seed.sql
-- =====================================================================
