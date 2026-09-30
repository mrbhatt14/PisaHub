const crypto = require("crypto");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { requireRole, supabaseAdmin } = require("./_lib/auth");
const { r2Client, ALLOWED_CONTENT_TYPES } = require("./_lib/r2");
const { enforceRateLimit } = require("./_lib/rate-limit");

// Returns a short-lived presigned R2 PUT URL for a maintainer/admin to upload
// an image directly from the browser. The file itself never passes through
// this function — only the signed URL does.
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  if (await enforceRateLimit(req, res)) return;

  const user = await requireRole(req, res, "contributor");
  if (!user) return; // requireRole already wrote the error response

  try {
    const { scope, entityId, contentType } = req.body || {};
    if (user.role === "contributor" && scope !== "event") {
      res.status(403).json({ error: "Contributors can only upload event images." });
      return;
    }
    const ext = ALLOWED_CONTENT_TYPES[contentType];

    if (!["event", "team"].includes(scope) || typeof entityId !== "string" || !/^[A-Za-z0-9-]{1,80}$/.test(entityId) || !ext) {
      res.status(400).json({ error: "Invalid scope, entityId, or contentType" });
      return;
    }

    // Defense-in-depth: mirror the event_photos_contributor_insert RLS policy so a contributor
    // can't get a presigned URL into an event's storage prefix they could never actually attach
    // a photo row to (the DB write would be rejected anyway, but this avoids an orphaned file).
    if (user.role === "contributor" && scope === "event") {
      const { data } = await supabaseAdmin.from("events").select("id").eq("id", entityId)
        .or(`status.eq.published,created_by.eq.${user.id}`).limit(1);
      if (!data?.length) {
        res.status(403).json({ error: "You can only upload to your own events or a published event." });
        return;
      }
    }

    const id = crypto.randomUUID();
    const key = scope === "event" ? `events/${entityId}/${id}.${ext}` : `team/${entityId}/${id}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 300 });
    const publicUrl = `${process.env.R2_PUBLIC_URL.replace(/\/$/, "")}/${key}`;

    res.status(200).json({ uploadUrl, storageKey: key, publicUrl });
  } catch (err) {
    console.error("upload-url error:", err);
    res.status(500).json({ error: "Something went wrong on the server." });
  }
};
