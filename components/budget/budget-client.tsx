-- Separate wedding-wide budget, independent of per-event budget lines.
create table if not exists public.overall_budget_lines (
  id uuid primary key default uuid_generate_v4(),
  category text not null unique,
  planned_amount numeric(12,2) not null default 0 check (planned_amount >= 0),
  notes text,
  created_at timestamptz not null default now()
);

alter table public.overall_budget_lines enable row level security;

drop policy if exists "overall budget: read signed in" on public.overall_budget_lines;
create policy "overall budget: read signed in" on public.overall_budget_lines
  for select using (auth.uid() is not null);

drop policy if exists "overall budget: admin insert" on public.overall_budget_lines;
create policy "overall budget: admin insert" on public.overall_budget_lines
  for insert with check (is_admin());

drop policy if exists "overall budget: admin update" on public.overall_budget_lines;
create policy "overall budget: admin update" on public.overall_budget_lines
  for update using (is_admin()) with check (is_admin());

drop policy if exists "overall budget: admin delete" on public.overall_budget_lines;
create policy "overall budget: admin delete" on public.overall_budget_lines
  for delete using (is_admin());

insert into public.overall_budget_lines (category, planned_amount)
values ('Venues', 0), ('Accommodation', 0), ('Decor', 0), ('Outfits', 0), ('Catering', 0), ('DJ / Entertainment', 0)
on conflict (category) do nothing;
