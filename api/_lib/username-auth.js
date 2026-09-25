const { HttpError, USERNAME_RE } = require("./users-service");

const GENERIC_LOGIN_ERROR = "Invalid login credentials";
// Never used by a real account (.invalid is a reserved TLD). Signing in with it costs the same as a
// real attempt, so an unknown username can't be told apart from a wrong password by timing or wording.
const DUMMY_EMAIL = "no-such-user@pisahub.invalid";

// Lets people sign in / reset a password with a username instead of an email.
// Supabase only understands emails, so the username is resolved to an email HERE, on the
// server - the browser never learns which email belongs to a username.
//   db       - Supabase client with the service-role key
//   makeAnon - returns a fresh anon-key Supabase client (no persisted session)
function createUsernameAuth({ db, makeAnon }) {
  async function emailFor(identifier) {
    const id = String(identifier || "").trim();
    if (!id) return null;
    if (id.includes("@")) return id.toLowerCase();
    if (!USERNAME_RE.test(id)) return null;
    const { data, error } = await db.from("profiles").select("user_id").eq("username_key", id.toLowerCase()).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const { data: found, error: uErr } = await db.auth.admin.getUserById(data.user_id);
    if (uErr) throw uErr;
    return found?.user?.email || null;
  }

  return {
    async login(identifier, password) {
      if (!identifier || typeof password !== "string" || !password || password.length > 200) {
        throw new HttpError(400, "Enter your username and password.");
      }
      const email = await emailFor(identifier);
      const { data, error } = await makeAnon().auth.signInWithPassword({ email: email || DUMMY_EMAIL, password });
      if (error && error.status === 429) throw new HttpError(429, "Too many attempts. Please wait a few minutes and try again.");
      if (error || !data || !data.session || !email) throw new HttpError(401, GENERIC_LOGIN_ERROR);
      return { access_token: data.session.access_token, refresh_token: data.session.refresh_token };
    },

    // Always resolves the same way whether or not the username exists.
    async forgot(identifier, redirectTo) {
      const email = await emailFor(identifier);
      if (email) {
        const { error } = await makeAnon().auth.resetPasswordForEmail(email, { redirectTo });
        if (error && error.status === 429) throw new HttpError(429, "Too many requests right now. Please wait a few minutes and try again.");
        // any other failure is swallowed on purpose (same response as an unknown username)
      }
      return { ok: true };
    },
  };
}

module.exports = { createUsernameAuth, GENERIC_LOGIN_ERROR };
