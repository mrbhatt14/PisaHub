// Sign-in page (admin/index.html). Extracted from an inline <script> so the admin CSP can use
// script-src 'self' without 'unsafe-inline' - see vercel.json.
const form = document.getElementById("loginForm");
const errorEl = document.getElementById("loginError");
const btn = document.getElementById("loginBtn");

// ---- forgot password -------------------------------------------------
const loginForm = document.getElementById("loginForm");
const forgotForm = document.getElementById("forgotForm");
const showForgot = (on) => {
  loginForm.classList.toggle("admin-hidden", on);
  forgotForm.classList.toggle("admin-hidden", !on);
  document.querySelector(".admin-card .sub").classList.toggle("admin-hidden", on);
  if (on) document.getElementById("forgotEmail").value = document.getElementById("email").value;
};
document.getElementById("forgotLink").addEventListener("click", (e) => { e.preventDefault(); showForgot(true); });
document.getElementById("backToLogin").addEventListener("click", (e) => { e.preventDefault(); showForgot(false); });
if (location.hash === "#forgot") showForgot(true);
if (new URLSearchParams(location.search).get("reset") === "1") document.getElementById("resetDone").classList.remove("admin-hidden");

forgotForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const errEl = document.getElementById("forgotError"), sentEl = document.getElementById("forgotSent"), btn = document.getElementById("forgotBtn");
  errEl.textContent = ""; sentEl.classList.add("admin-hidden");
  const email = document.getElementById("forgotEmail").value.trim();
  const isEmail = email.includes("@");
  if (isEmail ? !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) : !/^[A-Za-z0-9._]{3,30}$/.test(email)) { errEl.textContent = "Enter your username or a valid email address."; return; }
  btn.disabled = true; btn.textContent = "Sending…";
  let error = null;
  if (isEmail) {
    ({ error } = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/admin/reset-password.html` }));
  } else {
    try {
      const res = await fetch("/api/auth-username", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "forgot", identifier: email }) });
      if (!res.ok) error = { status: res.status, message: (await res.json().catch(() => ({}))).error || "failed" };
    } catch (err) { error = { message: "network" }; }
  }
  if (error && (error.status === 429 || /rate limit|too many/i.test(error.message))) {
    errEl.textContent = "Too many requests right now. Please wait a few minutes and try again.";
    btn.disabled = false; btn.textContent = "Send reset link"; return;
  }
  if (error) {
    errEl.textContent = "We couldn't send the email. Please try again in a few minutes, or ask an Admin to reset your password.";
    btn.disabled = false; btn.textContent = "Send reset link"; return;
  }
  // Same message whether or not the email has an account, so this can't be used to discover who has one.
  sentEl.textContent = `If an account exists for “${email}”, a reset link is on its way to its email address. It can take a minute - check your spam folder. The link works for one hour.`;
  sentEl.classList.remove("admin-hidden");
  let left = 60; // short cooldown so it can't be spammed
  btn.textContent = `Send again in ${left}s`;
  const tick = setInterval(() => {
    left--;
    if (left <= 0) { clearInterval(tick); btn.disabled = false; btn.textContent = "Send reset link"; }
    else btn.textContent = `Send again in ${left}s`;
  }, 1000);
});

// Already signed in? Skip straight to the dashboard.
supabaseClient.auth.getSession().then(({ data: { session } }) => {
  if (session) window.location.href = "/admin/dashboard.html";
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorEl.textContent = "";
  btn.disabled = true;
  btn.textContent = "Signing in…";

  const identifier = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const fail = (msg) => {
    errorEl.textContent = msg;
    btn.disabled = false;
    btn.textContent = "Sign in";
  };

  let data, error;
  if (identifier.includes("@")) {
    ({ data, error } = await supabaseClient.auth.signInWithPassword({ email: identifier, password }));
  } else {
    // A username: the server works out the email (the browser never sees it) and signs in for us.
    try {
      const res = await fetch("/api/auth-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", identifier, password }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return fail(body.error || "Something went wrong. Please try again.");
      ({ data, error } = await supabaseClient.auth.setSession({ access_token: body.access_token, refresh_token: body.refresh_token }));
    } catch (err) {
      return fail("Couldn't reach the server. Check your connection and try again.");
    }
  }
  if (error || !data || !data.user) return fail(error ? error.message : "Sign-in failed. Please try again.");

  // Confirm the account has a maintainer/admin profile row before letting them in.
  const { data: profile } = await supabaseClient
    .from("profiles")
    .select("role")
    .eq("user_id", data.user.id)
    .single();

  if (!profile) {
    errorEl.textContent = "No admin profile found for this account.";
    await supabaseClient.auth.signOut();
    btn.disabled = false;
    btn.textContent = "Sign in";
    return;
  }

  window.location.href = "/admin/dashboard.html";
});
