// Activity Log module (maintainers and admins). Read-only: every row is written automatically
// by database triggers on events/event_photos/team_members, plus explicit calls from
// api/_lib/users-service.js for account management - see the "ACTIVITY LOG" section of
// supabase/schema.sql. Nothing here can write to the log; only has_role('maintainer') can even
// read it (RLS), so a contributor can't see it and can't be shown here at all.

const PAGE_SIZE = 40;
const log = { offset: 0, type: "all", done: false };
const lEl = (id) => document.getElementById(id);

async function initActivityLog() {
  if (!canReview()) return; // the tab is hidden for contributors anyway; this guards initialisation too
  lEl("logTypeFilter").addEventListener("change", () => {
    log.type = lEl("logTypeFilter").value;
    loadActivityLog(true);
  });
  lEl("logLoadMore").addEventListener("click", () => loadActivityLog(false));
}

const fmtLogTime = (iso) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

function entityBadge(type) {
  const map = { event: ["Event", "event"], event_photo: ["Photo", "photo"], team_member: ["Team", "team"], about_content: ["About page", "about"], user: ["User", "user"] };
  const [label, kind] = map[type] || [type, ""];
  return `<span class="adm-log-tag adm-log-tag--${kind}">${escapeHtml(label)}</span>`;
}

async function loadActivityLog(reset) {
  if (!canReview()) return;
  if (reset) {
    log.offset = 0;
    log.done = false;
    lEl("logList").innerHTML = "";
    lEl("logEmpty").classList.add("admin-hidden");
  }
  if (log.done) return;
  lEl("logError").textContent = "";
  lEl("logLoadMore").disabled = true;
  lEl("logLoadMore").textContent = "Loading…";

  let query = supabaseClient.from("activity_log").select("*").order("created_at", { ascending: false }).range(log.offset, log.offset + PAGE_SIZE - 1);
  if (log.type !== "all") query = query.eq("entity_type", log.type);
  const { data, error } = await query;

  lEl("logLoadMore").disabled = false;
  lEl("logLoadMore").textContent = "Load more";
  if (error) {
    lEl("logError").textContent = error.message;
    return;
  }

  if (log.offset === 0 && !data.length) {
    lEl("logEmpty").classList.remove("admin-hidden");
    lEl("logLoadMore").classList.add("admin-hidden");
    return;
  }

  const html = data.map((e) => `
    <article class="adm-log-row">
      <div class="adm-log-row__meta">
        ${entityBadge(e.entity_type)}
        <strong>${escapeHtml(e.actor_name)}</strong>
        <span class="admin-badge admin-badge--${e.actor_role}">${roleLabel(e.actor_role)}</span>
        <span class="adm-log-row__time">${fmtLogTime(e.created_at)}</span>
      </div>
      <p class="adm-log-row__summary">${escapeHtml(e.summary)}</p>
    </article>`).join("");
  lEl("logList").insertAdjacentHTML("beforeend", html);

  log.offset += data.length;
  log.done = data.length < PAGE_SIZE;
  lEl("logLoadMore").classList.toggle("admin-hidden", log.done);
}
