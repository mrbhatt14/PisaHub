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
- [ ] Modules still to build in the admin, one at a time: Our Journey, Gallery, Team (redesign), Home (hero/boarding pass), About, Volunteer roles, Users.
- [ ] Existing 134 images + hardcoded content migrated into the new system.
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
