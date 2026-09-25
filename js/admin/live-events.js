// Live Events module: list of live/upcoming events, an editor whose preview is
// the same markup/CSS as the public card, and a poster cropper that outputs an
// exact 3:2 image so posters always fill the public frame with no letterbox.

// Must match --poster-ratio (3 / 2) in css/style.css.
const POSTER_W = 1500;
const POSTER_H = 1000;

let liveEditingId = null; // null = creating
const posterState = { blob: null, blobUrl: null, existingKey: null, removed: false };

const $id = (id) => document.getElementById(id);

async function initLiveEvents() {
  $id("newLiveBtn").addEventListener("click", () => openLiveEditor(null));
  $id("liveModalClose").addEventListener("click", closeLiveEditor);
  $id("liveCancel").addEventListener("click", closeLiveEditor);
  $id("liveForm").addEventListener("submit", saveLiveEvent);
  $id("liveForm").addEventListener("input", renderLivePreview);
  $id("lv_published").addEventListener("change", renderLivePreview);
  await loadLiveEvents();
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

function eventEnd(ev) {
  return ev.end_date ? new Date(ev.end_date) : new Date(new Date(ev.event_date).getTime() + 6 * 3600 * 1000);
}

async function loadLiveEvents() {
  const { data, error } = await supabaseClient
    .from("events")
    .select("*, event_photos(storage_key, is_poster)")
    .order("event_date", { ascending: true });

  const grid = $id("liveGrid");
  const empty = $id("liveEmpty");
  grid.innerHTML = "";
  if (error) {
    grid.innerHTML = `<p class="admin-error">Failed to load events: ${escapeHtml(error.message)}</p>`;
    return;
  }

  const now = new Date();
  // Drafts always show here (even if their date has passed) so unfinished work is never lost;
  // published events show while they are live or upcoming.
  const drafts = data.filter((ev) => ev.status === "draft");
  const published = data.filter((ev) => ev.status !== "draft" && eventEnd(ev) >= now);
  empty.classList.toggle("admin-hidden", drafts.length + published.length > 0);

  const cardHtml = (ev) => {
    const poster = (ev.event_photos || []).find((p) => p.is_poster);
    const isDraft = ev.status === "draft";
    const started = new Date(ev.event_date) <= now;
    const passed = eventEnd(ev) < now;
    const chip = isDraft ? ["draft", "Draft"] : started ? ["live", "Live now"] : ["", "Open for registration"];
    return `
      <article class="adm-ev">
        <div class="adm-ev__poster">
          ${posterMarkup(poster ? photoUrl(poster.storage_key) : null, ev.title)}
          <span class="adm-ev__chip ${chip[0] ? `adm-ev__chip--${chip[0]}` : ""}">${chip[1]}</span>
        </div>
        <div class="adm-ev__body">
          <h3>${escapeHtml(ev.title)}</h3>
          <div class="adm-ev__meta">${escapeHtml(fmtWhen(ev.event_date))}${isDraft && passed ? " · date has passed" : ""}</div>
          <div class="adm-ev__meta">${escapeHtml(ev.location || "No location")}</div>
          <div class="adm-ev__actions">
            <button class="admin-btn" data-edit="${ev.id}">${isDraft ? "Continue editing" : "Edit"}</button>
            <button class="admin-btn admin-btn--ghost" data-del="${ev.id}">Delete</button>
          </div>
        </div>
      </article>`;
  };
  const group = (title, hint, list) => list.length
    ? `<div class="adm-group"><h3>${title} <span>${list.length}</span></h3><p>${hint}</p></div>${list.map(cardHtml).join("")}`
    : "";
  grid.innerHTML =
    group("Drafts", "Not visible on the website. Turn on “Published” in the editor to put one live.", drafts) +
    group("Live &amp; upcoming", "Visible on the public Live Events page.", published);
  grid.querySelectorAll("[data-edit]").forEach((b) => b.addEventListener("click", () => openLiveEditor(b.dataset.edit)));
  grid.querySelectorAll("[data-del]").forEach((b) => b.addEventListener("click", () => deleteLiveEvent(b.dataset.del)));
}

function posterMarkup(url, title) {
  if (url) return `<img src="${url}" alt="${escapeHtml(title)}" loading="lazy">`;
  return `<div class="poster-tba"><span class="poster-tba__title">${escapeHtml(title || "Untitled event")}</span><span class="poster-tba__tag">Poster coming soon</span></div>`;
}

function fmtWhen(iso) {
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
}

async function deleteLiveEvent(id) {
  if (!confirm("Delete this event and its poster? This removes it from the public site.")) return;
  const { data: photos } = await supabaseClient.from("event_photos").select("storage_key, thumb_key").eq("event_id", id);
  const { error } = await supabaseClient.from("events").delete().eq("id", id);
  if (error) return alert(`Failed to delete: ${error.message}`);
  (photos || []).forEach((p) => {
    deleteImage(p.storage_key).catch(() => {});
    if (p.thumb_key) deleteImage(p.thumb_key).catch(() => {});
  });
  await Promise.all([loadLiveEvents(), loadEvents()]);
}

// ---------------------------------------------------------------------------
// Editor
// ---------------------------------------------------------------------------

async function openLiveEditor(id) {
  liveEditingId = id;
  $id("liveForm").reset();
  $id("liveFormError").textContent = "";
  resetPosterState();

  if (id) {
    $id("liveModalTitle").textContent = "Edit live event";
    const { data: ev, error } = await supabaseClient.from("events").select("*, event_photos(storage_key, is_poster)").eq("id", id).single();
    if (error) return alert(`Failed to load event: ${error.message}`);
    $id("lv_title").value = ev.title;
    $id("lv_tagline").value = ev.tagline ?? "";
    $id("lv_date").value = toLocalInputValue(ev.event_date);
    $id("lv_end_date").value = ev.end_date ? toLocalInputValue(ev.end_date) : "";
    $id("lv_location").value = ev.location ?? "";
    $id("lv_register").value = ev.register_link ?? "";
    $id("lv_description").value = ev.description ?? "";
    $id("lv_published").checked = ev.status === "published";
    const poster = (ev.event_photos || []).find((p) => p.is_poster);
    posterState.existingKey = poster ? poster.storage_key : null;
  } else {
    $id("liveModalTitle").textContent = "New live event";
    $id("lv_published").checked = false;
  }
  renderLivePreview();
  $id("liveModalBackdrop").classList.remove("admin-hidden");
}

function closeLiveEditor() {
  $id("liveModalBackdrop").classList.add("admin-hidden");
  resetPosterState();
  liveEditingId = null;
}

function resetPosterState() {
  if (posterState.blobUrl) URL.revokeObjectURL(posterState.blobUrl);
  Object.assign(posterState, { blob: null, blobUrl: null, existingKey: null, removed: false });
}

function currentPosterUrl() {
  if (posterState.blobUrl) return posterState.blobUrl;
  if (posterState.existingKey && !posterState.removed) return photoUrl(posterState.existingKey);
  return null;
}

function setCount(inputId) {
  const el = $id(`${inputId}_count`);
  const input = $id(inputId);
  if (el) el.textContent = `${input.value.length}/${input.maxLength}`;
}

// Renders the exact public card (same classes as js/main.js renderLiveEvents).
function renderLivePreview() {
  ["lv_title", "lv_tagline", "lv_location"].forEach(setCount);
  const published = $id("lv_published").checked;
  $id("lv_published_label").textContent = published ? "Published — visible on the public site" : "Draft — hidden from the public site";

  const title = $id("lv_title").value.trim() || "Event title";
  const tagline = $id("lv_tagline").value.trim() || "A one-line description appears here.";
  const startVal = $id("lv_date").value;
  const start = startVal ? new Date(startVal) : null;
  const location = $id("lv_location").value.trim() || "Location";
  const posterUrl = currentPosterUrl();

  let d = 0, h = 0, m = 0;
  if (start) {
    const diff = Math.max(0, start - new Date());
    d = Math.floor(diff / 864e5); h = Math.floor(diff / 36e5) % 24; m = Math.floor(diff / 6e4) % 60;
  }
  const pad = (n) => String(n).padStart(2, "0");
  const chipText = !published ? "Draft" : start && start <= new Date() ? "Live Now" : "Open for Registration";
  const chipClass = !published ? "closed" : start && start <= new Date() ? "live" : "upcoming";

  $id("livePreview").innerHTML = `
    <div class="live-card__img" id="lvPosterFrame" title="Click to change poster">
      ${posterUrl ? `<img class="poster-fit" src="${posterUrl}" alt="">` : posterMarkup(null, title)}
      ${posterUrl ? `<div class="adm-poster-actions"><button type="button" data-remove-poster>Remove</button></div>` : ""}
    </div>
    <div class="live-card__body">
      <div class="live-card__top"><span class="status-chip status-chip--${chipClass}">${chipText}</span></div>
      <h3>${escapeHtml(title)}</h3>
      <p class="live-card__tagline">${escapeHtml(tagline)}</p>
      <div class="live-card__meta">
        <span>🗓 ${start ? start.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Date"}</span>
        <span>⏰ ${start ? start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "Time"}</span>
        <span>📍 ${escapeHtml(location)}</span>
      </div>
      <div class="flip-timer">
        ${[["Days", d], ["Hrs", h], ["Min", m], ["Sec", 0]].map(([l, v]) => `<div class="flip-unit"><div class="flip-unit__face">${pad(v)}</div><span class="flip-unit__label">${l}</span></div>`).join("")}
      </div>
      <div class="live-card__ctas">
        <a class="btn btn--primary">Register on Settersync ↗</a>
        <a class="btn btn--ghost">Volunteer for this event</a>
      </div>
    </div>`;

  $id("lvPosterFrame").addEventListener("click", (e) => {
    if (e.target.closest("[data-remove-poster]")) {
      posterState.removed = true;
      if (posterState.blobUrl) URL.revokeObjectURL(posterState.blobUrl);
      posterState.blob = null; posterState.blobUrl = null;
      renderLivePreview();
      return;
    }
    pickPoster();
  });
}

function pickPoster() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/png,image/jpeg,image/webp";
  input.onchange = () => input.files[0] && openCropper(input.files[0], {
    outW: POSTER_W, outH: POSTER_H,
    title: "Position the poster",
    hint: "Posters are always shown in a 3:2 frame. Drag to reposition and use the slider to zoom — what is inside the frame is exactly what gets saved, so nothing is cropped or letterboxed later.",
    onApply: (blob) => {
      if (posterState.blobUrl) URL.revokeObjectURL(posterState.blobUrl);
      posterState.blob = blob;
      posterState.blobUrl = URL.createObjectURL(blob);
      posterState.removed = false;
      renderLivePreview();
    },
  });
  input.click();
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "event";
}

async function uniqueEventId(title, start) {
  const base = `${slugify(title)}-${start.getFullYear()}`;
  for (let n = 0; n < 20; n++) {
    const candidate = n === 0 ? base : `${base}-${n + 1}`;
    const { data } = await supabaseClient.from("events").select("id").eq("id", candidate).maybeSingle();
    if (!data) return candidate;
  }
  return `${base}-${Date.now()}`;
}

async function saveLiveEvent(e) {
  e.preventDefault();
  const errorEl = $id("liveFormError");
  errorEl.textContent = "";

  const title = $id("lv_title").value.trim();
  const startVal = $id("lv_date").value;
  const location = $id("lv_location").value.trim();
  const register = $id("lv_register").value.trim();
  if (!title) return (errorEl.textContent = "Title is required.");
  if (!startVal) return (errorEl.textContent = "Start date and time are required.");
  if (!location) return (errorEl.textContent = "Location is required.");
  if (!/^https?:\/\//i.test(register)) return (errorEl.textContent = "Registration link must start with http:// or https://");
  const endVal = $id("lv_end_date").value;
  if (endVal && new Date(endVal) <= new Date(startVal)) return (errorEl.textContent = "End time must be after the start time.");
  if ($id("lv_published").checked && !currentPosterUrl() &&
      !confirm("This event has no poster — visitors will see the “Poster coming soon” placeholder. Publish anyway?")) return;

  const saveBtn = $id("liveSave");
  saveBtn.disabled = true;
  saveBtn.textContent = "Saving…";
  try {
    const start = new Date(startVal);
    const id = liveEditingId || (await uniqueEventId(title, start));
    const record = {
      title,
      tagline: $id("lv_tagline").value.trim() || null,
      event_date: start.toISOString(),
      end_date: endVal ? new Date(endVal).toISOString() : null,
      location,
      register_link: register,
      description: $id("lv_description").value.trim() || null,
      status: $id("lv_published").checked ? "published" : "draft",
      updated_at: new Date().toISOString(),
    };
    const { error } = liveEditingId
      ? await supabaseClient.from("events").update(record).eq("id", id)
      : await supabaseClient.from("events").insert({ id, ...record });
    if (error) throw error;

    await savePoster(id);
    closeLiveEditor();
    await Promise.all([loadLiveEvents(), loadEvents()]);
  } catch (err) {
    errorEl.textContent = err.message || String(err);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Save event";
  }
}

// The poster is the event_photos row flagged is_poster; replace or remove it.
async function savePoster(eventId) {
  const replacing = !!posterState.blob;
  if (!replacing && !posterState.removed) return;

  let uploaded = null;
  if (replacing) {
    const file = new File([posterState.blob], "poster.jpg", { type: "image/jpeg" });
    uploaded = await uploadImage("event", eventId, file);
  }
  const { data: old } = await supabaseClient.from("event_photos").select("id, storage_key").eq("event_id", eventId).eq("is_poster", true);
  if (uploaded) {
    const { error } = await supabaseClient.from("event_photos").insert({ event_id: eventId, storage_key: uploaded.storageKey, is_poster: true, sort_order: -1 });
    if (error) throw error;
  }
  for (const row of old || []) {
    await supabaseClient.from("event_photos").delete().eq("id", row.id);
    deleteImage(row.storage_key).catch(() => {});
  }
}
