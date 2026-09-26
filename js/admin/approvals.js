// Approvals module (maintainers and admins). Everything a contributor adds waits here:
//   * events they submitted (status "pending") - approve = publish, or send back with a note
//   * photos they added to live events (approved = false) - approve or reject (delete)
// Nothing becomes public until it is approved here.

const appr = { events: [], photoGroups: [] };
const aEl = (id) => document.getElementById(id);

async function initApprovals() {
  await refreshApprovalsBadge();
}

async function refreshApprovalsBadge() {
  if (!canReview()) return;
  const [e, p] = await Promise.all([
    supabaseClient.from("events").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabaseClient.from("event_photos").select("id, events!inner(status)", { count: "exact", head: true }).eq("approved", false).eq("events.status", "published"),
  ]);
  const n = (e.count || 0) + (p.count || 0);
  const badge = aEl("approvalsCount");
  badge.textContent = n;
  badge.classList.toggle("admin-hidden", n === 0);
}

const who = (row) => (row.profiles && (row.profiles.display_name || row.profiles.username)) || "a Contributor";
const when = (iso) => (iso ? new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "");

async function loadApprovals() {
  if (!canReview()) return;
  aEl("apprError").textContent = "";
  const [ev, ph] = await Promise.all([
    supabaseClient.from("events")
      .select("*, event_photos(id, storage_key, thumb_key, is_poster, approved), profiles(display_name, username)")
      .eq("status", "pending").order("submitted_at", { ascending: true }),
    supabaseClient.from("event_photos")
      .select("id, storage_key, thumb_key, created_at, event_id, events!inner(id, title, event_date, status), profiles(display_name, username)")
      .eq("approved", false).eq("events.status", "published").order("created_at", { ascending: true }),
  ]);
  if (ev.error || ph.error) { aEl("apprError").textContent = (ev.error || ph.error).message; return; }
  appr.events = ev.data;

  // group pending photos by event
  const groups = new Map();
  for (const p of ph.data) {
    if (!groups.has(p.event_id)) groups.set(p.event_id, { event: p.events, who: who(p), photos: [] });
    groups.get(p.event_id).photos.push(p);
  }
  appr.photoGroups = [...groups.values()];
  renderApprovalEvents();
  renderApprovalPhotos();
  refreshApprovalsBadge();
}

function renderApprovalEvents() {
  aEl("apprEventsCount").textContent = appr.events.length;
  aEl("apprEventsEmpty").classList.toggle("admin-hidden", appr.events.length > 0);
  aEl("apprEvents").innerHTML = appr.events.map((ev) => {
    const poster = (ev.event_photos || []).find((p) => p.is_poster);
    const photos = (ev.event_photos || []).filter((p) => !p.is_poster).length;
    return `
    <article class="adm-review" data-id="${escapeHtml(ev.id)}">
      <div class="adm-review__poster">${posterMarkup(poster ? photoUrl(poster.storage_key) : null, ev.title)}</div>
      <div>
        <h4>${escapeHtml(ev.title)}</h4>
        <div class="adm-hint" style="margin:0">Submitted by ${escapeHtml(who(ev))} · ${when(ev.submitted_at)}</div>
        <dl>
          <dt>When</dt><dd>${escapeHtml(fmtWhen(ev.event_date))}${ev.end_date ? " → " + escapeHtml(fmtWhen(ev.end_date)) : ""}</dd>
          <dt>Where</dt><dd>${escapeHtml(ev.location || "—")}</dd>
          <dt>Tagline</dt><dd>${escapeHtml(ev.tagline || "—")}</dd>
          <dt>Register</dt><dd>${/^https?:\/\//i.test(ev.register_link || "") ? `<a href="${escapeHtml(ev.register_link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(ev.register_link)}</a>` : ev.register_link ? `<strong>Not a web link:</strong> ${escapeHtml(ev.register_link)}` : "—"}</dd>
          <dt>Description</dt><dd>${escapeHtml((ev.description || "—").slice(0, 400))}</dd>
          <dt>Photos</dt><dd>${poster ? "poster" : "<strong>no poster</strong>"}${photos ? ` + ${photos} gallery photo${photos === 1 ? "" : "s"}` : ""}</dd>
        </dl>
        <div class="adm-review__actions">
          <button class="admin-btn" data-approve-event="${escapeHtml(ev.id)}">Approve &amp; publish</button>
          <button class="admin-btn admin-btn--ghost" data-edit-event="${escapeHtml(ev.id)}">Edit details first</button>
          <button class="admin-btn admin-btn--ghost" data-sendback="${escapeHtml(ev.id)}">Send back…</button>
        </div>
      </div>
    </article>`;
  }).join("");
  aEl("apprEvents").querySelectorAll("[data-approve-event]").forEach((b) => b.addEventListener("click", () => approveEvent(b.dataset.approveEvent)));
  aEl("apprEvents").querySelectorAll("[data-sendback]").forEach((b) => b.addEventListener("click", () => sendBackEvent(b.dataset.sendback)));
  aEl("apprEvents").querySelectorAll("[data-edit-event]").forEach((b) => b.addEventListener("click", () => openLiveEditor(b.dataset.editEvent)));
}

async function approveEvent(id) {
  const ev = appr.events.find((e) => e.id === id);
  const noPoster = !(ev.event_photos || []).some((p) => p.is_poster);
  if (!confirm(`Publish “${ev.title}”? It goes live on the website straight away.${noPoster ? "\n\nNote: it has no poster, so visitors will see a “Poster coming soon” placeholder." : ""}`)) return;
  // photos first: if the second step failed the event would still be pending (invisible), never live without its poster
  const p = await supabaseClient.from("event_photos").update({ approved: true }).eq("event_id", id);
  if (p.error) return (aEl("apprError").textContent = p.error.message);
  const e = await supabaseClient.from("events").update({ status: "published", review_note: null }).eq("id", id);
  if (e.error) return (aEl("apprError").textContent = e.error.message);
  await afterReview();
}

async function sendBackEvent(id) {
  const note = prompt("Tell them what to change (they will see this note):", "");
  if (note === null) return;
  if (!note.trim()) return alert("Please write a short note so they know what to fix.");
  const { error } = await supabaseClient.from("events").update({ status: "draft", review_note: note.trim() }).eq("id", id);
  if (error) return (aEl("apprError").textContent = error.message);
  await afterReview();
}

function renderApprovalPhotos() {
  const total = appr.photoGroups.reduce((n, g) => n + g.photos.length, 0);
  aEl("apprPhotosCount").textContent = total;
  aEl("apprPhotosEmpty").classList.toggle("admin-hidden", total > 0);
  aEl("apprPhotos").innerHTML = appr.photoGroups.map((g) => `
    <section class="adm-pending-group" data-event="${escapeHtml(g.event.id)}">
      <header>
        <div><strong>${escapeHtml(g.event.title)}</strong> <span class="adm-hint" style="margin:0">· ${g.photos.length} photo${g.photos.length === 1 ? "" : "s"} from ${escapeHtml(g.who)}</span></div>
        <span style="display:flex; gap:8px; flex-wrap:wrap;">
          <button class="admin-btn admin-btn--ghost" data-photo-sel-all="${escapeHtml(g.event.id)}">Select all</button>
          <button class="admin-btn" data-photo-approve="${escapeHtml(g.event.id)}">Approve selected</button>
          <button class="admin-btn admin-btn--danger" data-photo-reject="${escapeHtml(g.event.id)}">Reject selected</button>
        </span>
      </header>
      <div class="adm-photos">
        ${g.photos.map((p) => `<label class="adm-photo" style="cursor:pointer"><img src="${photoUrl(p.thumb_key || p.storage_key)}" alt="" loading="lazy"><span class="adm-photo__check"><input type="checkbox" value="${escapeHtml(p.id)}"></span></label>`).join("")}
      </div>
    </section>`).join("");
  const box = aEl("apprPhotos");
  const picked = (eventId) => [...box.querySelectorAll(`[data-event="${escapeHtml(eventId)}"] input:checked`)].map((i) => i.value);
  box.querySelectorAll("[data-photo-sel-all]").forEach((b) => b.addEventListener("click", () => {
    const boxes = [...box.querySelectorAll(`[data-event="${escapeHtml(b.dataset.photoSelAll)}"] input`)];
    const all = boxes.every((i) => i.checked); boxes.forEach((i) => (i.checked = !all));
  }));
  box.querySelectorAll("[data-photo-approve]").forEach((b) => b.addEventListener("click", () => reviewPhotos(picked(b.dataset.photoApprove), true)));
  box.querySelectorAll("[data-photo-reject]").forEach((b) => b.addEventListener("click", () => reviewPhotos(picked(b.dataset.photoReject), false)));
}

async function reviewPhotos(ids, approve) {
  if (!ids.length) return alert("Select at least one photo first.");
  if (!approve && !confirm(`Reject and permanently delete ${ids.length} photo${ids.length === 1 ? "" : "s"}?`)) return;
  if (approve) {
    const { error } = await supabaseClient.from("event_photos").update({ approved: true }).in("id", ids);
    if (error) return (aEl("apprError").textContent = error.message);
  } else {
    const { data } = await supabaseClient.from("event_photos").select("storage_key, thumb_key").in("id", ids);
    const { error } = await supabaseClient.from("event_photos").delete().in("id", ids);
    if (error) return (aEl("apprError").textContent = error.message);
    (data || []).flatMap((p) => [p.storage_key, p.thumb_key].filter(Boolean)).forEach((k) => deleteImage(k).catch(() => {}));
  }
  await afterReview();
}

async function afterReview() {
  await Promise.all([loadApprovals(), loadLiveEvents(), loadGalleryEvents(), loadEvents()]);
}
