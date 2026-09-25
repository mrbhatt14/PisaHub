// Gallery module: per-event photo albums. Multi-upload (resized + thumbnail),
// drag-to-reorder, and bulk delete. Posters are managed elsewhere (is_poster rows
// are excluded here), so this only ever touches the event's gallery photos.

const gal = { eventId: null, photos: [], selected: new Set(), events: [], busy: false, dragId: null };
const galEl = (id) => document.getElementById(id);

async function initGallery() {
  galEl("galYear").addEventListener("change", renderGalleryEvents);
  galEl("galModalClose").addEventListener("click", closeGalleryManager);
  galEl("galAddBtn").addEventListener("click", () => galEl("galFileInput").click());
  galEl("galFileInput").addEventListener("change", (e) => { addGalleryFiles([...e.target.files]); e.target.value = ""; });
  galEl("galSelectAll").addEventListener("click", () => {
    const all = gal.selected.size === gal.photos.length;
    gal.selected = new Set(all ? [] : gal.photos.map((p) => p.id));
    renderGalleryPhotos();
  });
  galEl("galDeleteBtn").addEventListener("click", deleteSelectedPhotos);

  const drop = galEl("galDrop");
  ["dragenter", "dragover"].forEach((t) => drop.addEventListener(t, (e) => { if (isFileDrag(e)) { e.preventDefault(); drop.classList.add("is-over"); } }));
  ["dragleave", "drop"].forEach((t) => drop.addEventListener(t, () => drop.classList.remove("is-over")));
  drop.addEventListener("drop", (e) => { if (isFileDrag(e)) { e.preventDefault(); addGalleryFiles([...e.dataTransfer.files]); } });

  await loadGalleryEvents();
}

// Public site shows gallery photos only after the event has ended (end_date, or start + 6h).
const galEnded = (ev) => (ev.end_date ? new Date(ev.end_date) : new Date(new Date(ev.event_date).getTime() + 6 * 3600 * 1000)) <= new Date();

const isFileDrag = (e) => e.dataTransfer && [...e.dataTransfer.types].includes("Files");

// ---------------------------------------------------------------------------
// Event list
// ---------------------------------------------------------------------------

async function loadGalleryEvents() {
  const { data, error } = await supabaseClient
    .from("events")
    .select("id, title, event_date, end_date, status, event_photos(storage_key, thumb_key, is_poster, sort_order)")
    .order("event_date", { ascending: false });
  if (error) {
    galEl("galGrid").innerHTML = `<p class="admin-error">Failed to load events: ${escapeHtml(error.message)}</p>`;
    return;
  }
  gal.events = data;
  const years = [...new Set(data.map((e) => new Date(e.event_date).getFullYear()))].sort((a, b) => b - a);
  const sel = galEl("galYear");
  const keep = sel.value || "all";
  sel.innerHTML = `<option value="all">All years</option>` + years.map((y) => `<option value="${y}">${y}</option>`).join("");
  sel.value = years.map(String).includes(keep) ? keep : "all";
  renderGalleryEvents();
}

function renderGalleryEvents() {
  const year = galEl("galYear").value;
  const list = gal.events.filter((e) => year === "all" || String(new Date(e.event_date).getFullYear()) === year);
  const grid = galEl("galGrid");
  galEl("galEmpty").classList.toggle("admin-hidden", list.length > 0);
  grid.innerHTML = list.map((ev) => {
    const photos = (ev.event_photos || []).filter((p) => !p.is_poster).sort((a, b) => a.sort_order - b.sort_order);
    const cover = photos[0];
    return `
      <article class="adm-ev">
        <div class="adm-ev__poster">
          ${cover ? `<img src="${photoUrl(cover.thumb_key || cover.storage_key)}" alt="" loading="lazy">` : `<div class="poster-tba"><span class="poster-tba__tag">No photos yet</span></div>`}
          <span class="adm-ev__chip ${ev.status === "draft" ? "adm-ev__chip--draft" : ""}">${photos.length} photo${photos.length === 1 ? "" : "s"}${ev.status === "draft" ? " · draft" : ""}</span>
        </div>
        <div class="adm-ev__body">
          <h3>${escapeHtml(ev.title)}</h3>
          <div class="adm-ev__meta">${new Date(ev.event_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
          <div class="adm-ev__meta adm-vis ${galEnded(ev) && ev.status === "published" ? "is-public" : ""}">${ev.status !== "published" ? "Draft — not public" : galEnded(ev) ? "Photos are public" : "Photos stay hidden until the event ends"}</div>
          <div class="adm-ev__actions"><button class="admin-btn" data-gal="${ev.id}">Manage photos</button></div>
        </div>
      </article>`;
  }).join("");
  grid.querySelectorAll("[data-gal]").forEach((b) => b.addEventListener("click", () => openGalleryManager(b.dataset.gal)));
}

// ---------------------------------------------------------------------------
// Manager
// ---------------------------------------------------------------------------

async function openGalleryManager(eventId) {
  gal.eventId = eventId;
  gal.selected = new Set();
  const ev = gal.events.find((e) => e.id === eventId);
  galEl("galModalTitle").textContent = ev ? ev.title : eventId;
  const note = galEl("galVisibility");
  const hidden = ev && (ev.status !== "published" || !galEnded(ev));
  note.classList.toggle("admin-hidden", !hidden);
  if (hidden) note.textContent = ev.status !== "published"
    ? "This event is a draft, so nothing here is public yet."
    : `Photos you add now stay hidden from visitors until the event ends (${new Date(ev.end_date || new Date(ev.event_date).getTime() + 6 * 3600 * 1000).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}), then appear automatically.`;
  galEl("galStatus").textContent = "";
  galEl("galModalBackdrop").classList.remove("admin-hidden");
  await loadGalleryPhotos();
}

function closeGalleryManager() {
  if (gal.busy && !confirm("Uploads are still running. Close anyway?")) return;
  galEl("galModalBackdrop").classList.add("admin-hidden");
  gal.eventId = null;
  loadGalleryEvents();
  if (typeof loadEvents === "function") loadEvents();
}

async function loadGalleryPhotos() {
  const { data, error } = await supabaseClient
    .from("event_photos").select("*").eq("event_id", gal.eventId).eq("is_poster", false).order("sort_order", { ascending: true });
  if (error) { galEl("galPhotos").innerHTML = `<p class="admin-error">${escapeHtml(error.message)}</p>`; return; }
  gal.photos = data;
  renderGalleryPhotos();
}

function renderGalleryPhotos() {
  const box = galEl("galPhotos");
  galEl("galCount").textContent = `${gal.photos.length} photo${gal.photos.length === 1 ? "" : "s"}`;
  galEl("galDeleteBtn").textContent = `Delete selected (${gal.selected.size})`;
  galEl("galDeleteBtn").disabled = gal.selected.size === 0;
  galEl("galSelectAll").textContent = gal.selected.size === gal.photos.length && gal.photos.length ? "Clear selection" : "Select all";
  galEl("galPhotosEmpty").classList.toggle("admin-hidden", gal.photos.length > 0);

  box.innerHTML = gal.photos.map((p, i) => `
    <div class="adm-photo${gal.selected.has(p.id) ? " is-selected" : ""}" draggable="true" data-id="${p.id}">
      <img src="${photoUrl(p.thumb_key || p.storage_key)}" alt="Photo ${i + 1}" loading="lazy" draggable="false">
      <span class="adm-photo__n">${i + 1}</span>
      <label class="adm-photo__check"><input type="checkbox" ${gal.selected.has(p.id) ? "checked" : ""} aria-label="Select photo ${i + 1}"></label>
    </div>`).join("");

  box.querySelectorAll(".adm-photo").forEach((tile) => {
    const id = tile.dataset.id;
    tile.querySelector("input").addEventListener("change", (e) => {
      e.target.checked ? gal.selected.add(id) : gal.selected.delete(id);
      renderGalleryPhotos();
    });
    tile.addEventListener("dragstart", (e) => { gal.dragId = id; tile.classList.add("is-dragging"); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", id); });
    tile.addEventListener("dragend", () => { gal.dragId = null; tile.classList.remove("is-dragging"); box.querySelectorAll(".is-drop").forEach((t) => t.classList.remove("is-drop")); });
    tile.addEventListener("dragover", (e) => { if (gal.dragId && gal.dragId !== id) { e.preventDefault(); tile.classList.add("is-drop"); } });
    tile.addEventListener("dragleave", () => tile.classList.remove("is-drop"));
    tile.addEventListener("drop", (e) => { if (!gal.dragId) return; e.preventDefault(); reorderPhoto(gal.dragId, id); });
  });
}

// Move `fromId` to the position of `toId`, then persist the new order.
async function reorderPhoto(fromId, toId) {
  const from = gal.photos.findIndex((p) => p.id === fromId);
  const to = gal.photos.findIndex((p) => p.id === toId);
  if (from < 0 || to < 0 || from === to) return;
  const [moved] = gal.photos.splice(from, 1);
  gal.photos.splice(to, 0, moved);
  renderGalleryPhotos();
  galEl("galStatus").textContent = "Saving order…";
  try {
    const changed = gal.photos.map((p, i) => ({ p, i })).filter(({ p, i }) => p.sort_order !== i);
    for (let n = 0; n < changed.length; n += 10) {
      await Promise.all(changed.slice(n, n + 10).map(async ({ p, i }) => {
        const { error } = await supabaseClient.from("event_photos").update({ sort_order: i }).eq("id", p.id);
        if (error) throw error;
        p.sort_order = i;
      }));
    }
    galEl("galStatus").textContent = "Order saved.";
  } catch (err) {
    galEl("galStatus").textContent = `Could not save order: ${err.message}`;
    await loadGalleryPhotos();
  }
}

async function deleteSelectedPhotos() {
  const ids = [...gal.selected];
  if (!ids.length || !confirm(`Delete ${ids.length} photo${ids.length === 1 ? "" : "s"}? This also removes them from the public gallery.`)) return;
  const targets = gal.photos.filter((p) => gal.selected.has(p.id));
  galEl("galStatus").textContent = `Deleting ${targets.length}…`;
  const { error } = await supabaseClient.from("event_photos").delete().in("id", ids);
  if (error) { galEl("galStatus").textContent = `Failed to delete: ${error.message}`; return; }
  targets.forEach((p) => {
    deleteImage(p.storage_key).catch(() => {});
    if (p.thumb_key) deleteImage(p.thumb_key).catch(() => {});
  });
  gal.selected = new Set();
  galEl("galStatus").textContent = `Deleted ${targets.length}.`;
  await loadGalleryPhotos();
  // renumber so sort_order stays contiguous
  gal.photos.forEach((p, i) => { if (p.sort_order !== i) supabaseClient.from("event_photos").update({ sort_order: i }).eq("id", p.id).then(() => {}); });
}

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------

async function addGalleryFiles(files) {
  const images = files.filter((f) => /^image\//.test(f.type) || /\.(jpe?g|png|webp|heic|heif)$/i.test(f.name));
  if (!images.length || gal.busy) return;
  gal.busy = true;
  const status = galEl("galStatus");
  const errors = [];
  let done = 0;
  let nextOrder = gal.photos.length ? Math.max(...gal.photos.map((p) => p.sort_order)) + 1 : 0;
  const eventId = gal.eventId;
  const queue = images.slice();

  // Two workers: image decoding/encoding is CPU-heavy, more than that just thrashes the browser.
  const worker = async () => {
    while (queue.length) {
      const file = queue.shift();
      const order = nextOrder++;
      try {
        const { full, thumb } = await prepareGalleryImage(file);
        const [main, small] = await Promise.all([uploadImage("event", eventId, full), uploadImage("event", eventId, thumb)]);
        const { error } = await supabaseClient.from("event_photos").insert({
          event_id: eventId, storage_key: main.storageKey, thumb_key: small.storageKey, is_poster: false, sort_order: order,
        });
        if (error) {
          deleteImage(main.storageKey).catch(() => {}); deleteImage(small.storageKey).catch(() => {});
          throw error;
        }
      } catch (err) {
        errors.push(err.message || String(err));
      }
      done++;
      status.textContent = `Uploading… ${done} of ${images.length}`;
    }
  };
  status.textContent = `Uploading… 0 of ${images.length}`;
  await Promise.all([worker(), worker()]);
  gal.busy = false;
  status.textContent = errors.length
    ? `Finished with ${errors.length} problem${errors.length === 1 ? "" : "s"}: ${errors.slice(0, 3).join(" | ")}${errors.length > 3 ? " …" : ""}`
    : `Uploaded ${images.length} photo${images.length === 1 ? "" : "s"}.`;
  if (gal.eventId === eventId) await loadGalleryPhotos();
}
