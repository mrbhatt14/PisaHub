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
  initCropper();
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
  const list = data.filter((ev) => eventEnd(ev) >= now);
  empty.classList.toggle("admin-hidden", list.length > 0);

  for (const ev of list) {
    const poster = (ev.event_photos || []).find((p) => p.is_poster);
    const started = new Date(ev.event_date) <= now;
    const chip = ev.status === "draft" ? ["draft", "Draft"] : started ? ["live", "Live now"] : ["", "Open for registration"];
    const card = document.createElement("article");
    card.className = "adm-ev";
    card.innerHTML = `
      <div class="adm-ev__poster">
        ${posterMarkup(poster ? photoUrl(poster.storage_key) : null, ev.title)}
        <span class="adm-ev__chip ${chip[0] ? `adm-ev__chip--${chip[0]}` : ""}">${chip[1]}</span>
      </div>
      <div class="adm-ev__body">
        <h3>${escapeHtml(ev.title)}</h3>
        <div class="adm-ev__meta">${escapeHtml(fmtWhen(ev.event_date))}</div>
        <div class="adm-ev__meta">${escapeHtml(ev.location || "No location")}</div>
        <div class="adm-ev__actions">
          <button class="admin-btn" data-edit="${ev.id}">Edit</button>
          <button class="admin-btn admin-btn--ghost" data-del="${ev.id}">Delete</button>
        </div>
      </div>`;
    grid.appendChild(card);
  }
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
  const { data: photos } = await supabaseClient.from("event_photos").select("storage_key").eq("event_id", id);
  const { error } = await supabaseClient.from("events").delete().eq("id", id);
  if (error) return alert(`Failed to delete: ${error.message}`);
  (photos || []).forEach((p) => deleteImage(p.storage_key).catch(() => {}));
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
  input.onchange = () => input.files[0] && openCropper(input.files[0]);
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

// ---------------------------------------------------------------------------
// Poster cropper (fixed 3:2 frame, drag + zoom, exports 1500x1000 JPEG)
// ---------------------------------------------------------------------------

const crop = { img: null, nw: 0, nh: 0, scale: 1, minScale: 1, x: 0, y: 0, vw: 0, vh: 0, drag: null };

function initCropper() {
  const stage = $id("cropStage");
  $id("cropCancel").addEventListener("click", () => $id("cropBackdrop").classList.add("admin-hidden"));
  $id("cropApply").addEventListener("click", applyCrop);
  $id("cropZoom").addEventListener("input", (e) => setCropScale(crop.minScale * Number(e.target.value)));
  stage.addEventListener("pointerdown", (e) => {
    stage.setPointerCapture(e.pointerId);
    crop.drag = { px: e.clientX, py: e.clientY, x: crop.x, y: crop.y };
  });
  stage.addEventListener("pointermove", (e) => {
    if (!crop.drag) return;
    crop.x = crop.drag.x + (e.clientX - crop.drag.px);
    crop.y = crop.drag.y + (e.clientY - crop.drag.py);
    paintCrop();
  });
  ["pointerup", "pointercancel"].forEach((t) => stage.addEventListener(t, () => (crop.drag = null)));
}

function openCropper(file) {
  const url = URL.createObjectURL(file);
  const img = $id("cropImg");
  img.onload = () => {
    crop.img = img; crop.nw = img.naturalWidth; crop.nh = img.naturalHeight;
    $id("cropBackdrop").classList.remove("admin-hidden");
    const rect = $id("cropStage").getBoundingClientRect();
    crop.vw = rect.width; crop.vh = rect.height;
    crop.minScale = Math.max(crop.vw / crop.nw, crop.vh / crop.nh); // cover: no empty space possible
    $id("cropZoom").value = 1;
    crop.scale = crop.minScale;
    crop.x = (crop.vw - crop.nw * crop.scale) / 2;
    crop.y = (crop.vh - crop.nh * crop.scale) / 2;
    paintCrop();
    const soft = crop.nw < POSTER_W;
    $id("cropQuality").textContent = `Original: ${crop.nw}×${crop.nh}px. ` + (soft
      ? `Smaller than ${POSTER_W}px wide, so it may look slightly soft on large screens — a larger image is better.`
      : "Resolution is good.");
  };
  img.src = url;
}

function setCropScale(s) {
  const cx = crop.vw / 2, cy = crop.vh / 2; // zoom around the frame centre
  const ratio = s / crop.scale;
  crop.x = cx - (cx - crop.x) * ratio;
  crop.y = cy - (cy - crop.y) * ratio;
  crop.scale = s;
  paintCrop();
}

function paintCrop() {
  crop.x = Math.min(0, Math.max(crop.vw - crop.nw * crop.scale, crop.x));
  crop.y = Math.min(0, Math.max(crop.vh - crop.nh * crop.scale, crop.y));
  crop.img.style.width = `${crop.nw * crop.scale}px`;
  crop.img.style.height = `${crop.nh * crop.scale}px`;
  crop.img.style.transform = `translate(${crop.x}px, ${crop.y}px)`;
}

function applyCrop() {
  const canvas = document.createElement("canvas");
  canvas.width = POSTER_W; canvas.height = POSTER_H;
  const sx = -crop.x / crop.scale, sy = -crop.y / crop.scale;
  const sw = crop.vw / crop.scale, sh = crop.vh / crop.scale;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(crop.img, sx, sy, sw, sh, 0, 0, POSTER_W, POSTER_H);
  canvas.toBlob((blob) => {
    if (posterState.blobUrl) URL.revokeObjectURL(posterState.blobUrl);
    posterState.blob = blob;
    posterState.blobUrl = URL.createObjectURL(blob);
    posterState.removed = false;
    $id("cropBackdrop").classList.add("admin-hidden");
    renderLivePreview();
  }, "image/jpeg", 0.9);
}
