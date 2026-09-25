// Users module (admins only). All changes go through /api/users, which re-checks that the
// caller is an admin and enforces the rules (no self-demotion, always at least one admin).

const usr = { users: [], you: null };
const uEl = (id) => document.getElementById(id);

async function usersApi(method, body) {
  const res = await fetch("/api/users", {
    method,
    headers: { "Content-Type": "application/json", ...(await authHeader()) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

async function initUsers() {
  if (currentProfile?.role !== "admin") return; // the tab is hidden for maintainers anyway
  uEl("newUserBtn").addEventListener("click", () => {
    uEl("userForm").reset();
    uEl("userFormError").textContent = "";
    uEl("userModalBackdrop").classList.remove("admin-hidden");
    uEl("usr_name").focus();
  });
  let usernameTouched = false;
  uEl("usr_username").addEventListener("input", () => (usernameTouched = true));
  uEl("usr_name").addEventListener("input", () => {
    if (!usernameTouched) uEl("usr_username").value = uEl("usr_name").value.replace(/[^A-Za-z0-9]+/g, "").slice(0, 30);
  });
  uEl("newUserBtn").addEventListener("click", () => (usernameTouched = false));
  uEl("userCancel").addEventListener("click", () => uEl("userModalBackdrop").classList.add("admin-hidden"));
  uEl("userForm").addEventListener("submit", createUser);
  uEl("credDone").addEventListener("click", () => {
    uEl("credPassword").value = "";
    uEl("credMessage").value = "";
    uEl("credBackdrop").classList.add("admin-hidden");
  });
  const copier = (btn, getText, label) => btn.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(getText()); btn.textContent = "Copied"; }
    catch { btn.textContent = "Select & press Ctrl/Cmd+C"; }
    setTimeout(() => (btn.textContent = label), 2200);
  });
  copier(uEl("credCopyMsg"), () => uEl("credMessage").value, "Copy message");
  copier(uEl("credCopy"), () => uEl("credPassword").value, "Copy password");
  await loadUsers();
}

const fmtDay = (iso) => (iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Never");

async function loadUsers() {
  uEl("usersError").textContent = "";
  try {
    const { users, you } = await usersApi("GET");
    usr.users = users; usr.you = you;
  } catch (err) {
    uEl("usersError").textContent = err.message;
    return;
  }
  uEl("usersTableBody").innerHTML = usr.users.map((u) => {
    const me = u.id === usr.you;
    return `
    <tr>
      <td>${u.name ? escapeHtml(u.name) : '<span class="adm-hint" style="margin:0">No name yet</span>'}${me ? '<span class="adm-you">You</span>' : ""}</td>
      <td>${u.username ? escapeHtml(u.username) : '<span class="adm-hint" style="margin:0">Not set</span>'}</td>
      <td>${escapeHtml(u.email)}</td>
      <td><span class="admin-badge admin-badge--${u.role}">${u.role}</span></td>
      <td>${fmtDay(u.created_at)}</td>
      <td>${fmtDay(u.last_sign_in_at)}</td>
      <td class="admin-row-actions"><button data-name="${u.id}">Edit name</button><button data-uname="${u.id}">${u.username ? "Change username" : "Set username"}</button>${me ? "" : `
        <button data-role="${u.id}" data-to="${u.role === "admin" ? "maintainer" : "admin"}">${u.role === "admin" ? "Make maintainer" : "Make admin"}</button>
        <button data-reset="${u.id}">Reset password</button>
        <button data-remove="${u.id}">Remove</button>`}</td>
    </tr>`;
  }).join("") || `<tr><td colspan="7" class="admin-empty">No users yet.</td></tr>`;

  const byId = (id) => usr.users.find((x) => x.id === id);
  document.querySelectorAll("[data-uname]").forEach((b) => b.addEventListener("click", () => editUsername(byId(b.dataset.uname))));
  document.querySelectorAll("[data-name]").forEach((b) => b.addEventListener("click", () => editName(byId(b.dataset.name))));
  document.querySelectorAll("[data-role]").forEach((b) => b.addEventListener("click", () => changeRole(byId(b.dataset.role), b.dataset.to)));
  document.querySelectorAll("[data-reset]").forEach((b) => b.addEventListener("click", () => resetUserPassword(byId(b.dataset.reset))));
  document.querySelectorAll("[data-remove]").forEach((b) => b.addEventListener("click", () => removeUser(byId(b.dataset.remove))));
}

// The address people actually open. When you're testing on localhost, point them at the real site.
function adminSignInUrl() {
  const local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  return `${local ? "https://pacepisa.org" : location.origin}/admin`;
}

// Builds the message an admin can paste straight into an email / chat.
function buildInviteMessage({ kind, name, username, email, role, password }) {
  const first = (name || "").split(" ")[0] || "there";
  const login = username ? `Username: ${username}\n(or your email: ${email})` : `Email: ${email}`;
  const what = role === "admin"
    ? "As an admin you can edit Live Events, the Gallery and the Team, and manage other users."
    : "As a maintainer you can edit Live Events, the Gallery and the Team.";
  const intro = kind === "reset"
    ? "Your PISA Hub admin password has been reset. Here is your new temporary password."
    : `You've been added to the PISA Hub admin portal as ${role === "admin" ? "an admin" : "a maintainer"}. ${what}`;
  return `Hi ${first},

${intro}

Sign in here: ${adminSignInUrl()}
${login}
Temporary password: ${password}

Next steps:
1. Open the link above and sign in with your ${username ? "username (or email)" : "email"} and the temporary password.
2. Click "Change password" at the top right and choose your own password (at least 10 characters).
3. If you ever forget it, use "Forgot password?" on the sign-in page - a reset link will be emailed to you.

Please don't share the temporary password - it stops mattering as soon as you change it.`;
}

function showCredentials(title, info) {
  uEl("credTitle").textContent = title;
  uEl("credWho").textContent = `${info.name || info.email} · ${info.email}`;
  uEl("credPassword").value = info.password;
  uEl("credMessage").value = buildInviteMessage(info);
  uEl("credBackdrop").classList.remove("admin-hidden");
}

async function createUser(e) {
  e.preventDefault();
  const err = uEl("userFormError"); err.textContent = "";
  const btn = uEl("userSave"); btn.disabled = true; btn.textContent = "Creating…";
  try {
    const r = await usersApi("POST", { action: "create", name: uEl("usr_name").value, username: uEl("usr_username").value, email: uEl("usr_email").value, role: uEl("usr_role").value });
    uEl("userModalBackdrop").classList.add("admin-hidden");
    showCredentials("User created", { kind: "created", name: r.user.name, username: r.user.username, email: r.user.email, role: r.user.role, password: r.tempPassword });
    await loadUsers();
  } catch (ex) {
    err.textContent = ex.message;
  } finally {
    btn.disabled = false; btn.textContent = "Create user";
  }
}

async function editUsername(u) {
  const username = prompt(`Username for ${u.name || u.email} (3-30 characters: letters, numbers, . and _):`, u.username || "");
  if (username === null) return;
  try { await usersApi("POST", { action: "setUsername", id: u.id, username: username.trim() }); await loadUsers(); }
  catch (ex) { uEl("usersError").textContent = ex.message; }
}

async function editName(u) {
  const name = prompt(`Name for ${u.email}:`, u.name || "");
  if (name === null) return; // cancelled
  try { await usersApi("POST", { action: "setName", id: u.id, name }); await loadUsers(); }
  catch (ex) { uEl("usersError").textContent = ex.message; }
}

async function changeRole(u, role) {
  if (!confirm(`Make ${u.email} ${role === "admin" ? "an admin (they will be able to manage users)" : "a maintainer (they will lose access to the Users tab)"}?`)) return;
  try { await usersApi("POST", { action: "setRole", id: u.id, role }); await loadUsers(); }
  catch (ex) { uEl("usersError").textContent = ex.message; }
}

async function resetUserPassword(u) {
  if (!confirm(`Reset the password for ${u.email}? Their current password stops working immediately.`)) return;
  try { const r = await usersApi("POST", { action: "resetPassword", id: u.id }); showCredentials("Password reset", { kind: "reset", name: u.name, username: u.username, email: u.email, role: u.role, password: r.tempPassword }); }
  catch (ex) { uEl("usersError").textContent = ex.message; }
}

async function removeUser(u) {
  if (!confirm(`Remove ${u.email}? They will no longer be able to sign in to the admin portal. This can't be undone.`)) return;
  try { await usersApi("POST", { action: "remove", id: u.id }); await loadUsers(); }
  catch (ex) { uEl("usersError").textContent = ex.message; }
}
