const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { requireRole } = require("./_lib/auth");
const { r2Client } = require("./_lib/r2");

// Deletes an image from R2 by storage key. Called after the corresponding
// event_photos row (or team_members.storage_key) is cleared in Supabase, so
// storage doesn't accumulate orphaned files as maintainers swap photos out.
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const user = await requireRole(req, res, "maintainer");
  if (!user) return;

  const { key } = req.body || {};
  if (!key || typeof key !== "string" || !/^(events|team)\//.test(key)) {
    res.status(400).json({ error: "Invalid key" });
    return;
  }

  await r2Client.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key }));
  res.status(200).json({ ok: true });
};
