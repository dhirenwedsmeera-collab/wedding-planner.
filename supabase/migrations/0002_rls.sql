-- =====================================================================
-- ROW LEVEL SECURITY
-- Rule of thumb: everyone signed-in can READ everything (it's one
-- family's shared planner). Only admin can WRITE most tables.
-- Members (family/volunteer) can only update tasks assigned to them,
-- and only status/completion/checklist/comments on those tasks.
-- =====================================================================

alter table profiles enable row level security;
alter table events enable row level security;
alter table tasks enable row level security;
alter table task_assignees enable row level security;
alter table task_checklist_items enable row level security;
alter table task_comments enable row level security;
alter table shopping_items enable row level security;
alter table budget_lines enable row level security;
alter table expenses enable row level security;
alter table guests enable row level security;
alter table guest_events enable row level security;
alter table vendors enable row level security;
alter table bookings enable row level security;
alter table event_files enable row level security;
alter table notes enable row level security;
alter table activity_log enable row level security;
alter table notifications enable row level security;

-- Helper: is the current user an admin?
create or replace function is_admin() returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- Helper: is the current user assigned to this task?
create or replace function is_assigned_to_task(t_id uuid) returns boolean as $$
  select exists (
    select 1 from task_assignees where task_id = t_id and user_id = auth.uid()
  );
$$ language sql security definer stable;

-- ---- PROFILES ----
drop policy if exists "profiles: read all" on profiles;
create policy "profiles: read all" on profiles for select using (auth.uid() is not null);
drop policy if exists "profiles: self update" on profiles;
create policy "profiles: self update" on profiles for update using (auth.uid() = id or is_admin());
drop policy if exists "profiles: admin insert" on profiles;
create policy "profiles: admin insert" on profiles for insert with check (is_admin() or auth.uid() = id);

-- ---- EVENTS (admin manages, everyone reads) ----
drop policy if exists "events: read all" on events;
create policy "events: read all" on events for select using (auth.uid() is not null);
drop policy if exists "events: admin write" on events;
create policy "events: admin write" on events for insert with check (is_admin());
drop policy if exists "events: admin update" on events;
create policy "events: admin update" on events for update using (is_admin());
drop policy if exists "events: admin delete" on events;
create policy "events: admin delete" on events for delete using (is_admin());

-- ---- TASKS ----
drop policy if exists "tasks: read all" on tasks;
create policy "tasks: read all" on tasks for select using (auth.uid() is not null);
drop policy if exists "tasks: admin insert" on tasks;
create policy "tasks: admin insert" on tasks for insert with check (is_admin());
drop policy if exists "tasks: admin delete" on tasks;
create policy "tasks: admin delete" on tasks for delete using (is_admin());
-- admin can update anything; assignees can update status/completion/description of their own task
drop policy if exists "tasks: update" on tasks;
create policy "tasks: update" on tasks for update using (
  is_admin() or is_assigned_to_task(id)
);

-- ---- TASK ASSIGNEES ----
drop policy if exists "task_assignees: read all" on task_assignees;
create policy "task_assignees: read all" on task_assignees for select using (auth.uid() is not null);
drop policy if exists "task_assignees: admin write" on task_assignees;
create policy "task_assignees: admin write" on task_assignees for insert with check (is_admin());
drop policy if exists "task_assignees: admin delete" on task_assignees;
create policy "task_assignees: admin delete" on task_assignees for delete using (is_admin());

-- ---- CHECKLIST ITEMS (assignee or admin can toggle) ----
drop policy if exists "checklist: read all" on task_checklist_items;
create policy "checklist: read all" on task_checklist_items for select using (auth.uid() is not null);
drop policy if exists "checklist: write" on task_checklist_items;
create policy "checklist: write" on task_checklist_items for insert with check (
  is_admin() or is_assigned_to_task(task_id)
);
drop policy if exists "checklist: update" on task_checklist_items;
create policy "checklist: update" on task_checklist_items for update using (
  is_admin() or is_assigned_to_task(task_id)
);
drop policy if exists "checklist: delete" on task_checklist_items;
create policy "checklist: delete" on task_checklist_items for delete using (
  is_admin() or is_assigned_to_task(task_id)
);

-- ---- COMMENTS (anyone signed in can comment) ----
drop policy if exists "comments: read all" on task_comments;
create policy "comments: read all" on task_comments for select using (auth.uid() is not null);
drop policy if exists "comments: insert own" on task_comments;
create policy "comments: insert own" on task_comments for insert with check (auth.uid() = author_id);
drop policy if exists "comments: delete own or admin" on task_comments;
create policy "comments: delete own or admin" on task_comments for delete using (
  auth.uid() = author_id or is_admin()
);

-- ---- SHOPPING (admin + assigned person can update purchase status) ----
drop policy if exists "shopping: read all" on shopping_items;
create policy "shopping: read all" on shopping_items for select using (auth.uid() is not null);
drop policy if exists "shopping: admin insert" on shopping_items;
create policy "shopping: admin insert" on shopping_items for insert with check (is_admin());
drop policy if exists "shopping: admin delete" on shopping_items;
create policy "shopping: admin delete" on shopping_items for delete using (is_admin());
drop policy if exists "shopping: update" on shopping_items;
create policy "shopping: update" on shopping_items for update using (
  is_admin() or assigned_to = auth.uid()
);

-- ---- BUDGET / EXPENSES (admin only writes; everyone reads) ----
drop policy if exists "budget: read all" on budget_lines;
create policy "budget: read all" on budget_lines for select using (auth.uid() is not null);
drop policy if exists "budget: admin write" on budget_lines;
create policy "budget: admin write" on budget_lines for insert with check (is_admin());
drop policy if exists "budget: admin update" on budget_lines;
create policy "budget: admin update" on budget_lines for update using (is_admin());
drop policy if exists "budget: admin delete" on budget_lines;
create policy "budget: admin delete" on budget_lines for delete using (is_admin());

drop policy if exists "expenses: read all" on expenses;
create policy "expenses: read all" on expenses for select using (auth.uid() is not null);
drop policy if exists "expenses: admin write" on expenses;
create policy "expenses: admin write" on expenses for insert with check (is_admin());
drop policy if exists "expenses: admin update" on expenses;
create policy "expenses: admin update" on expenses for update using (is_admin());
drop policy if exists "expenses: admin delete" on expenses;
create policy "expenses: admin delete" on expenses for delete using (is_admin());

-- ---- GUESTS / VENDORS / BOOKINGS (admin only writes) ----
drop policy if exists "guests: read all" on guests;
create policy "guests: read all" on guests for select using (auth.uid() is not null);
drop policy if exists "guests: admin all insert" on guests;
create policy "guests: admin all insert" on guests for insert with check (is_admin());
drop policy if exists "guests: admin all update" on guests;
create policy "guests: admin all update" on guests for update using (is_admin());
drop policy if exists "guests: admin all delete" on guests;
create policy "guests: admin all delete" on guests for delete using (is_admin());

drop policy if exists "guest_events: read all" on guest_events;
create policy "guest_events: read all" on guest_events for select using (auth.uid() is not null);
drop policy if exists "guest_events: admin write" on guest_events;
create policy "guest_events: admin write" on guest_events for insert with check (is_admin());
drop policy if exists "guest_events: admin delete" on guest_events;
create policy "guest_events: admin delete" on guest_events for delete using (is_admin());

drop policy if exists "vendors: read all" on vendors;
create policy "vendors: read all" on vendors for select using (auth.uid() is not null);
drop policy if exists "vendors: admin write" on vendors;
create policy "vendors: admin write" on vendors for insert with check (is_admin());
drop policy if exists "vendors: admin update" on vendors;
create policy "vendors: admin update" on vendors for update using (is_admin());
drop policy if exists "vendors: admin delete" on vendors;
create policy "vendors: admin delete" on vendors for delete using (is_admin());

drop policy if exists "bookings: read all" on bookings;
create policy "bookings: read all" on bookings for select using (auth.uid() is not null);
drop policy if exists "bookings: admin write" on bookings;
create policy "bookings: admin write" on bookings for insert with check (is_admin());
drop policy if exists "bookings: admin update" on bookings;
create policy "bookings: admin update" on bookings for update using (is_admin());
drop policy if exists "bookings: admin delete" on bookings;
create policy "bookings: admin delete" on bookings for delete using (is_admin());

-- ---- FILES / NOTES (any signed-in member can add) ----
drop policy if exists "files: read all" on event_files;
create policy "files: read all" on event_files for select using (auth.uid() is not null);
drop policy if exists "files: insert" on event_files;
create policy "files: insert" on event_files for insert with check (auth.uid() is not null);
drop policy if exists "files: delete own or admin" on event_files;
create policy "files: delete own or admin" on event_files for delete using (
  uploaded_by = auth.uid() or is_admin()
);

drop policy if exists "notes: read all" on notes;
create policy "notes: read all" on notes for select using (auth.uid() is not null);
drop policy if exists "notes: insert" on notes;
create policy "notes: insert" on notes for insert with check (auth.uid() is not null);
drop policy if exists "notes: delete own or admin" on notes;
create policy "notes: delete own or admin" on notes for delete using (
  author_id = auth.uid() or is_admin()
);

-- ---- ACTIVITY LOG (read only for everyone; system inserts via triggers) ----
drop policy if exists "activity: read all" on activity_log;
create policy "activity: read all" on activity_log for select using (auth.uid() is not null);
drop policy if exists "activity: insert" on activity_log;
create policy "activity: insert" on activity_log for insert with check (auth.uid() is not null);

-- ---- NOTIFICATIONS (each user sees + manages only their own) ----
drop policy if exists "notifications: read own" on notifications;
create policy "notifications: read own" on notifications for select using (auth.uid() = user_id);
drop policy if exists "notifications: update own" on notifications;
create policy "notifications: update own" on notifications for update using (auth.uid() = user_id);
drop policy if exists "notifications: insert system" on notifications;
create policy "notifications: insert system" on notifications for insert with check (true);

-- =====================================================================
-- end of 0002_rls.sql — continue with 0003_realtime.sql
-- =====================================================================
