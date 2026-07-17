-- =====================================================================
-- SEED DATA — safe to run once after 0001-0003.
-- Wedding date: 26 July 2027
-- =====================================================================

-- Default events
insert into events (name, slug, description, event_date, color_theme, icon, sort_order) values
  ('Mehendi', 'mehendi', 'Henna ceremony for the bride and her family', '2027-07-23', 'mehendi', 'flower-2', 1),
  ('Haldi', 'haldi', 'Turmeric ceremony bringing the glow before the big day', '2027-07-24', 'haldi', 'sun', 2),
  ('Nikah', 'nikah', 'The wedding ceremony', '2027-07-26', 'nikah', 'heart', 3),
  ('Walima / Reception', 'reception', 'Reception celebration with family and friends', '2027-07-27', 'reception', 'champagne', 4)
on conflict (slug) do nothing;

-- Default budget categories per event (planned amounts left at 0 — admin fills these in)
insert into budget_lines (event_id, category, planned_amount)
select e.id, c.category, 0
from events e
cross join (values
  ('Venue'), ('Catering'), ('Decoration'), ('Photography'), ('Videography'),
  ('Makeup & Hair'), ('Outfits'), ('Jewelry'), ('Flowers'), ('DJ / Music'),
  ('Invitations'), ('Gifts'), ('Transportation'), ('Miscellaneous')
) as c(category)
where e.slug in ('mehendi','haldi','nikah','reception');

-- Booking tracker rows for every required category, seeded as "not booked"
-- so the booking dashboard has full coverage from day one.
insert into bookings (vendor_name, category, status)
select 'TBD', cat, 'not_booked'
from unnest(enum_range(null::booking_category)) as cat;

-- Shopping starter categories (empty items list; categories referenced in UI, no rows needed)

-- =====================================================================
-- end of 0004_seed.sql
-- =====================================================================
