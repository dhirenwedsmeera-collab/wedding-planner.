-- =====================================================================
-- ADD: per-event RSVP status
--
-- Guests can now RSVP differently per event (e.g. confirmed for Mehendi,
-- pending for Reception) instead of one single status for the whole
-- wedding. The existing guests.rsvp_status column is untouched — it's
-- still there as the guest's overall status if you want to use it that
-- way, but the Guests tab and each event's Guests tab now both read/write
-- the new per-event status below.
--
-- Purely additive. Safe to run more than once.
-- =====================================================================

alter table guest_events add column if not exists rsvp_status rsvp_status not null default 'pending';

-- There was previously no UPDATE policy on guest_events at all (it only
-- ever needed insert/delete for linking/unlinking). Now that it has an
-- editable status column, admins need to be able to update it.
drop policy if exists "guest_events: admin update" on guest_events;
create policy "guest_events: admin update" on guest_events for update using (is_admin());

-- =====================================================================
-- end of 0008_guest_event_rsvp.sql
-- =====================================================================
