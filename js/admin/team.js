// Team module. A member belongs to a semester (term + year) and a group; the public
// Team page builds each semester's roster from exactly those fields.

const PRESET_GROUPS = ["Executive Board", "Directors", "Marketing Team", "Events Team", "Media & Outreach"];
const OTHER = "__other__";
// Every card on the public Team page is 1 : 1.05 (see `.team-grid--committee .team-card` in
// css/style.css), so headshots are cropped to exactly that shape.
const HEADSHOT_W = 1000;
const HEADSHOT_H = 1050;
const FIRST_YEAR = 2025;

const team = { members: [], editingId: null, photo: { blob: null, url: null, existingKey: null, removed: false } };
const tEl = (id) => document.getElementById(id);
const termLabel = (t) => (t === "spring" ? "Spring" : "Fall");
const semLabel = (m) => (m.term && m.year ? `${termLabel(m.term)} ${m.year}` : "");
const semRank = (m) => (m.term && m.year ? m.year * 10 + (m.term === "fall" ? 3 : 1) : -1);

async function initTeam() {
  tEl("newMemberBtn").addEventListener("click", () => openMemberModal(null));
  tEl("memberModalCancel").addEventListener("click", closeMemberModal);
  tEl("memberForm").addEventListener("submit", saveMember);
  tEl("teamSemFilter").addEventListener("change", renderTeamTable);
  ["tm_term", "tm_year"].forEach((id) => tEl(id).addEventListener("change", () => { refreshGroupOptions(); updatePlacement(); }));
  tEl("tm_group").addEventListener("change", () => { toggleOtherGroup(); updatePlacement(); });
  tEl("tm_group_other").addEventListener("input", updatePlacement);
  tEl("tmPhotoBtn").addEventListener("click", pickHeadshot);
  tEl("tmPhotoRemove").addEventListener("click", () => {
    if (team.photo.url) URL.revokeObjectURL(team.photo.url);
    Object.assign(team.photo, { blob: null, url: null, removed: true });
    paintHeadshot();
  });
  await loadTeam();
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

async function loadTeam() {
  const { data, error } = await supabaseClient.from("team_members").select("*").order("sort_order", { ascending: true });
  const tbody = tEl("teamTableBody");
  if (error) { tbody.innerHTML = `<tr><td colspan="7">Failed to load team: ${escapeHtml(error.message)}</td></tr>`; return; }
  team.members = data;

  const sems = [...new Map(data.filter((m) => m.term && m.year).map((m) => [semLabel(m), semRank(m)])).entries()]
    .sort((a, b) => b[1] - a[1]).map(([label]) => label);
  const hasLegacy = data.some((m) => !m.term || !m.year);
  const sel = tEl("teamSemFilter");
  const keep = sel.value || (sems[0] ?? "all");
  sel.innerHTML = sems.map((s) => `<option>${s}</option>`).join("") + (hasLegacy ? `<option value="__none">No semester set</option>` : "") + `<option value="all">All semesters</option>`;
  sel.value = [...sel.options].some((o) => o.value === keep) ? keep : (sems[0] ?? "all");
  renderTeamTable();
}

function renderTeamTable() {
  const f = tEl("teamSemFilter").value;
  const list = team.members
    .filter((m) => f === "all" || (f === "__none" ? !m.term || !m.year : semLabel(m) === f))
    .sort((a, b) => semRank(b) - semRank(a) || a.sort_order - b.sort_order);
  tEl("teamEmpty").classList.toggle("admin-hidden", list.length > 0);
  tEl("teamTableBody").innerHTML = list.map((m) => `
    <tr>
      <td>${m.storage_key ? `<img src="${photoUrl(m.storage_key)}" alt="" style="width:30px; height:40px; border-radius:6px; object-fit:cover;">` : ""}</td>
      <td>${escapeHtml(m.name)}</td>
      <td>${escapeHtml(m.role)}</td>
      <td>${escapeHtml(m.group_title || (m.section === "exec" ? "Executive Board" : "Committees"))}</td>
      <td>${semLabel(m) || `<span class="admin-badge admin-badge--draft">Not set — not public</span>`}</td>
      <td>${m.sort_order}</td>
      <td class="admin-row-actions">
        <button data-edit="${m.id}">Edit</button>
        <button data-del="${m.id}">Delete</button>
      </td>
    </tr>`).join("");
  tEl("teamTableBody").querySelectorAll("[data-edit]").forEach((b) => b.addEventListener("click", () => openMemberModal(b.dataset.edit)));
  tEl("teamTableBody").querySelectorAll("[data-del]").forEach((b) => b.addEventListener("click", () => deleteMember(b.dataset.del)));
}

// ---------------------------------------------------------------------------
// Editor
// ---------------------------------------------------------------------------

function currentSemesterDefaults() {
  const d = new Date();
  return { term: d.getMonth() + 1 >= 8 ? "fall" : "spring", year: d.getFullYear() };
}

function fillYears(selected) {
  const max = new Date().getFullYear() + 3;
  const years = new Set();
  for (let y = FIRST_YEAR; y <= max; y++) years.add(y);
  if (selected) years.add(selected); // never drop an existing member's year
  tEl("tm_year").innerHTML = [...years].sort((a, b) => a - b).map((y) => `<option value="${y}">${y}</option>`).join("");
  tEl("tm_year").value = String(selected);
}

// Presets + any custom group already used in the chosen semester, then "Other…".
function refreshGroupOptions(preferred) {
  const term = tEl("tm_term").value, year = Number(tEl("tm_year").value);
  const used = team.members.filter((m) => m.term === term && m.year === year && m.group_title).map((m) => m.group_title);
  const groups = [...new Set([...PRESET_GROUPS, ...used, ...(preferred ? [preferred] : [])])];
  const cur = preferred || (tEl("tm_group").value !== OTHER ? tEl("tm_group").value : "");
  tEl("tm_group").innerHTML = groups.map((g) => `<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`).join("") + `<option value="${OTHER}">Other…</option>`;
  tEl("tm_group").value = groups.includes(cur) ? cur : groups[0];
  toggleOtherGroup();
}

function toggleOtherGroup() {
  tEl("tm_group_other").classList.toggle("admin-hidden", tEl("tm_group").value !== OTHER);
}

function chosenGroup() {
  return tEl("tm_group").value === OTHER ? tEl("tm_group_other").value.trim() : tEl("tm_group").value;
}

function updatePlacement() {
  tEl("tmPlacement").textContent = `Appears on the Team page under ${termLabel(tEl("tm_term").value)} ${tEl("tm_year").value} › ${chosenGroup() || "…"}.`;
}

function resetHeadshot(existingKey) {
  if (team.photo.url) URL.revokeObjectURL(team.photo.url);
  team.photo = { blob: null, url: null, existingKey: existingKey || null, removed: false };
  paintHeadshot();
}

function paintHeadshot() {
  const url = team.photo.url || (team.photo.existingKey && !team.photo.removed ? photoUrl(team.photo.existingKey) : "");
  const img = tEl("tm_photo_preview");
  img.src = url;
  img.style.visibility = url ? "visible" : "hidden";
  tEl("tmPhotoRemove").classList.toggle("admin-hidden", !url);
}

function pickHeadshot() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/png,image/jpeg,image/webp";
  input.onchange = () => input.files[0] && openCropper(input.files[0], {
    outW: HEADSHOT_W, outH: HEADSHOT_H,
    title: "Frame the photo",
    hint: "Team photos are shown in a near-square card. Drag to position the face and zoom to fit — what is inside the frame is exactly what visitors see.",
    onApply: (blob) => {
      if (team.photo.url) URL.revokeObjectURL(team.photo.url);
      Object.assign(team.photo, { blob, url: URL.createObjectURL(blob), removed: false });
      paintHeadshot();
    },
  });
  input.click();
}

function openMemberModal(id) {
  team.editingId = id;
  tEl("memberForm").reset();
  tEl("memberFormError").textContent = "";
  const m = id ? team.members.find((x) => x.id === id) : null;
  tEl("memberModalTitle").textContent = m ? "Edit team member" : "New team member";

  const filter = tEl("teamSemFilter").value;
  const fm = /^(Fall|Spring) (\d{4})$/.exec(filter);
  const def = m && m.term && m.year ? { term: m.term, year: m.year } : fm ? { term: fm[1].toLowerCase(), year: Number(fm[2]) } : currentSemesterDefaults();
  tEl("tm_term").value = def.term;
  fillYears(def.year);

  const legacyGroup = m ? m.group_title || (m.section === "exec" ? "Executive Board" : "Committees") : null;
  refreshGroupOptions(legacyGroup);
  if (m) {
    tEl("tm_name").value = m.name; tEl("tm_role").value = m.role;
    tEl("tm_instagram").value = m.instagram ?? ""; tEl("tm_linkedin").value = m.linkedin ?? "";
    tEl("tm_quote").value = m.quote ?? ""; tEl("tm_sort_order").value = m.sort_order;
  } else {
    const peers = team.members.filter((x) => x.term === def.term && x.year === def.year);
    tEl("tm_sort_order").value = peers.length ? Math.max(...peers.map((x) => x.sort_order)) + 1 : 0; // add to the end
  }
  resetHeadshot(m ? m.storage_key : null);
  updatePlacement();
  tEl("memberModalBackdrop").classList.remove("admin-hidden");
}

function closeMemberModal() {
  tEl("memberModalBackdrop").classList.add("admin-hidden");
  resetHeadshot(null);
  team.editingId = null;
}

async function saveMember(e) {
  e.preventDefault();
  const err = tEl("memberFormError");
  err.textContent = "";
  const name = tEl("tm_name").value.trim(), role = tEl("tm_role").value.trim(), group = chosenGroup();
  if (!name) return (err.textContent = "Name is required.");
  if (!role) return (err.textContent = "Role is required.");
  if (!group) return (err.textContent = "Choose a group (or type a name for a new one).");
  for (const f of ["tm_instagram", "tm_linkedin"]) {
    const v = tEl(f).value.trim();
    if (v && !/^https?:\/\//i.test(v)) return (err.textContent = "Social links must be full URLs starting with https://");
  }

  const btn = tEl("memberModalSave");
  btn.disabled = true;
  btn.textContent = "Saving…";
  const id = team.editingId || crypto.randomUUID();
  const existing = team.editingId ? team.members.find((x) => x.id === id) : null;
  const record = {
    name, role,
    term: tEl("tm_term").value,
    year: Number(tEl("tm_year").value),
    group_title: group,
    section: group === "Executive Board" ? "exec" : "committee", // legacy column, kept consistent
    instagram: tEl("tm_instagram").value.trim() || null,
    linkedin: tEl("tm_linkedin").value.trim() || null,
    quote: tEl("tm_quote").value.trim() || null,
    sort_order: parseInt(tEl("tm_sort_order").value, 10) || 0,
  };
  try {
    let oldKey = null;
    if (team.photo.blob) {
      btn.textContent = "Uploading photo…";
      const { storageKey } = await uploadImage("team", id, new File([team.photo.blob], "headshot.jpg", { type: "image/jpeg" }));
      record.storage_key = storageKey;
      oldKey = existing ? existing.storage_key : null;
    } else if (team.photo.removed) {
      record.storage_key = null;
      oldKey = existing ? existing.storage_key : null;
    }
    const { error } = team.editingId
      ? await supabaseClient.from("team_members").update(record).eq("id", id)
      : await supabaseClient.from("team_members").insert({ id, ...record });
    if (error) throw error;
    if (oldKey) deleteImage(oldKey).catch(() => {}); // only after the row no longer points at it
    closeMemberModal();
    await loadTeam();
  } catch (e2) {
    err.textContent = e2.message || String(e2);
  } finally {
    btn.disabled = false;
    btn.textContent = "Save";
  }
}

async function deleteMember(id) {
  const m = team.members.find((x) => x.id === id);
  if (!confirm(`Delete ${m ? m.name : "this member"}? They will be removed from the Team page.`)) return;
  const { error } = await supabaseClient.from("team_members").delete().eq("id", id);
  if (error) return alert(`Failed to delete: ${error.message}`);
  if (m && m.storage_key) deleteImage(m.storage_key).catch(() => {});
  await loadTeam();
}
