-- =====================================================================
-- ADD: custom amendable tabs per event (e.g. "Photography Shot List",
-- "Transport", anything the admin wants to track) — on top of the
-- built-in Guests / Outfits / Decorations tabs, which reuse the
-- existing guest_events link table and shopping_items categories and
-- need no schema changes.
--
-- Purely additive. Safe to run more than once.
-- =====================================================================

do $$ begin
  create type section_item_status as enum ('needed', 'sorted');
exception when duplicate_object then null; end $$;

create table if not exists event_sections (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references events(id) on delete cascade,
  name text not null,
  icon text default 'list-checks',
  sort_order int not null default 0,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists event_section_items (
  id uuid primary key default uuid_generate_v4(),
  section_id uuid references event_sections(id) on delete cascade,
  label text not null,
  status section_item_status not null default 'needed',
  assigned_to uuid references profiles(id),
  notes text,
  sort_order int not null default 0,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table event_sections enable row level security;
alter table event_section_items enable row level security;

drop policy if exists "event_sections: read all" on event_sections;
create policy "event_sections: read all" on event_sections for select using (auth.uid() is not null);
drop policy if exists "event_sections: admin insert" on event_sections;
create policy "event_sections: admin insert" on event_sections for insert with check (is_admin());
drop policy if exists "event_sections: admin update" on event_sections;
create policy "event_sections: admin update" on event_sections for update using (is_admin());
drop policy if exists "event_sections: admin delete" on event_sections;
create policy "event_sections: admin delete" on event_sections for delete using (is_admin());

drop policy if exists "section_items: read all" on event_section_items;
create policy "section_items: read all" on event_section_items for select using (auth.uid() is not null);
drop policy if exists "section_items: insert signed in" on event_section_items;
create policy "section_items: insert signed in" on event_section_items for insert with check (auth.uid() is not null);
drop policy if exists "section_items: update" on event_section_items;
create policy "section_items: update" on event_section_items for update using (
  is_admin() or assigned_to = auth.uid() or created_by = auth.uid()
);
drop policy if exists "section_items: delete" on event_section_items;
create policy "section_items: delete" on event_section_items for delete using (
  is_admin() or created_by = auth.uid()
);

drop trigger if exists trg_section_items_updated on event_section_items;
create trigger trg_section_items_updated before update on event_section_items
  for each row execute function set_updated_at();

do $$ begin
  execute 'alter publication supabase_realtime add table event_sections';
exception when duplicate_object then null; end $$;
do $$ begin
  execute 'alter publication supabase_realtime add table event_section_items';
exception when duplicate_object then null; end $$;
do $$ begin
  execute 'alter publication supabase_realtime add table guest_events';
exception when duplicate_object then null; end $$;

-- =====================================================================
-- end of 0007_event_sections.sql
-- =====================================================================
