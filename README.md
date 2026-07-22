# Dhiren & Meera's Wedding Planner — Setup Guide for Beginners

This guide assumes you've never deployed a website before. Follow it top to
bottom, in order — don't skip ahead. Every step says exactly what to click.

**Accounts you'll need (all free):**
1. A **GitHub** account — this is just a place to store your project's code online.
2. A **Vercel** account — this is the service that takes your code and turns it
   into a real, live website.
3. A **Supabase** account — you already have this, since you gave me a project
   URL. This is your database (where all tasks, guests, budgets, etc. get stored).

If you don't have GitHub or Vercel accounts yet, go make them now (they're free —
just go to github.com and vercel.com and click "Sign Up"). Come back here once
both are made.

---

## Step 1 — Get the project's code onto GitHub

> ⚠️ **Important — read this first:** this project has real **folders inside
> folders** (like `app`, `components`, `lib`), not just a flat list of files.
> When you unzip the project file on your computer, your operating system
> automatically recreates those folders exactly as they should be — you never
> need to rename anything or flatten it into one folder. If you ever see a
> filename with underscores standing in for folder names (like
> `app_bookings_page.tsx`), that's a sign something went wrong — the fix is to
> start over from a fresh unzip, not to rename things back by hand.

1. Unzip the file I gave you (`wedding-planner.zip`) somewhere on your computer,
   like your Desktop. You should now see a folder called `wedding-planner`.
2. Go to **github.com**, log in, and click the green **"New"** button (or the
   **+** icon top-right → "New repository").
3. Name it something like `wedding-planner`. Leave everything else as default.
   Click **"Create repository"**.
4. Now you need to get your files from your computer up onto that empty
   GitHub repository. The easiest way as a beginner is a free app called
   **GitHub Desktop** — here's exactly how:

   1. Go to **desktop.github.com** and click the download button for your
      computer (Windows or Mac). Once downloaded, open it and install it like
      any other app.
   2. Open GitHub Desktop. It'll ask you to sign in — click **"Sign in to
      GitHub.com"** and log in with the same account you used in step 2 above.
      Approve the sign-in in your browser if asked.
   3. At the top-left, click **"File"** → **"Clone Repository..."**.
   4. A window opens with a list of your repositories — click on
      `wedding-planner` (the one you just created), then note the **"Local
      path"** field near the bottom (this is where it'll be saved on your
      computer — you can leave it as the default). Click **"Clone"**.
   5. GitHub Desktop will create an empty folder on your computer at that
      path. Open your computer's file explorer/finder and go to that folder.
   6. Now open your unzipped `wedding-planner` project folder (from Step 1
      above) in a second window, side by side. Select **everything inside**
      it (all files and folders — Ctrl+A / Cmd+A) and copy them.
   7. Paste everything into the empty folder GitHub Desktop created in step 5.
   8. Go back to the GitHub Desktop app. It will automatically notice all the
      new files and list them on the left with checkmarks.
   9. At the bottom-left, there's a small text box that says "Summary". Type
      something like `Initial upload` into it.
   10. Click the blue **"Commit to main"** button below that.
   11. Click **"Push origin"** at the top of the window (or "Publish branch"
       if that's what you see instead). This uploads everything to GitHub.
   12. Go back to github.com in your browser and refresh your repository page
       — you should now see all your project files listed there.

   **If your files still aren't showing up on github.com after this, check
   these in order:**
   - **In GitHub Desktop, look at the top bar** — does it say
     `wedding-planner` next to "Current repository"? If it shows a different
     repository name, that's the problem — click it and switch to the right
     one.
   - **Click the "History" tab** (top-left, next to "Changes"). Do you see
     your `Initial upload` commit listed? If not, the commit didn't actually
     happen — go back to the "Changes" tab, make sure files are checked, type
     a summary, and click "Commit to main" again.
   - **Look for a "Push origin" button** at the top of the window with a
     number next to it (like "Push origin 1"). If you see this button, it
     means your commit is sitting on your computer but hasn't uploaded yet —
     click it.
   - **If it says "Fetch origin" instead of "Push origin"**, click the
     dropdown arrow next to it and check you're actually on the `main` branch
     (shown top-left under "Current branch").
   - **Double check you're looking at the right URL on github.com** — it
     should be `github.com/your-username/wedding-planner`, not your GitHub
     homepage or a search page.

   Still stuck? Tell me exactly what you see in GitHub Desktop right now (what
   the buttons at the top say, and whether "History" shows a commit) and I'll
   pinpoint the exact issue.

   Once this is done, continue to Step 2 below.

   ### Starting over (if your files got flattened/renamed like above)

   If you already renamed files with underscores to represent folders, don't
   try to fix it by hand — it's much faster to wipe the slate clean:

   1. Open GitHub Desktop → **"Repository"** → **"Show in Explorer"** (or
      "Show in Finder"). This opens the folder on your computer.
   2. Select **everything** inside that folder (Ctrl+A / Cmd+A) and delete it
      all, so the folder is completely empty.
   3. Get a **fresh copy** of `wedding-planner.zip` (I've attached a new one
      to this message) and unzip it in a *new* location — don't reuse your
      old renamed folder. Confirm you see real folders like `app` and
      `components` when you open it, each containing more folders/files
      inside — not a flat list.
   4. Open that freshly unzipped `wedding-planner` folder, select
      **everything inside it** (Ctrl+A / Cmd+A), copy it, and paste it into
      the now-empty folder from step 2. Do not rename anything.
   5. Back in GitHub Desktop, you'll see a list of changes — the number
      depends on how much was actually different, so don't worry if it's
      just one file or a handful rather than a huge list (a full restart like
      this usually shows many, but a small targeted fix might only touch one
      or two files, and that's completely normal too). Type a summary like
      `Fix project structure`, click **"Commit to main"**, then
      **"Push origin"**.
   6. Go to your repository on github.com and confirm `package.json` and a
      folder called `app` are sitting directly in the top-level file list.
      Click into `app` and confirm you see folders like `(app)`, `login`,
      `auth` inside it — not files with underscored names.
   7. In Vercel, go to your project → **Deployments** → **⋯** on the latest
      one → **Redeploy**.

## Step 2 — Deploy the code to Vercel

1. Go to **vercel.com**. You have two options for logging in:
   - **Log in "with GitHub"** — this links the two accounts automatically in
     one step, which is easiest. If you do this, skip to Step 2 below.
   - **Log in with Google (your Gmail account)** — this also works fine, but
     you'll need to manually link your GitHub account afterward so Vercel can
     see your `wedding-planner` repository. Here's how:
     1. On the Vercel login page, click **"Continue with Google"** and sign in
        with your Gmail address.
     2. Once logged in, click **"Add New..."** → **"Project"** (same as Step 2
        below).
     3. On the import screen, look for a button that says **"Connect GitHub
        Account"** or **"Install"** (sometimes shown as "Add GitHub Account").
        Click it.
     4. This opens a GitHub authorization screen. Choose whether to give
        Vercel access to **all repositories** or **only select repositories**
        — pick "Only select repositories" and choose `wedding-planner` if you
        want to be more careful, or "All repositories" if you'd rather not
        manage that each time. Click **"Install"** (or **"Save"**).
     5. You'll be sent back to Vercel, and `wedding-planner` should now appear
        in your list of importable repositories. Continue to Step 2 below.
2. Click **"Add New..."** → **"Project"**.
3. You'll see a list of your GitHub repositories. Find `wedding-planner` and
   click **"Import"** next to it.
4. Before clicking Deploy, look for a section called **"Environment Variables"**
   on this same screen. Add these one at a time (click "Add" after each):

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://svwulbbagqtvevedlaul.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_760drkGyJsKTET75nG0i9g_M1QyXZa8` |
   | `NEXT_PUBLIC_WEDDING_DATE` | `2027-07-26` |
   | `NEXT_PUBLIC_SITE_NAME` | `Dhiren & Meera's Wedding` |

5. Click the big **"Deploy"** button. Wait 1–3 minutes — you'll see a progress
   screen with logs scrolling by. This is normal.
6. When it's done, you'll see a "Congratulations" screen with a button that
   says something like **"Visit"** or shows a URL like
   `wedding-planner-xyz.vercel.app`. That's your live website address. Save it
   somewhere — you'll use it for everything from here on.

   **If clicking that URL shows a page saying `404: NOT_FOUND`**, that's a
   Vercel platform error, not your website's login/dashboard page — it means
   Vercel couldn't find a working deployment to show you. Work through this in
   order:

   1. Go back to your Vercel dashboard (vercel.com → click your
      `wedding-planner` project) and click the **"Deployments"** tab.
   2. Look at the most recent deployment at the top. It'll have a status:
      - **"Error"** (usually shown in red) — the build failed. Click on that
        deployment, then click **"Build Logs"**, scroll to the bottom, and
        find the red error text. Copy it and send it to me — I'll tell you
        exactly what's wrong.
      - **"Building"** (yellow/orange, still spinning) — it's not done yet,
        just wait a minute and refresh.
      - **"Ready"** (green) — the build succeeded. In this case the 404 is
        usually caused by the project's files being nested one folder too
        deep on GitHub. Check this:
        1. Go to your `wedding-planner` repository on github.com.
        2. Look at the file list — you should see `package.json`, `app`,
           `components`, etc. listed **directly** at the top level.
        3. If instead you see a single folder (e.g. another folder called
           `wedding-planner`) that you have to click into to find those
           files, that's the problem — everything got uploaded one level too
           deep.
        4. To fix it, you'll do this in your computer's file explorer/finder
           (not inside GitHub Desktop itself — GitHub Desktop just detects
           whatever changes you make on disk):
           1. Open GitHub Desktop, and in the top bar click **"Repository"**
              → **"Show in Explorer"** (Windows) or **"Show in Finder"**
              (Mac). This opens the actual folder on your computer that
              GitHub Desktop is tracking.
           2. Inside it, you'll see one folder (probably also called
              `wedding-planner`) instead of files like `package.json`
              directly. Open that inner folder.
           3. Select **everything inside** it (Ctrl+A / Cmd+A) and **cut** it
              (Ctrl+X / Cmd+X, or right-click → Cut).
           4. Click the **back/up arrow** to go back out to the main tracked
              folder (the one GitHub Desktop opened in step 1).
           5. **Paste** (Ctrl+V / Cmd+V) here. You should now see
              `package.json`, `app`, `components`, etc. sitting directly in
              this folder, alongside the now-empty inner folder.
           6. Delete that now-empty inner folder (right-click it → Delete, or
              drag it to the Trash/Recycle Bin).
           7. Go back to GitHub Desktop — it will now show a long list of
              changes (files "removed" from the old nested location and
              "added" at the new top level, even though it's the same files).
              That's expected.
           8. Type a summary like `Fix folder structure` in the box at the
              bottom-left, click **"Commit to main"**, then click **"Push
              origin"** at the top.
           9. Go back to your Vercel dashboard's **Deployments** tab — a new
              deployment should start automatically within a few seconds.
              Wait for it to say **"Ready"**, then click **"Visit"**.

           **If the new build fails with an error like `Couldn't find any
           "pages" or "app" directory`**, it means Vercel is still looking in
           the *old* nested folder location, even though you already fixed
           GitHub. This happens because Vercel remembers a "Root Directory"
           setting from your very first import. Fix it like this:
           1. In your Vercel project, click **"Settings"** (top menu).
           2. Click **"General"** on the left, then scroll down to **"Root
              Directory"**.
           3. If it shows anything other than blank (like `wedding-planner`),
              click **"Edit"** next to it, clear the box so it's empty, and
              click **"Save"**.
           4. Go to the **"Deployments"** tab, click the **"⋯"** (three dots)
              menu on the most recent deployment, and click **"Redeploy"**.
           5. Before confirming, double-check the box for "Use existing
              Build Cache" — either is fine, but if it fails again, retry with
              that box unchecked.
           6. Wait for it to say **"Ready"**, then click **"Visit"**.

           If it still fails after this, go to your GitHub repository in the
           browser one more time and confirm you can see `package.json` and
           an `app` folder sitting directly in the top-level file list (not
           inside any other folder). If they're still nested, the move in
           step 4 above didn't fully complete — tell me what you see listed
           on github.com right now and I'll help you sort out exactly what's
           misplaced.

           If any of these sub-steps don't match what you're seeing, tell me
           exactly what's on your screen and I'll adjust.
   3. Once you've fixed whatever the issue was, Vercel will automatically
      re-deploy after you push new changes to GitHub — no need to click
      Deploy again. Wait for it to say "Ready", then click "Visit" again.

   **If your build logs show `✓ Compiled successfully` and all your pages
   listed, but it still fails at the very end with `Error: No Output
   Directory named "public" found`**, that's a different, simpler problem —
   your code is fine, it's just a project setting in Vercel:

   1. In your Vercel project, click **"Settings"** (top menu) → **"General"**.
   2. Find **"Framework Preset"**. It should say **"Next.js"**. If it says
      **"Other"** or anything else, click it and change it to **"Next.js"**.
   3. While you're there, scroll to **"Build & Output Settings"** and make
      sure **"Output Directory"** does not have a custom override switched on
      (if there's a toggle next to it that's turned on with something typed
      in like `public`, turn that toggle off).
   4. Click **"Save"** if prompted.
   5. Go to **"Deployments"** → **"⋯"** on the latest one → **"Redeploy"**.

At this point your site is live, but it won't work yet — the database behind it
is still empty. That's the next step.

## Step 3 — Set up your database (Supabase)

1. Go to **supabase.com**, log in, and open your project (the one with URL
   `svwulbbagqtvevedlaul.supabase.co`).
2. On the left sidebar, click the icon that looks like a terminal/database
   labeled **"SQL Editor"**.
3. Click **"New query"**.
4. Back in your unzipped project folder, open the file
   `supabase/migrations/0001_init.sql` in any text editor (even Notepad/TextEdit
   works — right-click the file → Open With → Notepad or TextEdit).
5. Select all the text in that file (Ctrl+A / Cmd+A), copy it (Ctrl+C / Cmd+C).
6. Paste it into the Supabase SQL Editor box, then click the **"Run"** button
   (or press Ctrl+Enter / Cmd+Enter).
7. You should see a green **"Success"** message at the bottom. If you see a red
   error instead, stop and tell me exactly what it says.

   **Good news if you already hit an error like `type "user_role" already
   exists`:** these files are now written so they're safe to run more than
   once — if you accidentally ran one twice, or re-ran after a partial
   failure, just run all four files again in order (0001 → 0002 → 0003 →
   0004) and they'll skip anything already created instead of erroring. You
   don't need to manually undo anything first.
8. Repeat steps 3–7 for these three files, **in this exact order**:
   - `supabase/migrations/0002_rls.sql`
   - `supabase/migrations/0003_realtime_storage.sql`
   - `supabase/migrations/0004_seed.sql`
   - `supabase/migrations/0006_wedding_planning_details.sql`
   - `supabase/migrations/0007_event_sections.sql`
   - `supabase/migrations/0008_guest_event_rsvp.sql`

   (`0005_fix_signup_trigger.sql` is only needed if you hit the specific
   error described later in this guide — skip it otherwise.)

   **Already have a working site and just came back for a new update?** You
   don't need to redo Steps 1–2 from scratch — just open the new/changed
   `.sql` file(s) mentioned in that update and run them in the SQL Editor the
   same way (New query → paste → Run). All the files here are safe to run
   more than once, so if you're ever unsure whether one already ran, run it
   again.

   Each one needs its own fresh "New query" — don't paste them all into one box.

Your database now has all the tables and starter data (Mehendi/Haldi/Nikah/
Reception events, empty budget categories, and all 16 booking categories ready
to fill in).

## Step 4 — Turn on sign-ups (Supabase)

1. Still in Supabase, click **"Authentication"** on the left sidebar, then
   **"Providers"**.
2. Make sure **"Email"** is switched on (it usually is by default).
3. Click **"Settings"** (still under Authentication). Look for a toggle called
   **"Confirm email"**.
   - If you turn this **off**: anyone who signs up can use the app immediately,
     no email confirmation needed. Simplest option for a small family app.
   - If you leave it **on**: after signing up, people have to click a link
     Supabase emails them before they can log in.
4. Also on this page (or under "URL Configuration"), find **"Site URL"** and
   paste in your live Vercel address from Step 2 (e.g.
   `https://wedding-planner-xyz.vercel.app`). This makes sure any confirmation
   emails send people to the right place instead of a broken local address.

## Step 5 — Create your own account on the live site

Yes — you do need to create an account, the same way any family member would.
This is what makes you a real, logged-in user of the app (as opposed to just
someone who built it).

1. Open your live Vercel URL in a browser.
2. You should land on a page titled **"Dhiren & Meera"** with email/password
   boxes. If not, add `/login` to the end of the address.
3. Click the small link under the password box that says **"New family
   member? Create an account"**. A "Full name" box will appear above email.
4. Fill in:
   - **Full name** — your real name, e.g. `Meera Shah`
   - **Email** — any email address you can check
   - **Password** — anything 6 characters or more
5. Click **"Create Account"**.

   **If you see an error that says `Database error saving new user`**, this
   is a known Supabase permissions gap, not something wrong with what you
   typed. Here's the fix:

   1. Go to Supabase → **SQL Editor** → **"New query"**.
   2. Open `supabase/migrations/0005_fix_signup_trigger.sql` from your
      project folder, copy all its contents, and paste it into the query box.
   3. Click **"Run"**. You should see **"Success"**.
   4. Go back to your site and try creating your account again — it should
      work now.

6. Depending on what you chose in Step 4:
   - If you turned "Confirm email" **off** — you're logged in immediately and
     land on the Dashboard.
   - If you left it **on** — check your email inbox for a message from
     Supabase and click the confirmation link inside it. That'll bring you
     back to the site, now logged in.

## Step 6 — Make yourself the admin

By default, every new sign-up is a regular "volunteer" — not allowed to create
tasks, bookings, etc. You need to promote yourself to **admin** manually, once,
using Supabase directly:

1. In Supabase, click **"Table Editor"** on the left sidebar.
2. Click the **`profiles`** table in the list.
3. Find the row with your name/email in it.
4. Click on the cell under the **`role`** column for your row — it currently
   says `volunteer`. Change it to `admin` and press Enter/click away to save.
5. Go back to your live site and refresh the page. You now have full admin
   access — you can create events, tasks, bookings, budgets, guests, and
   vendors. Everyone else you invite will stay as regular members unless you
   promote them the same way.

---

You're done! From here, share your live Vercel URL with family — anyone can
sign up the same way you did in Step 5, and you can promote trusted people to
admin using Step 6 if needed.

If you get stuck on any specific screen, tell me exactly what you're looking at
(a screenshot description is fine) and I'll walk you through just that part.

---

## What's built and working right now

- Auth (sign up / sign in), profile-per-user, admin vs member roles enforced
  by the database itself (not just the app)
- Dashboard: live countdown ring, overall progress, urgent/today's tasks, event
  status grid, booking status widget, recent activity, quick actions
- Tasks: Kanban (drag-and-drop between statuses) + Table view, priority/urgency
  color coding, assignment, checklist %, create task (admin), edit gated to
  admin + assignee only
- Booking Tracker: all 16 required categories pre-seeded, urgency engine (lead
  time per category vs. days remaining), stats, filters, WhatsApp contact
  links, admin edit/add
- Events: full list + per-event page (`/events/[slug]`) showing that event's
  own tasks, budget, shopping, and progress; admin can add/archive events
- Budget: planned vs. actual by category and event, expense log, admin-only
  editing
- Shopping: list by category, purchased/pending toggle, budget vs. actual
  price, assigned person
- Guests: list with RSVP status, side (bride/groom), category, search/filters
- Vendors: contact directory with category, rating, advance/balance
- Realtime: every page above refreshes live for everyone automatically via
  Supabase Realtime
- Notifications: bell icon opens a real panel (not just a count) — click to
  mark read, "mark all read", links straight to the relevant task
- Task comments: every task has a real comment thread, anyone signed in can
  post
- Quick notes: a running notes feed on the dashboard (general) and on each
  event's page (scoped to that event) — post and delete your own notes
- Receipt & contract uploads: shopping items and bookings now have a real
  "Upload" button that stores the file in Supabase Storage and links back to
  it — not just a text field
- Task Calendar view: a full month grid alongside Kanban and Table, click any
  day's task to open it
- Global search: the search box in the header actually searches tasks,
  bookings, guests, and vendors as you type
- Real event structure: the original demo events (Mehendi/Haldi/Nikah/
  Reception) are still there, untouched — alongside them, real events for
  your actual wedding (Ganesh Puja, Pithi, and Santak for both bride's and
  groom's sides, Mendhi, Wedding Ceremony, Reception, and a separate Registry
  Wedding milestone for Summer 2027). Archive whichever set you don't need
  from the Events page.
- Key Decisions tracker on the dashboard: a Decided/Pending list seeded with
  your open questions (guest numbers, budget, auspicious date, venue,
  caterer) — check one off and optionally note the answer once it's settled
- Wedding date is now TBD-aware: since your date depends on picking an
  auspicious muhurat, the countdown shows "date TBD" until an admin sets it
  (Dashboard → "Set wedding date"), instead of assuming a fixed date
- Every event page now has extra tabs: **Guests** (link guests from your
  full guest list to just this event, see RSVP status), **Outfits** and
  **Decorations** (sorted vs. still needed, with budget/store/who's handling
  it), and admins can **add fully custom tabs** to any event (e.g. "Photography
  Shot List", "Transport") — each one a simple checklist anyone can add to and
  tick off. Each event's Overview tab is now a proper mini-dashboard showing
  Tasks/Budget/Shopping/Guests/Outfits/Decor progress at a glance, and the
  Events grid (and dashboard) now show small guest/outfit/decor indicators
  right on each event's card.

- Guests list now has an **Events** column — click it to open a checklist of
  every active event and tick which ones that guest is invited to. This uses
  the exact same link as each event's own Guests tab, so the two stay in
  sync automatically in both directions — no separate data, no new SQL
  needed for this one.

- Mobile optimized: the bottom tab bar now shows **all 8 sections** (Home,
  Events, Tasks, Bookings, Budget, Shopping, Guests, Vendors) as a smooth
  horizontal-scroll strip that auto-centers on whichever tab you're on —
  nothing is hidden behind a "More" menu anymore. Popup forms/dialogs now
  leave breathing room on narrow screens instead of touching the edges, and
  the Kanban board, event tabs, and category filters all swipe horizontally
  on phones instead of forcing a long vertical stack.

- RSVP is now tracked **per event**, not just once overall — a guest can be
  confirmed for the Mehendi but still pending for the Reception. Set it from
  either place: the Events column on the main Guests page (open it, pick a
  status per event from the dropdown), or from that event's own Guests tab.
  Both read and write the exact same data, so they're always in sync, and
  the confirmed/total counts shown on event cards (Events grid + dashboard)
  now reflect real per-event RSVPs.

- Events can now be **edited**, not just added and archived — admins get a
  pencil icon on each event card (Events grid) and on the event's own page
  header, to change the name, date, time, venue, description, and colour
  theme (with a visual swatch picker matching the festive gradients). Since
  every screen reads from the same event record, changes show up everywhere
  that event appears — the Events grid, the dashboard, and the event's own
  page — automatically, no new SQL required for this one.

Every page above reads and writes real data through Supabase — nothing is
mock data. The whole app is feature-complete against the original spec.

## Local development (optional — only if you want to run it on your own
computer instead of just using the live Vercel site)

Requires [Node.js](https://nodejs.org) installed first. Then, in a terminal,
inside the unzipped project folder:

```bash
npm install
npm run dev
```

Then open `http://localhost:3000` in your browser. Your `.env.local` file
already has your Supabase keys filled in, so this should work right away.

## Adding/removing wedding events later (e.g. "Sangeet", "Engagement")

Once you're an admin, this will be doable right from the Events page in the
app once it's built. Until then, you can do it directly in Supabase: Table
Editor → `events` table → insert a new row with a unique `slug` (e.g.
`sangeet`). Every event automatically gets its own tasks, budget, and shopping
list since those all link to the event automatically.
