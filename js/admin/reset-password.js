// Password-reset landing page (admin/reset-password.html). Extracted from an inline <script>
// so the admin CSP can use script-src 'self' without 'unsafe-inline' - see vercel.json.
const MIN_PASSWORD = 12; // keep in sync with js/admin/account.js
const $ = (id) => document.getElementById(id);

// Supabase puts a failure in the URL hash (e.g. #error_code=otp_expired) when the link is bad.
const hashParams = new URLSearchParams(location.hash.replace(/^#/, ""));
const linkFailed = hashParams.has("error") || hashParams.has("error_code");

let ready = false;
const showBad = (msg) => {
  $("checking").classList.add("admin-hidden");
  $("resetForm").classList.add("admin-hidden");
  if (msg) $("badLinkMsg").textContent = msg;
  $("badLink").classList.remove("admin-hidden");
};

// supabase-js reads the recovery token from the URL and fires PASSWORD_RECOVERY once it is valid.
supabaseClient.auth.onAuthStateChange((event) => {
  if (event === "PASSWORD_RECOVERY") {
    ready = true;
    $("checking").classList.add("admin-hidden");
    $("badLink").classList.add("admin-hidden");
    $("resetForm").classList.remove("admin-hidden");
    $("newPw").focus();
  }
});
if (linkFailed) showBad("This reset link has expired or was already used. Links work once and last one hour.");
else setTimeout(() => { if (!ready) showBad(); }, 5000);

$("resetForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const err = $("resetError"); err.textContent = "";
  const pw = $("newPw").value;
  if (pw.length < MIN_PASSWORD) return (err.textContent = `Use at least ${MIN_PASSWORD} characters.`);
  if (pw !== $("confirmPw").value) return (err.textContent = "The two passwords don't match.");
  const btn = $("saveBtn"); btn.disabled = true; btn.textContent = "Updating…";
  const { error } = await supabaseClient.auth.updateUser({ password: pw });
  if (error) {
    btn.disabled = false; btn.textContent = "Update password";
    err.textContent = /same|different/i.test(error.message) ? "Choose a password you haven't used before." : error.message;
    return;
  }
  await supabaseClient.auth.signOut(); // make them sign in fresh with the new password
  window.location.replace("/admin?reset=1");
});
