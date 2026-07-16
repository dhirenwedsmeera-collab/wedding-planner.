-- =====================================================================
-- REALTIME + STORAGE
-- =====================================================================

-- Add tables to the realtime publication so the dashboard live-updates.
alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table bookings;
alter publication supabase_realtime add table shopping_items;
alter publication supabase_realtime add table expenses;
alter publication supabase_realtime add table budget_lines;
alter publication supabase_realtime add table guests;
alter publication supabase_realtime add table events;
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table activity_log;
alter publication supabase_realtime add table task_comments;
alter publication supabase_realtime add table notes;

-- Storage buckets: receipts, contracts, event files, avatars
insert into storage.buckets (id, name, public)
values
  ('receipts', 'receipts', true),
  ('contracts', 'contracts', true),
  ('event-files', 'event-files', true),
  ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Anyone signed in can upload/read; only the uploader or admin can delete.
create policy "storage read" on storage.objects for select
  using (bucket_id in ('receipts','contracts','event-files','avatars'));

create policy "storage insert" on storage.objects for insert
  with check (
    bucket_id in ('receipts','contracts','event-files','avatars')
    and auth.uid() is not null
  );

create policy "storage delete own or admin" on storage.objects for delete
  using (
    bucket_id in ('receipts','contracts','event-files','avatars')
    and (owner = auth.uid() or is_admin())
  );

-- =====================================================================
-- end of 0003_realtime_storage.sql — continue with 0004_seed.sql
-- =====================================================================
