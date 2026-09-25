// Shared image upload/delete helpers, used by both the events photo grid and
// the team member headshot field. Talks to the /api serverless functions,
// which hold the R2 credentials — this file never sees a secret key.

async function authHeader() {
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();
  return { Authorization: `Bearer ${session.access_token}` };
}

// Uploads `file` to R2 under `scope` ("event" | "team") + `entityId`, and
// returns { storageKey, publicUrl }.
async function uploadImage(scope, entityId, file) {
  const res = await fetch("/api/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeader()) },
    body: JSON.stringify({ scope, entityId, contentType: file.type }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to get upload URL (${res.status})`);
  }
  const { uploadUrl, storageKey, publicUrl } = await res.json();

  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!putRes.ok) throw new Error(`Upload to storage failed (${putRes.status})`);

  return { storageKey, publicUrl };
}

async function deleteImage(storageKey) {
  const res = await fetch("/api/delete-object", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeader()) },
    body: JSON.stringify({ key: storageKey }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to delete image (${res.status})`);
  }
}
