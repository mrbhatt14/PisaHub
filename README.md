# PISA Hub — Website

A single-page, animated website for the Pace Indian Student Association. No build tools required — it's plain HTML, CSS and JavaScript, so you can open it, edit it, and deploy it anywhere that serves static files (GitHub Pages, Netlify, Vercel, or Pace's own hosting).

## Running it

Just open `index.html` in a browser, or serve the folder locally so relative paths behave (recommended):

```
cd pisa-hub
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## What's here

```
index.html      – all five "pages" (Home, Our Journey, Team, Volunteer, Live Events)
css/style.css   – design tokens (colors/fonts), layout, animation
js/main.js      – all data + logic (routing, countdown, timeline, carousel, form)
```

It's a single-page app: each section in `index.html` (`#page-home`, `#page-history`, etc.) is shown/hidden by `js/main.js` based on the URL hash (`#home`, `#events`, `#history`, `#team`, `#volunteer`). That's what gives you page-style transitions without a page reload.

## The one thing to understand: EVENTS is the source of truth

Open `js/main.js` and find the `EVENTS` array near the top. Every event you add there automatically:

- Shows up on **Live Events** while it's upcoming or currently happening, with a live flip-countdown to its start time.
- Flips to a **"Live Now"** badge automatically once the current time passes `date` (and before `endDate`).
- **Disappears from Live Events and reappears on Our Journey** automatically once `endDate` (or `date` + 6 hours if you don't set one) passes — grouped by semester (Fall/Spring, computed from the month) with its `gallery` photos in the expandable timeline panel.

You never need to manually move an event to "history" — just keep the array up to date and the site does it in real time, based on the visitor's clock.

```js
{
  id: "diwali",                 // unique, no spaces
  title: "Diwali 2K26",
  tagline: "One line description shown on cards",
  date: "2026-11-08T18:00:00",  // event start
  endDate: "2026-11-08T23:30:00", // optional — when it should flip to "Closed"
  location: "Pace University, New York",
  registerLink: "https://settersync.com/pisa/diwali-2k26", // → replace with your real Settersync event link
  poster: "https://picsum.photos/seed/pisa-diwali/900/640", // → replace with a real photo URL
  gallery: ["https://picsum.photos/seed/pisa-diwali-1/800/600", "..."], // → replace once you have event photos
  description: "A paragraph shown in the Our Journey detail panel once the event is over."
}
```

**Photos:** every `poster`/`gallery` URL currently points to [picsum.photos](https://picsum.photos) placeholder images so the site looks complete out of the box. Swap them for real event photography — either host them yourself (e.g. `assets/photos/diwali-1.jpg`) or link a hosted URL (Google Drive/Photos public links, Cloudinary, etc.).

## Team page

Edit `TEAM_EXEC` and `TEAM_COMMITTEE` in `js/main.js`. Each member needs `name`, `role`, `instagram`, `linkedin`, and optionally a `quote` (shown on exec cards, like the President card you referenced). Photos currently use auto-generated placeholder avatars from [dicebear.com](https://dicebear.com) keyed off `photoSeed` — replace `photoSeed` with a real image path (e.g. `"assets/team/pritha.jpg"`) and update the `avatarUrl()` helper call in `teamCardMarkup()` to use it directly once you have real headshots.

## Volunteer form

`#volForm` in `index.html` is a front-end-only demo: submitting it shows a success state but doesn't send data anywhere yet. To make it functional, either:
- Point the `<form>` at a service like Google Forms, Formspree, or Airtable and adjust `action`/`method`, or
- Wire the `submit` handler in `js/main.js` (search for `form.addEventListener("submit"`) to `fetch()` your own backend.

Volunteer roles (Performer, Event Organizer, etc.) come from the `ROLES` array in `js/main.js` — edit, add, or remove roles there and both the role cards and the registration checkboxes update automatically.

## Colors & type

All design tokens live at the top of `css/style.css` under `:root`: ivory, brown, saffron, green and sand, plus the two type families (Fraunces for display, Inter for body, Space Grotesk for labels/numbers). Change a value once there and it updates everywhere.

## The gate animation

The opening-gate hero (`#gateHero` in `index.html`) is hand-built SVG + CSS 3D transforms, driven by scroll position in `js/main.js` (`updateGateProgress()`). No animation library required. If you'd rather use a real photo of One Pace Plaza behind the gate instead of the illustrated skyline, replace the contents of `.gate-hero__backdrop` with an `<img>`.

## Admin & Content Management (in progress)

Currently all content (events, team roster, images) lives hardcoded in `js/main.js` and `img/`, edited directly through code. We're moving to a proper admin system so non-technical maintainers/admins can add events, team members, and photos through a UI instead of a PR.

### Why this design

- **Two roles**: `maintainer` (create/edit events, team, upload photos) and `admin` (all of the above, plus manage maintainer accounts). Enforced with Postgres Row-Level Security, not app-level checks, so permissions hold even if the admin UI has a bug.
- **Supabase** (Postgres + Auth) for the database and login — free tier is generous for our scale (event/team metadata is tiny), and RLS gives real role enforcement without a custom backend server.
- **Cloudflare R2** for image storage, not the git repo. At 134 images the repo's `.git` is already 101MB; at 1000+ images git becomes unworkable (slow clones, bloated deploys). R2 gives 10GB free storage **and zero egress fees** — the free tier holds even as the public gallery gets real traffic, which is the thing that quietly turns other "free" storage (S3, Supabase Storage) into a bill.
- **Rejected: base64-in-DB** — inflates file size ~33%, kills caching/CDN benefits, bloats Postgres.
- **Rejected: Google Drive/Photos hotlinking** — free, but not built for public hotlinking; Google throttles/breaks these links unpredictably under real traffic, which isn't acceptable for a live public site.
- Admin UI stays plain HTML/CSS/JS (no framework), matching the rest of the site — new pages under `/admin`, talking to Supabase directly from the browser.

### Status

- [x] Architecture decided: Supabase (auth + DB) + Cloudflare R2 (images).
- [x] Supabase project created, R2 bucket created (`pisa-hub-images`), API tokens + public access done.
- [x] Schema + RLS policies + table grants applied (`supabase/schema.sql`).
- [x] `.env` filled in locally (see `.env.example`).
- [x] First admin account bootstrapped.
- [x] Admin login (`admin/index.html`) — tested in browser, works.
- [x] Events CRUD (`admin/dashboard.html`, Events tab) — create/edit/delete tested end-to-end in browser, works.
- [x] Team CRUD (`admin/dashboard.html`, Team tab) — create/edit/delete tested end-to-end in browser, works.
- [x] Team headshot upload to R2 — tested end-to-end in browser, works.
- [ ] Event photos modal (upload / set poster / delete) is built but **not yet tested in a browser**; drag-to-reorder isn't built (photos order by upload order).
- [ ] User management UI (admin promoting/demoting maintainers — Users tab is currently a placeholder; use the SQL bootstrap statement in `supabase/schema.sql` for now).
- [x] Public site: Team and Events now also pull live data from Supabase (`loadLiveData()` in `js/main.js`). Published events are merged into the hardcoded `EVENTS` array (same `id` = live version wins, otherwise added), so they appear on Live Events, Our Journey, Gallery and Home automatically; team members appear as a "Live YYYY" semester. Both load *before* the first render (3s timeout, falls back to hardcoded data if Supabase is slow/down). Tested with mocked Supabase responses.
- [x] **Module 1 - Live Events** (admin sidebar -> Live Events; public `/events`). Public cards are now identical (same size, height, fonts): every poster sits in one 3:2 frame (`--poster-ratio` in `css/style.css`) that it fills edge-to-edge - the old dark letterbox (`object-fit: contain` on a black backdrop) is gone. In the admin, the editor shows a live preview built from the *same markup/CSS as the public card*, and posters go through a cropper that outputs exactly 1500x1000 (3:2) so a wrong-shaped upload can never reintroduce black bars. Verified with mocked-session browser tests (list, preview, cropper output size, validation); **saving/uploading against the real database still needs a manual test.**
- [x] Home **Happening Next** is now a slider (`renderHome` / `initHappeningSlider` in `js/main.js`): up to 2 events that are live now or start within 25 days (`HN_WINDOW_DAYS`, `HN_MAX_SLIDES` constants), earliest first, so each gets a full marketing window; falls back to the single nearest event if none are inside the window. Side arrows (left/right of the card), dots, swipe, keyboard arrows, 12s autoplay (`HN_AUTOPLAY_MS`) that pauses on hover/touch and is disabled for `prefers-reduced-motion`. Poster frame is the same 3:2 as Live Events.
- [x] **Live events migrated to the database (2026-09-25).** `conversation-group-2026`, `garba` and `diwali` were moved from the hardcoded `EVENTS` array into Supabase (posters center-cropped to 3:2 / 1500x1000 and uploaded to R2; times converted from naive local time to the real New York instant, so visitors in other time zones see the right time). The originals are commented out in `js/main.js` in restore-able `@@COMMENTED-OUT` blocks - otherwise a deleted event would reappear from the hardcoded copy. Downside to know: if Supabase is unreachable, these events don't show (the site itself still loads). The 3 Garba "gallery" images were identical placeholders, so they were not migrated. **The `garba` (Navratri Garba Night) event was then deliberately deleted on 2026-09-25 - "Navratri with PISA" replaces it.** Migration script was one-time and not kept in the repo.
- [x] Admin: **Home Page** tab (section map showing which module feeds each home section + live iframe preview of `/`), tab **routes** (`/admin/dashboard.html#home|live|events|team|users` - refresh/Back/shared links keep your place), and a **View website** link in the top bar. Sign-out now uses `location.replace` and also reacts to `SIGNED_OUT` from another tab / expired session and to bfcache restores, so you always land on the sign-in page and Back can't reopen the dashboard.
- [x] **Module 2 - Gallery** (admin sidebar -> Gallery; public `/gallery` and Our Journey). Per-event photo albums: multi-file / drag-and-drop upload, drag-to-reorder (saved as `sort_order`), select + bulk delete (also removes the R2 objects). Built for 1000+ photos: every upload is resized in the browser to 2000px (JPEG) **and** gets a 640px thumbnail (`js/admin/image-tools.js`), so a 500KB phone photo becomes ~280KB + ~40KB. The public gallery grid and Our Journey panels load the thumbnails; the lightbox loads full images lazily. Needs one column: `alter table public.event_photos add column if not exists thumb_key text;` (also appended to `supabase/schema.sql`). Until it exists the public loader falls back to loading without thumbnails, so nothing breaks. Posters are not shown here (`is_poster` rows are excluded).
- [x] **Gallery photos are public only after the event ends.** The public site already enforced this (Gallery, Our Journey and the home strip only use ended events; Live Events shows just the poster - verified with mocked upcoming / live-now / ended events that all had photos). It is now also enforced in the database: the `event_photos_public_read` policy in `supabase/schema.sql` lets the public read a poster for any published event, but gallery photos only once `coalesce(end_date, event_date + 6h) <= now()`, so early photos can't be fetched from the API either (maintainers/admins still see everything). **Applied and verified on the real database (2026-09-25) with temporary test events - anon saw posters only for upcoming/live-now events, gallery photos only after the end (incl. events with no `end_date`), and nothing for drafts; test data was deleted afterwards.** The admin Gallery tab shows "Photos stay hidden until the event ends" per event and a notice in the album manager, so maintainers can upload ahead of time safely.
- [x] Admin **Live Events** now lists every draft (grouped under "Drafts", even if its date has already passed, with a "date has passed" note and a "Continue editing" button) above the "Live & upcoming" published events, so unfinished events can't disappear from the list. Published events that have ended move out of this list (they live under Gallery / Our Journey).
- [x] **Past events + gallery photos migrated to the database (2026-09-25).** The last 6 hardcoded events (The PISA Premiere - id renamed `pisa-premiere-2026`, Holi 2026, Fashion Show, Mock Wedding, Yoga Day, Independence Day) with their 31 gallery photos (each resized to 2000px + a 640px thumbnail) and 4 posters are now in Supabase + R2; all files verified served by R2. `EVENTS` in `js/main.js` is now intentionally empty - everything is filled by `loadLiveEventsData()` - and the old objects are kept in restorable `@@COMMENTED-OUT` blocks. **Trade-off:** if Supabase is unreachable the event pages are empty (the site shell still loads). The `img/events/*` and `img/team/*` files in git are now unused for events; purging them from history (the 101MB `.git`) is still a separate, not-yet-done step.
- [x] **Module 3 - Team** (admin sidebar -> Team; public `/team`). Every member has a **term (Spring/Fall) + year (2025 -> current year + 3) + group** (Executive Board, Directors, Marketing Team, Events Team, Media & Outreach, or a custom one) - that decides which semester roster and which titled group they appear in on the Team page; the form shows "Appears on the Team page under Fall 2026 › Marketing Team" as you choose. New members are added to the end of their group (`sort_order`). The table has a semester filter; rows without a semester (legacy test data) are flagged "not public". Headshots go through the shared cropper (`js/admin/cropper.js`, also used by event posters) at **1000x1050 (1:1.05)** - the real shape of every team card on the site (`.team-grid--committee .team-card` overrides the base 3:4). Needs SQL: `alter table public.team_members add column if not exists term/year/group_title` (in `supabase/schema.sql`, applied). Public loader `loadLiveTeamData()` builds `TEAMS_BY_SEM` from these fields; the old "Live YYYY" placeholder is gone.
- [x] **Fall 2026 roster migrated to the database (2026-09-25):** all 18 members in their 5 groups, with headshots re-cropped to 1:1.05 (Gurleen's and Sreeya's old focus points baked in) and uploaded to R2. The hardcoded roster is in a restorable `@@COMMENTED-OUT` block, so `TEAMS_BY_SEM` starts empty. Three older admin test rows (`anshi`, `Gurleen`/"Baddieee 2", `Pritha`/"Baddieee 3") have no semester and are therefore not public - delete them from the Team tab ("No semester set" filter).
- [x] **Module 4 - Users** (admin sidebar -> Users, admins only; also hidden + redirected for maintainers). Admins can add a user with a role (maintainer / admin), change roles, reset a password, and remove access. Everything goes through `api/users.js` (serverless, service-role key) which re-checks that the caller is an admin; the rules live in `api/_lib/users-service.js` and were unit-tested against an in-memory fake database: you can't change your own role or remove yourself, there must always be at least one admin, duplicate emails are refused, and inputs are validated. New accounts get a generated 16-character temporary password (no look-alike characters) shown **once** in a dialog with a Copy button - no email service is needed. Everyone gets a **Change password** button in the top bar (min 10 characters) to replace it.
- [x] **Names on users + "Forgot password?" (2026-09-25).** Adding a user now asks for **Name and Email** (name is required, tidied and stored as `profiles.display_name`; email is what they sign in with). The Users table shows both, admins can **Edit name** later (older accounts show "No name yet"), and the top bar shows the signed-in person's name. **Forgot password:** the sign-in page has a "Forgot password?" link -> enter email -> Supabase emails a one-hour, single-use link to `admin/reset-password.html` where they choose a new password (min 10 chars), are signed out, and land on sign-in with a "Password updated" banner. It always shows the same message whether or not the email has an account (no account discovery), has a 60-second resend cooldown, friendly messages for Supabase's email rate limit, and clear errors for expired/used/missing links. Tested with mocked Supabase responses (no real emails sent). **One-time Supabase setup required:** Authentication -> URL Configuration -> add these Redirect URLs: `http://localhost:3000/admin/reset-password.html`, `https://pacepisa.org/admin/reset-password.html`, `https://www.pacepisa.org/admin/reset-password.html`, `https://*.vercel.app/admin/reset-password.html` (and set Site URL to the production domain). Supabase's built-in mailer only allows a few emails per hour - fine for a small team; add a custom SMTP provider if it ever becomes a limit. Last resorts if someone is locked out: another admin uses Users -> Reset password, or the Supabase project owner sets a password in Authentication -> Users.
- [x] **Sign in with a username (2026-09-25).** Each account can have a unique username (3-30 characters: letters, numbers, `.` and `_`; not case-sensitive - `ShivamBhatt` = `shivambhatt`). The sign-in box takes "username or email". Supabase only knows emails, so a username is resolved to its email **on the server** (`api/auth-username.js` + `api/_lib/username-auth.js`), which signs in and hands the browser the session - the browser never learns which email belongs to a username. Wrong password, unknown username and malformed username all return the identical "Invalid login credentials", an unknown username still makes a real (dummy) sign-in attempt so timing/rate limits match, and Supabase's own rate limiting is passed through as a friendly 429. "Forgot password?" also accepts a username (reset link goes to the account's email; identical answer whether or not it exists). Emails still sign in directly with Supabase, so nothing depends on the new endpoint for them. Admins set usernames in the Users tab (**Add user** asks for name, username, email and role and suggests a username from the name; **Set/Change username** for existing accounts, which keep using their email until one is set). Rules are unit-tested (including uniqueness ignoring case, no half-created accounts on a refused username, and the sign-in lookup) with in-memory fakes. **Needs SQL** (in `supabase/schema.sql`, bottom): `profiles.username`, a generated lower-case `username_key`, and a unique index. **Vercel note:** `api/auth-username.js` also needs `SUPABASE_ANON_KEY` set as an environment variable on Vercel (it's already in the local `.env`).
- [x] **Ready-to-send invite message.** After **Add user** or **Reset password**, the dialog now shows an editable message (greeting by first name, the sign-in link, username and/or email, the temporary password, and the next steps: sign in, use **Change password**, use **Forgot password?** if needed - plus what their role can do) with **Copy message** and **Copy password** buttons. The message and password are wiped when the dialog is closed. On localhost the link points at `https://pacepisa.org/admin` (change `adminSignInUrl()` in `js/admin/users.js` if the production domain differs).
- [x] **Security fix (2026-09-25) - no more auto-maintainer on sign-up.** The original schema had a trigger giving *every* new auth user a `maintainer` profile. Supabase's public sign-up was enabled (`disable_signup: false`), so anyone could have created an account with edit access. The trigger is now dropped in `supabase/schema.sql` (profiles are created only by an admin through the Users tab), and public sign-up should also be switched off in the Supabase dashboard (Authentication -> Sign In / Providers -> "Allow new users to sign up" off) - admin-created users still work. Also deleted a leftover throwaway test account (`e2e-test-admin@pisahub.local`) that an early test script had created. First-admin bootstrap on a brand-new project is now an explicit `insert into public.profiles` (see the bottom of the schema).
- [ ] Modules still to build in the admin, one at a time: Our Journey, Gallery, Team (redesign), Home (hero/boarding pass), About, Volunteer roles, Users.
- [ ] Remaining hardcoded content to migrate: text content in About / Volunteer / Home (hero copy, volunteer roles, banner photos). Old `img/team/*` and `img/events/*` files in git are now unused.
- [ ] Old image blobs purged from git history (`.git` is 101MB from committed photos).

### Setup reference

- `.env.example` — variable names for Supabase + R2 credentials (copy to `.env`, never commit `.env`).
- `supabase/schema.sql` — `profiles` (roles), `events`, `event_photos`, `team_members` tables with Row-Level Security and table grants: public reads only `published` events / all team members; `maintainer`/`admin` roles can write; only `admin` manages other users' roles. Safe to re-run (every statement is idempotent). Bootstrap your own account to `admin` using the commented `update` statement at the bottom of the file.
- `js/supabase-client.js` and `js/r2-config.js` (top-level, not under `js/admin/`) hold the public Supabase/R2 config shared by both the admin panel and the public site's `js/main.js` — one source of truth instead of duplicating credentials in two places.
- `admin/index.html` + `admin/dashboard.html` — the admin panel itself. Plain HTML/JS like the rest of the site, no build step. `js/admin/supabase-client.js` holds the public Supabase URL/anon key (safe to expose — protected by RLS); `js/admin/auth.js` is the session/role guard every admin page calls first; `js/admin/dashboard.js` has the Events CRUD logic.
- `api/upload-url.js` and `api/delete-object.js` are Vercel serverless functions (Node) that hold the R2 secret credentials — the browser never sees them. `upload-url` verifies the caller is a maintainer/admin via their Supabase session, then returns a short-lived presigned R2 PUT URL; `delete-object` removes an R2 object when a photo is deleted in the admin UI, so storage doesn't accumulate orphaned files. Shared logic lives in `api/_lib/` (files/folders prefixed `_` aren't treated as routes by Vercel).
- `package.json` at the repo root declares the serverless functions' npm dependencies (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `@supabase/supabase-js`) — run `npm install` once locally. The rest of the site still has no build step.
- **To run the admin panel locally with photo upload working**, you need the real serverless functions, not just a static file server: `npx vercel dev` (the project is already linked to the `pisa-hub` Vercel project) serves both the static site and `/api/*` together at `http://localhost:3000`. Plain `python3 -m http.server` only works for pages that don't touch `/api` (e.g. testing Events/Team text CRUD, or the public site's Supabase reads).
- **R2 bucket needs a CORS policy** for browser uploads to work at all — see "R2 CORS policy" below. Without it, uploads fail with a CORS error in the browser console (not a code bug — R2 blocks all cross-origin requests by default).

### R2 CORS policy

Set once in Cloudflare dashboard → R2 → `pisa-hub-images` → Settings → CORS Policy (needed because browsers block direct-to-R2 uploads without it; the "Object Read & Write" scoped API token can't set this via script, only the dashboard):

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "http://localhost:8123",
      "https://*.vercel.app",
      "https://pacepisa.org",
      "https://www.pacepisa.org"
    ],
    "AllowedMethods": ["PUT", "GET"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

### Changelog

- **2026-09-21** — Decided on Supabase + Cloudflare R2; ruled out base64 and Google Drive hotlinking (see "Why this design" above). Created `.env.example` and `supabase/schema.sql`. Supabase project and R2 bucket created; both fully configured (API tokens, public access, `.env` filled in). Fixed a schema bug where table-level GRANTs to `anon`/`authenticated`/`service_role` were missing — RLS policies alone don't grant access in Postgres, so every query failed with "permission denied" until grants were added. Built and browser-tested the admin login page and Events CRUD (create/edit/delete) — confirmed working end-to-end. Added Team CRUD (same pattern as Events) — also confirmed working end-to-end. Built R2 photo upload: `api/upload-url.js` (presigned PUT URLs) and `api/delete-object.js`, wired into both the Team headshot field and a new per-event Photos modal (upload/set-poster/delete). Found and fixed a real bug where the R2 bucket had no CORS policy, which blocks all browser uploads — documented the fix. Wired the public Team page to also read live data from Supabase (`loadLiveTeamData()`), tested locally with a real admin-added member appearing correctly. Moved shared Supabase/R2 config out of `js/admin/` into top-level `js/` files so the public site and admin panel share one source of truth. **2026-09-25** — Module 1 (Live Events): fixed the public poster frame to 3:2 with identical cards, redesigned the admin into a module sidebar and built the Live Events editor with live preview + 3:2 poster cropper (`js/admin/live-events.js`). Also earlier that day: Wired the public Events/Gallery/Home pages to Supabase the same way as Team, and changed the loader to run before the first render (replacing the earlier dropdown-rebuild workaround). Tested with mocked Supabase responses so no live data was touched.

## Notes on placeholders

Search the codebase for `Add Name` (team roster) and `settersync.com` (registration links) — those are the two things you'll want to replace with real data before launch.

## To Do

- [ ] Wire up the Volunteer form (`#volForm`) to a real destination — see "Volunteer form" above. Right now submissions just show a success message and go nowhere; nobody on the PISA side receives them.
- [ ] Add gallery/event photos: "The Cultural Fashion Show" and "Independence Day at the Consulate General of India" (Fall 2026) have no `poster`/`gallery` yet, so they're missing from the Gallery page and show "poster coming soon" — add real event photos in `js/main.js`.
