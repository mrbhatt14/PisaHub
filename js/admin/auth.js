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
    window.location.replace("/admin");
    return null;
  }
  if (minRole === "admin" && profile.role !== "admin") {
    window.location.replace("/admin/dashboard.html");
    return null;
  }
  guardSignedOut();
  return { session, profile };
}

// Whatever ends the session - Sign out here, Sign out in another tab, an expired
// token, or Back/Forward restoring a cached copy of this page - lands on sign-in.
let signedOutGuardInstalled = false;
function guardSignedOut() {
  if (signedOutGuardInstalled) return;
  signedOutGuardInstalled = true;
  supabaseClient.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") window.location.replace("/admin");
  });
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) window.location.reload(); // bfcache copy: re-run the auth check
  });
}

async function signOut() {
  try {
    await supabaseClient.auth.signOut();
  } catch (err) {
    // Network failure: still drop the local session below so the user is signed out here.
  }
  // replace() (not href) so the Back button can't return to the dashboard.
  window.location.replace("/admin");
}
