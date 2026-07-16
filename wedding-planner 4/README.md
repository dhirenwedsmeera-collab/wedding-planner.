# Dhiren & Meera's Wedding Planner

## 1. Run the SQL migrations (Supabase SQL Editor)

Open your project → **SQL Editor** → paste and **Run** each file below, in this exact
order (each one depends on the previous):

1. `supabase/migrations/0001_init.sql` — tables, enums, triggers
2. `supabase/migrations/0002_rls.sql` — row-level security policies
3. `supabase/migrations/0003_realtime_storage.sql` — realtime + storage buckets
4. `supabase/migrations/0004_seed.sql` — default events (Mehendi/Haldi/Nikah/Reception),
   budget categories, and every booking-tracker row pre-seeded as "not booked"

Run them one at a time and check for a green "Success" after each — if one errors,
fix it before moving to the next (they build on each other).

## 2. Enable email auth

Supabase project → **Authentication → Providers** → make sure **Email** is enabled.
For a private family app, go to **Authentication → Settings** and turn off "Confirm
email" if you want people signing in immediately (or leave it on and they'll get a
confirmation link).

## 3. Create your accounts

Go to `/login` (once deployed) → "New family member? Create an account" → sign up
with your own email. This creates a row in `profiles` automatically (via the
`handle_new_user` trigger) with role `volunteer` by default.

## 4. Promote yourself to admin

In Supabase → **Table Editor → profiles**, find your row and change `role` from
`volunteer` to `admin`. Only admins can create events, tasks, bookings, budget lines,
guests, and vendors — members can only update tasks assigned to them.

## 5. Deploy to Vercel

1. Push this project to a GitHub repo.
2. In Vercel: **Add New → Project** → import that repo.
3. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://svwulbbagqtvevedlaul.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your anon/publishable key
   - `NEXT_PUBLIC_WEDDING_DATE` = `2027-07-26`
   - `NEXT_PUBLIC_SITE_NAME` = `Dhiren & Meera's Wedding`
4. Click **Deploy**. Vercel will run `npm install` + `npm run build` automatically.
5. Once live, go to your Vercel URL → `/login` and repeat steps 3–4 above on production.

**Note:** in Supabase → **Authentication → URL Configuration**, set your **Site URL**
to your live Vercel URL (e.g. `https://your-app.vercel.app`) once you have it, so email
confirmation links redirect to the right place instead of `localhost`.

## What's built and working right now

- Auth (sign up / sign in), profile-per-user, admin vs member roles enforced by RLS
- Dashboard: live countdown ring, overall progress, urgent/today's tasks, event
  status grid, booking status widget, recent activity, quick actions
- Tasks: Kanban (drag-and-drop between statuses) + Table view, priority/urgency
  color coding, assignment, checklist %, create task (admin), edit gated to
  admin + assignee only
- Booking Tracker: all 16 required categories pre-seeded, urgency engine (lead
  time per category vs. days remaining), stats, filters, WhatsApp contact links,
  admin edit/add
- Realtime: dashboard/tasks/bookings refresh live via Supabase Realtime

## What's scaffolded in the schema but needs its UI page still

The database, RLS, and types already fully support these — they just need the
page built (same pattern as tasks/bookings):
- `/events/[slug]` — per-event dashboard (tasks/budget/shopping/files/notes filtered to that event)
- `/budget` — budget vs actuals, expense log, charts
- `/shopping` — shopping list by category, purchased/pending, receipt upload
- `/guests` — guest list, RSVP, filters
- `/vendors` — general vendor contact directory

Tell me which of these you want next and I'll build it the same way — real
Supabase reads/writes, no mock data.

## Local development

```bash
npm install
cp .env.local.example .env.local   # fill in your Supabase keys (already done for you)
npm run dev
```

## Adding/removing wedding events (fully dynamic, admin only)

Admins can add a new event (e.g. "Sangeet", "Engagement") directly from the
Events page once built, or right now via Supabase Table Editor → `events` →
insert a row with a unique `slug`. Every event automatically gets its own
tasks, budget lines, shopping items, and booking association since those
tables all reference `event_id`.
