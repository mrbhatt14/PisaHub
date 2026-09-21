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
- [ ] Event + team photo upload/reorder (needs the R2 presigned-upload serverless function — not built yet).
- [ ] User management UI (admin promoting/demoting maintainers — Users tab is currently a placeholder; use the SQL bootstrap statement in `supabase/schema.sql` for now).
- [ ] Public site (`js/main.js`) switched from hardcoded `EVENTS`/`TEAM` arrays to fetching from Supabase.
- [ ] Existing 134 images + hardcoded content migrated into the new system.
- [ ] Old image blobs purged from git history (`.git` is 101MB from committed photos).

### Setup reference

- `.env.example` — variable names for Supabase + R2 credentials (copy to `.env`, never commit `.env`).
- `supabase/schema.sql` — `profiles` (roles), `events`, `event_photos`, `team_members` tables with Row-Level Security and table grants: public reads only `published` events / all team members; `maintainer`/`admin` roles can write; only `admin` manages other users' roles. Safe to re-run (every statement is idempotent). Bootstrap your own account to `admin` using the commented `update` statement at the bottom of the file.
- `admin/index.html` + `admin/dashboard.html` — the admin panel itself. Plain HTML/JS like the rest of the site, no build step. `js/admin/supabase-client.js` holds the public Supabase URL/anon key (safe to expose — protected by RLS); `js/admin/auth.js` is the session/role guard every admin page calls first; `js/admin/dashboard.js` has the Events CRUD logic.
- To run the admin panel locally: same as the main site — `python3 -m http.server 8000` from the repo root, then visit `http://localhost:8000/admin/`.

### Changelog

- **2026-09-21** — Decided on Supabase + Cloudflare R2; ruled out base64 and Google Drive hotlinking (see "Why this design" above). Created `.env.example` and `supabase/schema.sql`. Supabase project and R2 bucket created; both fully configured (API tokens, public access, `.env` filled in). Fixed a schema bug where table-level GRANTs to `anon`/`authenticated`/`service_role` were missing — RLS policies alone don't grant access in Postgres, so every query failed with "permission denied" until grants were added. Built and browser-tested the admin login page and Events CRUD (create/edit/delete) — confirmed working end-to-end. Added Team CRUD (same pattern as Events) — also confirmed working end-to-end.

## Notes on placeholders

Search the codebase for `Add Name` (team roster) and `settersync.com` (registration links) — those are the two things you'll want to replace with real data before launch.

## To Do

- [ ] Wire up the Volunteer form (`#volForm`) to a real destination — see "Volunteer form" above. Right now submissions just show a success message and go nowhere; nobody on the PISA side receives them.
- [ ] Add gallery/event photos: "The Cultural Fashion Show" and "Independence Day at the Consulate General of India" (Fall 2026) have no `poster`/`gallery` yet, so they're missing from the Gallery page and show "poster coming soon" — add real event photos in `js/main.js`.
