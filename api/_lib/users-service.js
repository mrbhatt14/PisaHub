const crypto = require("crypto");

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const ROLES = ["maintainer", "admin"];
const cleanName = (n) => String(n || "").replace(/\s+/g, " ").trim();
function validName(n) {
  const name = cleanName(n);
  if (!name) throw new HttpError(400, "Enter the person's name.");
  if (name.length > 80) throw new HttpError(400, "Name must be 80 characters or fewer.");
  return name;
}
const USERNAME_RE = /^[A-Za-z0-9._]{3,30}$/;
function validUsername(u) {
  const username = String(u || "").trim();
  if (!USERNAME_RE.test(username)) {
    throw new HttpError(400, "Username must be 3-30 characters: letters, numbers, dots and underscores only (no spaces).");
  }
  return username;
}
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// No look-alike characters (0/O, 1/l/I) so a temporary password survives being read out or retyped.
const PASSWORD_ALPHABET = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generatePassword(length = 16) {
  return Array.from({ length }, () => PASSWORD_ALPHABET[crypto.randomInt(PASSWORD_ALPHABET.length)]).join("");
}

// All account rules live here so they can be tested without a real database.
// `db` is a Supabase client with the service-role key.
function createUsersService(db) {
  async function adminCount() {
    const { count, error } = await db.from("profiles").select("user_id", { count: "exact", head: true }).eq("role", "admin");
    if (error) throw error;
    return count ?? 0;
  }

  // Usernames are unique ignoring case ("ShivamBhatt" and "shivambhatt" are the same login).
  async function assertUsernameFree(username, exceptId) {
    const { data, error } = await db.from("profiles").select("user_id").eq("username_key", username.toLowerCase());
    if (error) throw error;
    if (data.some((r) => r.user_id !== exceptId)) throw new HttpError(409, "That username is already taken.");
  }

  async function getProfile(id) {
    const { data, error } = await db.from("profiles").select("user_id, role").eq("user_id", id).maybeSingle();
    if (error) throw error;
    if (!data) throw new HttpError(404, "That user doesn't exist.");
    return data;
  }

  return {
    async list() {
      const { data, error } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (error) throw error;
      const { data: profiles, error: pErr } = await db.from("profiles").select("user_id, role, display_name, username");
      if (pErr) throw pErr;
      const byId = new Map(profiles.map((p) => [p.user_id, p]));
      return data.users
        .filter((u) => byId.has(u.id)) // only people who can use the admin portal
        .map((u) => {
          const p = byId.get(u.id);
          // older accounts stored the email as their display name - show that as "no name yet"
          const name = p.display_name && p.display_name !== u.email ? p.display_name : "";
          return { id: u.id, name, username: p.username || "", email: u.email, role: p.role, created_at: u.created_at, last_sign_in_at: u.last_sign_in_at || null };
        })
        .sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email));
    },

    async create({ name, username, email, role }) {
      name = validName(name);
      username = validUsername(username);
      await assertUsernameFree(username);
      email = String(email || "").trim().toLowerCase();
      if (!EMAIL_RE.test(email)) throw new HttpError(400, "Enter a valid email address.");
      if (!ROLES.includes(role)) throw new HttpError(400, "Role must be maintainer or admin.");
      const password = generatePassword();
      const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: name } });
      if (error) {
        if (/already|registered|exists/i.test(error.message)) throw new HttpError(409, "An account with that email already exists.");
        throw error;
      }
      // The profile row (name + role) is created here; there is deliberately no sign-up trigger doing it.
      const { error: pErr } = await db.from("profiles").upsert({ user_id: data.user.id, display_name: name, username, role });
      if (pErr) {
        await db.auth.admin.deleteUser(data.user.id); // don't leave a half-created account behind
        if (pErr.code === "23505") throw new HttpError(409, "That username is already taken."); // lost a race
        throw pErr;
      }
      return { user: { id: data.user.id, name, username, email, role }, tempPassword: password };
    },

    async setRole(actorId, { id, role }) {
      if (!ROLES.includes(role)) throw new HttpError(400, "Role must be maintainer or admin.");
      if (id === actorId) throw new HttpError(403, "You can't change your own role.");
      const target = await getProfile(id);
      if (target.role === role) return { id, role };
      if (target.role === "admin" && role !== "admin" && (await adminCount()) <= 1) {
        throw new HttpError(409, "There must always be at least one admin.");
      }
      const { error } = await db.from("profiles").update({ role }).eq("user_id", id);
      if (error) throw error;
      return { id, role };
    },

    async setName({ id, name }) {
      name = validName(name);
      await getProfile(id);
      const { error } = await db.from("profiles").update({ display_name: name }).eq("user_id", id);
      if (error) throw error;
      return { id, name };
    },

    async setUsername({ id, username }) {
      username = validUsername(username);
      await getProfile(id);
      await assertUsernameFree(username, id);
      const { error } = await db.from("profiles").update({ username }).eq("user_id", id);
      if (error) {
        if (error.code === "23505") throw new HttpError(409, "That username is already taken.");
        throw error;
      }
      return { id, username };
    },

    async resetPassword({ id }) {
      await getProfile(id);
      const password = generatePassword();
      const { error } = await db.auth.admin.updateUserById(id, { password });
      if (error) throw error;
      return { tempPassword: password };
    },

    async remove(actorId, { id }) {
      if (id === actorId) throw new HttpError(403, "You can't remove your own account.");
      const target = await getProfile(id);
      if (target.role === "admin" && (await adminCount()) <= 1) throw new HttpError(409, "There must always be at least one admin.");
      const { error } = await db.auth.admin.deleteUser(id); // profile row cascades
      if (error) throw error;
      return { id };
    },
  };
}

module.exports = { createUsersService, HttpError, generatePassword, ROLES, USERNAME_RE };
