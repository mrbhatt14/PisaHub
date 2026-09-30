// About Page module (maintainers and admins). One row (id=1) in about_content - see the
// "ABOUT PAGE CONTENT" section of supabase/schema.sql. Field ids below match that table's
// column names 1:1 (ab_<column>), so loading/saving is a plain loop instead of listing every
// field twice. Edits here go live on the public /about page immediately (no approval step,
// same tier as Team and Live Events) and are recorded in the Activity Log by a DB trigger.

const ABOUT_FIELDS = [
  "banner_eyebrow", "banner_heading_1", "banner_heading_2",
  "intro_eyebrow", "intro_heading_1", "intro_heading_2", "intro_lead", "intro_body",
  "values_heading", "values_lead",
  "value_1_title", "value_1_text", "value_2_title", "value_2_text",
  "value_3_title", "value_3_text", "value_4_title", "value_4_text",
  "value_5_title", "value_5_text",
  "beyond_eyebrow", "beyond_heading_1", "beyond_heading_2", "beyond_body",
  "beyond_mantra", "beyond_mantra_translation",
  "cta_eyebrow", "cta_heading",
];

// The 5 value-card fields are identical in shape, so they're generated here instead of
// repeated 5x in dashboard.html.
function buildAboutValueFields() {
  document.getElementById("aboutValuesFields").innerHTML = [1, 2, 3, 4, 5].map((n) => `
    <div class="admin-field"><label for="ab_value_${n}_title">Value ${n} &mdash; title</label><input type="text" id="ab_value_${n}_title" maxlength="40" required /></div>
    <div class="admin-field adm-span-2"><label for="ab_value_${n}_text">Value ${n} &mdash; text</label><textarea id="ab_value_${n}_text" rows="2" required></textarea></div>
  `).join("");
}

async function initAbout() {
  if (!canReview()) return;
  buildAboutValueFields();
  document.getElementById("aboutForm").addEventListener("submit", saveAbout);
  await loadAbout();
}

async function loadAbout() {
  const err = document.getElementById("aboutFormError");
  err.textContent = "";
  const { data, error } = await supabaseClient.from("about_content").select("*").eq("id", 1).maybeSingle();
  if (error || !data) {
    err.textContent = error ? error.message : "Couldn't load the About page content.";
    return;
  }
  ABOUT_FIELDS.forEach((f) => {
    const el = document.getElementById(`ab_${f}`);
    if (el) el.value = data[f] ?? "";
  });
}

async function saveAbout(e) {
  e.preventDefault();
  const err = document.getElementById("aboutFormError");
  err.textContent = "";

  const payload = {};
  for (const f of ABOUT_FIELDS) {
    const el = document.getElementById(`ab_${f}`);
    const v = el.value.trim();
    if (!v) {
      err.textContent = "Every field is required - fill in or restore the empty one.";
      el.focus();
      return;
    }
    payload[f] = v;
  }
  if (!(await admConfirm("Save changes to the About page? This updates the live public site immediately."))) return;

  const btn = document.getElementById("aboutSaveBtn");
  btn.disabled = true;
  btn.textContent = "Saving…";
  const { error } = await supabaseClient.from("about_content").update(payload).eq("id", 1);
  btn.disabled = false;
  if (error) {
    err.textContent = error.message;
    btn.textContent = "Save changes";
    return;
  }
  btn.textContent = "Saved ✓";
  setTimeout(() => (btn.textContent = "Save changes"), 2200);
}
