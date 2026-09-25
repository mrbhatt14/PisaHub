const { createClient } = require("@supabase/supabase-js");
const { supabaseAdmin } = require("./_lib/auth");
const { HttpError } = require("./_lib/users-service");
const { createUsernameAuth } = require("./_lib/username-auth");

const auth = createUsernameAuth({
  db: supabaseAdmin,
  makeAnon: () => createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } }),
});

// Public endpoint (people call it before they are signed in).
//   POST { action: "login",  identifier, password } -> { access_token, refresh_token }
//   POST { action: "forgot", identifier }           -> { ok: true }   (always, unless rate-limited)
module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const { action, identifier, password } = req.body || {};
  try {
    if (action === "login") {
      res.status(200).json(await auth.login(identifier, password));
      return;
    }
    if (action === "forgot") {
      // Supabase itself only honours redirect URLs on its allow-list, so the origin is safe to pass through.
      const host = req.headers["x-forwarded-host"] || req.headers.host;
      const proto = req.headers["x-forwarded-proto"] || "https";
      res.status(200).json(await auth.forgot(identifier, `${proto}://${host}/admin/reset-password.html`));
      return;
    }
    res.status(400).json({ error: "Unknown action." });
  } catch (err) {
    if (err instanceof HttpError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    console.error("auth-username error:", err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
};
