const { createClient } = require("@supabase/supabase-js");

const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Verifies the caller's Supabase session from the Authorization header and
// checks they have at least `minRole` ("contributor" = anyone with a profile,
// "maintainer" = maintainer or admin, "admin" = admin only). Returns the user
// (with a `role` property) on success, or writes an error response and returns
// null on failure.
async function requireRole(req, res, minRole = "maintainer") {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) {
    res.status(401).json({ error: "Missing Authorization header" });
    return null;
  }

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData?.user) {
    res.status(401).json({ error: "Invalid session" });
    return null;
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("user_id", userData.user.id)
    .single();

  const allowedRoles = minRole === "admin" ? ["admin"] : minRole === "contributor" ? ["contributor", "maintainer", "admin"] : ["maintainer", "admin"];
  const allowed = allowedRoles.includes(profile?.role);

  if (profileError || !profile || !allowed) {
    res.status(403).json({ error: "Not authorized" });
    return null;
  }

  return { ...userData.user, role: profile.role };
}

module.exports = { supabaseAdmin, requireRole };
