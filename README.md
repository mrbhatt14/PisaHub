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

## Notes on placeholders

Search the codebase for `Add Name` (team roster) and `settersync.com` (registration links) — those are the two things you'll want to replace with real data before launch.
