let currentProfile = null;
let editingEventId = null; // null = creating a new event

init();

async function init() {
  const auth = await requireAuth("maintainer");
  if (!auth) return; // requireAuth already redirected
  currentProfile = auth.profile;

  document.getElementById("whoami").textContent =
    `${auth.session.user.email} · ${currentProfile.role}`;
  if (currentProfile.role === "admin") {
    document.getElementById("usersTabBtn").style.display = "";
    document.getElementById("adminSideLabel").style.display = "";
  }

  document.getElementById("signOutBtn").addEventListener("click", signOut);
  document.querySelectorAll(".admin-side button[data-tab]").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });
  document.querySelectorAll("[data-goto]").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.goto));
  });
  document.getElementById("homePreviewReload").addEventListener("click", () => loadHomePreview(true));
  window.addEventListener("hashchange", () => switchTab(currentTabFromHash(), { updateHash: false }));

  document.getElementById("newEventBtn").addEventListener("click", () => openEventModal(null));
  document.getElementById("eventModalCancel").addEventListener("click", closeEventModal);
  document.getElementById("eventForm").addEventListener("submit", saveEvent);

  document.getElementById("photosModalClose").addEventListener("click", closePhotosModal);
  document.getElementById("photosUploadInput").addEventListener("change", handlePhotoUpload);

  document.getElementById("newMemberBtn").addEventListener("click", () => openMemberModal(null));
  document.getElementById("memberModalCancel").addEventListener("click", closeMemberModal);
  document.getElementById("memberForm").addEventListener("submit", saveMember);

  switchTab(currentTabFromHash(), { updateHash: false });
  await Promise.all([loadEvents(), loadTeam(), initLiveEvents()]);
}

const TABS = ["home", "live", "events", "team", "users"];

// Tabs are routes: /admin/dashboard.html#live etc. so refresh, Back and shared links keep your place.
function currentTabFromHash() {
  const t = location.hash.replace("#", "");
  return TABS.includes(t) ? t : "home";
}

function switchTab(tab, { updateHash = true } = {}) {
  if (tab === "users" && currentProfile?.role !== "admin") tab = "home";
  document.querySelectorAll(".admin-side button[data-tab]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tab);
  });
  TABS.forEach((name) => {
    document.getElementById(`panel-${name}`).classList.toggle("admin-hidden", name !== tab);
  });
  if (updateHash && location.hash !== `#${tab}`) history.pushState(null, "", `#${tab}`);
  if (tab === "home") loadHomePreview();
}

function loadHomePreview(force = false) {
  const frame = document.getElementById("homeFrame");
  if (force || !frame.getAttribute("src")) frame.setAttribute("src", "/");
}

// ---------------------------------------------------------------------------
// Events list
// ---------------------------------------------------------------------------

async function loadEvents() {
  const { data: events, error } = await supabaseClient
    .from("events")
    .select("id, title, event_date, status, event_photos(count)")
    .order("event_date", { ascending: false });

  const tbody = document.getElementById("eventsTableBody");
  const empty = document.getElementById("eventsEmpty");
  tbody.innerHTML = "";

  if (error) {
    tbody.innerHTML = `<tr><td colspan="5">Failed to load events: ${escapeHtml(error.message)}</td></tr>`;
    return;
  }

  if (!events.length) {
    empty.classList.remove("admin-hidden");
    return;
  }
  empty.classList.add("admin-hidden");

  for (const ev of events) {
    const tr = document.createElement("tr");
    const photoCount = ev.event_photos?.[0]?.count ?? 0;
    tr.innerHTML = `
      <td>${escapeHtml(ev.title)}</td>
      <td>${new Date(ev.event_date).toLocaleString()}</td>
      <td><span class="admin-badge admin-badge--${ev.status}">${ev.status}</span></td>
      <td>${photoCount}</td>
      <td class="admin-row-actions">
        <button data-action="photos" data-id="${ev.id}">Photos</button>
        <button data-action="edit" data-id="${ev.id}">Edit</button>
        <button data-action="delete" data-id="${ev.id}">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  }

  tbody.querySelectorAll('button[data-action="edit"]').forEach((btn) => {
    btn.addEventListener("click", () => openEventModal(btn.dataset.id));
  });
  tbody.querySelectorAll('button[data-action="delete"]').forEach((btn) => {
    btn.addEventListener("click", () => deleteEvent(btn.dataset.id));
  });
  tbody.querySelectorAll('button[data-action="photos"]').forEach((btn) => {
    btn.addEventListener("click", () => openPhotosModal(btn.dataset.id));
  });
}

// ---------------------------------------------------------------------------
// Create / edit modal
// ---------------------------------------------------------------------------

async function openEventModal(id) {
  editingEventId = id;
  const form = document.getElementById("eventForm");
  form.reset();
  document.getElementById("eventFormError").textContent = "";
  document.getElementById("ev_id").disabled = !!id;

  if (id) {
    document.getElementById("eventModalTitle").textContent = "Edit event";
    const { data: ev, error } = await supabaseClient.from("events").select("*").eq("id", id).single();
    if (error) {
      alert(`Failed to load event: ${error.message}`);
      return;
    }
    document.getElementById("ev_id").value = ev.id;
    document.getElementById("ev_title").value = ev.title;
    document.getElementById("ev_tagline").value = ev.tagline ?? "";
    document.getElementById("ev_date").value = toLocalInputValue(ev.event_date);
    document.getElementById("ev_end_date").value = ev.end_date ? toLocalInputValue(ev.end_date) : "";
    document.getElementById("ev_location").value = ev.location ?? "";
    document.getElementById("ev_register_link").value = ev.register_link ?? "";
    document.getElementById("ev_description").value = ev.description ?? "";
    document.getElementById("ev_status").value = ev.status;
  } else {
    document.getElementById("eventModalTitle").textContent = "New event";
    document.getElementById("ev_status").value = "draft";
  }

  document.getElementById("eventModalBackdrop").classList.remove("admin-hidden");
}

function closeEventModal() {
  document.getElementById("eventModalBackdrop").classList.add("admin-hidden");
  editingEventId = null;
}

async function saveEvent(e) {
  e.preventDefault();
  const errorEl = document.getElementById("eventFormError");
  errorEl.textContent = "";
  const saveBtn = document.getElementById("eventModalSave");
  saveBtn.disabled = true;

  const record = {
    id: document.getElementById("ev_id").value.trim(),
    title: document.getElementById("ev_title").value.trim(),
    tagline: document.getElementById("ev_tagline").value.trim() || null,
    event_date: new Date(document.getElementById("ev_date").value).toISOString(),
    end_date: document.getElementById("ev_end_date").value
      ? new Date(document.getElementById("ev_end_date").value).toISOString()
      : null,
    location: document.getElementById("ev_location").value.trim() || null,
    register_link: document.getElementById("ev_register_link").value.trim() || null,
    description: document.getElementById("ev_description").value.trim() || null,
    status: document.getElementById("ev_status").value,
  };

  let error;
  if (editingEventId) {
    ({ error } = await supabaseClient.from("events").update(record).eq("id", editingEventId));
  } else {
    ({ error } = await supabaseClient.from("events").insert(record));
  }

  saveBtn.disabled = false;
  if (error) {
    errorEl.textContent = error.message;
    return;
  }

  closeEventModal();
  await loadEvents();
}

async function deleteEvent(id) {
  if (!confirm(`Delete "${id}"? This also deletes its photo records.`)) return;
  const { error } = await supabaseClient.from("events").delete().eq("id", id);
  if (error) {
    alert(`Failed to delete: ${error.message}`);
    return;
  }
  await loadEvents();
}

// ---------------------------------------------------------------------------
// Event photos
// ---------------------------------------------------------------------------

let currentPhotosEventId = null;

async function openPhotosModal(eventId) {
  currentPhotosEventId = eventId;
  document.getElementById("photosModalTitle").textContent = `Photos — ${eventId}`;
  document.getElementById("photosUploadStatus").textContent = "";
  document.getElementById("photosUploadInput").value = "";
  document.getElementById("photosModalBackdrop").classList.remove("admin-hidden");
  await loadPhotos();
}

function closePhotosModal() {
  document.getElementById("photosModalBackdrop").classList.add("admin-hidden");
  currentPhotosEventId = null;
}

async function loadPhotos() {
  const { data: photos, error } = await supabaseClient
    .from("event_photos")
    .select("*")
    .eq("event_id", currentPhotosEventId)
    .order("sort_order", { ascending: true });

  const grid = document.getElementById("photosGrid");
  const empty = document.getElementById("photosEmpty");
  grid.innerHTML = "";

  if (error) {
    grid.innerHTML = `<p>Failed to load photos: ${escapeHtml(error.message)}</p>`;
    return;
  }

  if (!photos.length) {
    empty.classList.remove("admin-hidden");
    await loadEvents(); // keep the table's photo count in sync
    return;
  }
  empty.classList.add("admin-hidden");

  for (const p of photos) {
    const cell = document.createElement("div");
    cell.style.cssText = "position:relative; border:1px solid var(--brown-line); border-radius:8px; overflow:hidden;";
    cell.innerHTML = `
      <img src="${photoUrl(p.storage_key)}" style="width:100%; height:100px; object-fit:cover; display:block;" />
      <div style="padding:6px; display:flex; flex-direction:column; gap:4px;">
        ${p.is_poster ? '<span class="admin-badge admin-badge--published">Poster</span>' : `<button data-action="poster" data-id="${p.id}" style="font-size:0.75rem; text-decoration:underline; background:none; border:none; color:var(--brown-mid); cursor:pointer;">Set as poster</button>`}
        <button data-action="delete-photo" data-id="${p.id}" data-key="${p.storage_key}" style="font-size:0.75rem; text-decoration:underline; background:none; border:none; color:#B3432E; cursor:pointer;">Delete</button>
      </div>
    `;
    grid.appendChild(cell);
  }

  grid.querySelectorAll('button[data-action="poster"]').forEach((btn) => {
    btn.addEventListener("click", () => setAsPoster(btn.dataset.id));
  });
  grid.querySelectorAll('button[data-action="delete-photo"]').forEach((btn) => {
    btn.addEventListener("click", () => deleteEventPhoto(btn.dataset.id, btn.dataset.key));
  });

  await loadEvents(); // keep the table's photo count in sync
}

async function handlePhotoUpload(e) {
  const files = Array.from(e.target.files || []);
  if (!files.length) return;
  const status = document.getElementById("photosUploadStatus");

  const { count } = await supabaseClient
    .from("event_photos")
    .select("id", { count: "exact", head: true })
    .eq("event_id", currentPhotosEventId);
  let nextSortOrder = count ?? 0;
  const isFirstEver = nextSortOrder === 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    status.textContent = `Uploading ${i + 1} of ${files.length}…`;
    try {
      const { storageKey } = await uploadImage("event", currentPhotosEventId, file);
      const { error } = await supabaseClient.from("event_photos").insert({
        event_id: currentPhotosEventId,
        storage_key: storageKey,
        sort_order: nextSortOrder++,
        is_poster: isFirstEver && i === 0,
      });
      if (error) throw error;
    } catch (err) {
      status.textContent = `Failed on file ${i + 1}: ${err.message}`;
      await loadPhotos();
      return;
    }
  }

  status.textContent = "";
  e.target.value = "";
  await loadPhotos();
}

async function setAsPoster(photoId) {
  await supabaseClient.from("event_photos").update({ is_poster: false }).eq("event_id", currentPhotosEventId);
  const { error } = await supabaseClient.from("event_photos").update({ is_poster: true }).eq("id", photoId);
  if (error) {
    alert(`Failed to set poster: ${error.message}`);
    return;
  }
  await loadPhotos();
}

async function deleteEventPhoto(photoId, storageKey) {
  if (!confirm("Delete this photo?")) return;
  const { error } = await supabaseClient.from("event_photos").delete().eq("id", photoId);
  if (error) {
    alert(`Failed to delete: ${error.message}`);
    return;
  }
  deleteImage(storageKey).catch(() => {}); // best-effort cleanup
  await loadPhotos();
}

// ---------------------------------------------------------------------------
// Team list
// ---------------------------------------------------------------------------

let editingMemberId = null; // null = creating a new member
let editingMemberStorageKey = null; // current photo's R2 key, if any

async function loadTeam() {
  const { data: members, error } = await supabaseClient
    .from("team_members")
    .select("id, name, role, section, sort_order, storage_key")
    .order("section", { ascending: true })
    .order("sort_order", { ascending: true });

  const tbody = document.getElementById("teamTableBody");
  const empty = document.getElementById("teamEmpty");
  tbody.innerHTML = "";

  if (error) {
    tbody.innerHTML = `<tr><td colspan="5">Failed to load team: ${escapeHtml(error.message)}</td></tr>`;
    return;
  }

  if (!members.length) {
    empty.classList.remove("admin-hidden");
    return;
  }
  empty.classList.add("admin-hidden");

  for (const m of members) {
    const tr = document.createElement("tr");
    const thumb = m.storage_key
      ? `<img src="${photoUrl(m.storage_key)}" style="width:32px; height:32px; border-radius:50%; object-fit:cover;" />`
      : "";
    tr.innerHTML = `
      <td>${thumb}</td>
      <td>${escapeHtml(m.name)}</td>
      <td>${escapeHtml(m.role)}</td>
      <td>${m.section === "exec" ? "Executive board" : "Committee"}</td>
      <td>${m.sort_order}</td>
      <td class="admin-row-actions">
        <button data-action="edit" data-id="${m.id}">Edit</button>
        <button data-action="delete" data-id="${m.id}">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  }

  tbody.querySelectorAll('button[data-action="edit"]').forEach((btn) => {
    btn.addEventListener("click", () => openMemberModal(btn.dataset.id));
  });
  tbody.querySelectorAll('button[data-action="delete"]').forEach((btn) => {
    btn.addEventListener("click", () => deleteMember(btn.dataset.id));
  });
}

async function openMemberModal(id) {
  editingMemberId = id;
  editingMemberStorageKey = null;
  const form = document.getElementById("memberForm");
  form.reset();
  document.getElementById("memberFormError").textContent = "";
  const preview = document.getElementById("tm_photo_preview");
  preview.classList.add("admin-hidden");
  preview.src = "";

  if (id) {
    document.getElementById("memberModalTitle").textContent = "Edit team member";
    const { data: m, error } = await supabaseClient.from("team_members").select("*").eq("id", id).single();
    if (error) {
      alert(`Failed to load member: ${error.message}`);
      return;
    }
    document.getElementById("tm_name").value = m.name;
    document.getElementById("tm_role").value = m.role;
    document.getElementById("tm_section").value = m.section;
    document.getElementById("tm_instagram").value = m.instagram ?? "";
    document.getElementById("tm_linkedin").value = m.linkedin ?? "";
    document.getElementById("tm_quote").value = m.quote ?? "";
    document.getElementById("tm_sort_order").value = m.sort_order;
    if (m.storage_key) {
      editingMemberStorageKey = m.storage_key;
      preview.src = photoUrl(m.storage_key);
      preview.classList.remove("admin-hidden");
    }
  } else {
    document.getElementById("memberModalTitle").textContent = "New team member";
    document.getElementById("tm_section").value = "committee";
    document.getElementById("tm_sort_order").value = 0;
  }

  document.getElementById("memberModalBackdrop").classList.remove("admin-hidden");
}

function closeMemberModal() {
  document.getElementById("memberModalBackdrop").classList.add("admin-hidden");
  editingMemberId = null;
}

async function saveMember(e) {
  e.preventDefault();
  const errorEl = document.getElementById("memberFormError");
  errorEl.textContent = "";
  const saveBtn = document.getElementById("memberModalSave");
  saveBtn.disabled = true;
  saveBtn.textContent = "Saving…";

  const id = editingMemberId || crypto.randomUUID();
  const file = document.getElementById("tm_photo").files[0];

  const record = {
    name: document.getElementById("tm_name").value.trim(),
    role: document.getElementById("tm_role").value.trim(),
    section: document.getElementById("tm_section").value,
    instagram: document.getElementById("tm_instagram").value.trim() || null,
    linkedin: document.getElementById("tm_linkedin").value.trim() || null,
    quote: document.getElementById("tm_quote").value.trim() || null,
    sort_order: parseInt(document.getElementById("tm_sort_order").value, 10) || 0,
  };

  try {
    if (file) {
      saveBtn.textContent = "Uploading photo…";
      const { storageKey } = await uploadImage("team", id, file);
      record.storage_key = storageKey;
      if (editingMemberStorageKey) {
        deleteImage(editingMemberStorageKey).catch(() => {}); // best-effort cleanup
      }
    }

    saveBtn.textContent = "Saving…";
    let error;
    if (editingMemberId) {
      ({ error } = await supabaseClient.from("team_members").update(record).eq("id", editingMemberId));
    } else {
      ({ error } = await supabaseClient.from("team_members").insert({ id, ...record }));
    }
    if (error) throw error;
  } catch (err) {
    errorEl.textContent = err.message;
    saveBtn.disabled = false;
    saveBtn.textContent = "Save";
    return;
  }

  saveBtn.disabled = false;
  saveBtn.textContent = "Save";
  closeMemberModal();
  await loadTeam();
}

async function deleteMember(id) {
  if (!confirm("Delete this team member?")) return;
  const { data: existing } = await supabaseClient.from("team_members").select("storage_key").eq("id", id).single();
  const { error } = await supabaseClient.from("team_members").delete().eq("id", id);
  if (error) {
    alert(`Failed to delete: ${error.message}`);
    return;
  }
  if (existing?.storage_key) {
    deleteImage(existing.storage_key).catch(() => {}); // best-effort cleanup
  }
  await loadTeam();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

// Convert a stored UTC ISO timestamp into the local value <input type="datetime-local"> expects.
function toLocalInputValue(isoString) {
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
