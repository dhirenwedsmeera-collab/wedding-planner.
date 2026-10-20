-- Add editable priority ratings to bookings. Existing records default to Medium.
alter table public.bookings
  add column if not exists priority text not null default 'medium';

alter table public.bookings
  drop constraint if exists bookings_priority_check;

alter table public.bookings
  add constraint bookings_priority_check
  check (priority in ('low', 'medium', 'high'));
