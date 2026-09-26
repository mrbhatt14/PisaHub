const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { requireRole, supabaseAdmin } = require("./_lib/auth");
const { r2Client } = require("./_lib/r2");

// Deletes an image from R2 by storage key. Called after the corresponding
// event_photos row (or team_members.storage_key) is cleared in Supabase, so
// storage doesn't accumulate orphaned files as maintainers swap photos out.
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const user = await requireRole(req, res, "contributor");
  if (!user) return;

  const { key } = req.body || {};
  if (!key || typeof key !== "string" || !/^(events|team)\//.test(key)) {
    res.status(400).json({ error: "Invalid key" });
    return;
  }

  // A contributor may only delete the files of THEIR OWN photos that are still awaiting approval.
  // (The client calls this before deleting the row, while the row still proves ownership.)
  if (user.role === "contributor") {
    if (!/^events\/[A-Za-z0-9._-]+\/[0-9a-f-]{36}\.(jpg|png|webp)$/.test(key)) {
      res.status(403).json({ error: "Not allowed." });
      return;
    }
    const { data } = await supabaseAdmin
      .from("event_photos")
      .select("id")
      .eq("created_by", user.id)
      .eq("approved", false)
      .or(`storage_key.eq.${key},thumb_key.eq.${key}`)
      .limit(1);
    if (!data || !data.length) {
      res.status(403).json({ error: "You can only delete your own photos that are waiting for review." });
      return;
    }
  }

  await r2Client.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key }));
  res.status(200).json({ ok: true });
};
