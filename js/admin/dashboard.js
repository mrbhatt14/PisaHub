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
  }

  document.getElementById("signOutBtn").addEventListener("click", signOut);
  document.querySelectorAll(".admin-nav button[data-tab]").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  document.getElementById("newEventBtn").addEventListener("click", () => openEventModal(null));
  document.getElementById("eventModalCancel").addEventListener("click", closeEventModal);
  document.getElementById("eventForm").addEventListener("submit", saveEvent);

  document.getElementById("newMemberBtn").addEventListener("click", () => openMemberModal(null));
  document.getElementById("memberModalCancel").addEventListener("click", closeMemberModal);
  document.getElementById("memberForm").addEventListener("submit", saveMember);

  await loadEvents();
  await loadTeam();
}

function switchTab(tab) {
  document.querySelectorAll(".admin-nav button[data-tab]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tab);
  });
  ["events", "team", "users"].forEach((name) => {
    document.getElementById(`panel-${name}`).classList.toggle("admin-hidden", name !== tab);
  });
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
// Team list
// ---------------------------------------------------------------------------

let editingMemberId = null; // null = creating a new member

async function loadTeam() {
  const { data: members, error } = await supabaseClient
    .from("team_members")
    .select("id, name, role, section, sort_order")
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
    tr.innerHTML = `
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
  const form = document.getElementById("memberForm");
  form.reset();
  document.getElementById("memberFormError").textContent = "";

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

  const record = {
    name: document.getElementById("tm_name").value.trim(),
    role: document.getElementById("tm_role").value.trim(),
    section: document.getElementById("tm_section").value,
    instagram: document.getElementById("tm_instagram").value.trim() || null,
    linkedin: document.getElementById("tm_linkedin").value.trim() || null,
    quote: document.getElementById("tm_quote").value.trim() || null,
    sort_order: parseInt(document.getElementById("tm_sort_order").value, 10) || 0,
  };

  let error;
  if (editingMemberId) {
    ({ error } = await supabaseClient.from("team_members").update(record).eq("id", editingMemberId));
  } else {
    ({ error } = await supabaseClient.from("team_members").insert(record));
  }

  saveBtn.disabled = false;
  if (error) {
    errorEl.textContent = error.message;
    return;
  }

  closeMemberModal();
  await loadTeam();
}

async function deleteMember(id) {
  if (!confirm("Delete this team member?")) return;
  const { error } = await supabaseClient.from("team_members").delete().eq("id", id);
  if (error) {
    alert(`Failed to delete: ${error.message}`);
    return;
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
