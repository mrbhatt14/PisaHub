# Event photos

Each event has its own folder here, named to match its `id` in `js/main.js`.
Every folder already contains **named placeholder images**, so the site never
shows a broken image. To use real photos, just **overwrite the files with the
same names** — no code changes needed.

```
img/events/<event>/
  poster.jpg      ← main card / hero image for the event
  gallery-1.jpg   ← gallery photos (shown in Our Journey, Events, Gallery)
  gallery-2.jpg
  ...
```

- Keep the filenames exactly the same (`poster.jpg`, `gallery-1.jpg`, …).
- Landscape shots look best. Poster ≈ 1200×800, gallery ≈ 1000×750.
- To add **more** gallery photos than the placeholders provided, save them as
  `gallery-<n>.jpg` and add the matching line to that event's `gallery: [...]`
  array in `js/main.js`.

## Events currently set up

Past events were identified from the @pace_pisa Instagram highlights and the
Pace University site. **The dates in `js/main.js` are the real festival dates
for each year — please confirm they match the club's actual event dates.**

Upcoming: orientation · beginning · akshardham · milan · garba · diwali-2k26
Past: holi-2023 · bollyween-2023 · diwali-2023 · navratri-2024 · diwali-2024 · holi-2025 · independence-2025
