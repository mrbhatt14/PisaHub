// "Change password" for whoever is signed in (used to replace the temporary password an admin gave them).
const MIN_PASSWORD = 10;

function initAccount() {
  const $ = (id) => document.getElementById(id);
  $("changePwBtn").addEventListener("click", () => {
    $("pwForm").reset();
    $("pwError").textContent = "";
    $("pwBackdrop").classList.remove("admin-hidden");
    $("pw_new").focus();
  });
  $("pwCancel").addEventListener("click", () => $("pwBackdrop").classList.add("admin-hidden"));
  $("pwForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = $("pwError"); err.textContent = "";
    const pw = $("pw_new").value;
    if (pw.length < MIN_PASSWORD) return (err.textContent = `Use at least ${MIN_PASSWORD} characters.`);
    if (pw !== $("pw_confirm").value) return (err.textContent = "The two passwords don't match.");
    const btn = $("pwSave"); btn.disabled = true; btn.textContent = "Updating…";
    const { error } = await supabaseClient.auth.updateUser({ password: pw });
    btn.disabled = false; btn.textContent = "Update password";
    if (error) return (err.textContent = error.message);
    $("pwBackdrop").classList.add("admin-hidden");
    alert("Password updated.");
  });
}
