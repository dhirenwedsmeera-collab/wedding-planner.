-- =====================================================================
-- REALTIME + STORAGE
-- Safe to run more than once.
-- =====================================================================

-- Add tables to the realtime publication so the dashboard live-updates.
-- Wrapped so re-running this file skips tables already added instead of
-- erroring with "relation is already member of publication".
do $$
declare
  t text;
begin
  foreach t in array array['tasks','bookings','shopping_items','expenses',
    'budget_lines','guests','events','notifications','activity_log',
    'task_comments','notes']
  loop
    begin
      execute format('alter publication supabase_realtime add table %I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

-- Storage buckets: receipts, contracts, event files, avatars
insert into storage.buckets (id, name, public)
values
  ('receipts', 'receipts', true),
  ('contracts', 'contracts', true),
  ('event-files', 'event-files', true),
  ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Anyone signed in can upload/read; only the uploader or admin can delete.
drop policy if exists "storage read" on storage.objects;
create policy "storage read" on storage.objects for select
  using (bucket_id in ('receipts','contracts','event-files','avatars'));

drop policy if exists "storage insert" on storage.objects;
create policy "storage insert" on storage.objects for insert
  with check (
    bucket_id in ('receipts','contracts','event-files','avatars')
    and auth.uid() is not null
  );

drop policy if exists "storage delete own or admin" on storage.objects;
create policy "storage delete own or admin" on storage.objects for delete
  using (
    bucket_id in ('receipts','contracts','event-files','avatars')
    and (owner = auth.uid() or is_admin())
  );

-- =====================================================================
-- end of 0003_realtime_storage.sql — continue with 0004_seed.sql
-- =====================================================================
