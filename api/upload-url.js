const crypto = require("crypto");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { requireRole } = require("./_lib/auth");
const { r2Client, ALLOWED_CONTENT_TYPES } = require("./_lib/r2");

// Returns a short-lived presigned R2 PUT URL for a maintainer/admin to upload
// an image directly from the browser. The file itself never passes through
// this function — only the signed URL does.
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const user = await requireRole(req, res, "maintainer");
  if (!user) return; // requireRole already wrote the error response

  const { scope, entityId, contentType } = req.body || {};
  const ext = ALLOWED_CONTENT_TYPES[contentType];

  if (!["event", "team"].includes(scope) || !entityId || !ext) {
    res.status(400).json({ error: "Invalid scope, entityId, or contentType" });
    return;
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
};
