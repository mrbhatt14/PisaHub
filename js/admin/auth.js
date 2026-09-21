// Shared session/role helpers for every admin/*.html page.

async function getSessionAndProfile() {
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();
  if (!session) return { session: null, profile: null };

  const { data: profile, error } = await supabaseClient
    .from("profiles")
    .select("role, display_name")
    .eq("user_id", session.user.id)
    .single();

  if (error) return { session, profile: null };
  return { session, profile };
}

// Call at the top of any protected admin page. Redirects away if the
// session is missing or the role isn't high enough, otherwise resolves
// with { session, profile }.
async function requireAuth(minRole = "maintainer") {
  const { session, profile } = await getSessionAndProfile();

  if (!session || !profile) {
    window.location.href = "/admin/";
    return null;
  }
  if (minRole === "admin" && profile.role !== "admin") {
    window.location.href = "/admin/dashboard.html";
    return null;
  }
  return { session, profile };
}

async function signOut() {
  await supabaseClient.auth.signOut();
  window.location.href = "/admin/";
}
