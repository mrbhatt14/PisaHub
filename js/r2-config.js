// Public value — safe to expose in browser code (just a CDN base URL, not a credential).
const R2_PUBLIC_URL = "https://pub-13b930ac6afa421991be373af820bf01.r2.dev";

// The key comes from the database, so encode each path segment: quotes, angle brackets and spaces
// can never survive into an HTML attribute or change where the URL points.
function photoUrl(storageKey) {
  const safe = String(storageKey ?? "").split("/").map((seg) => encodeURIComponent(seg).replace(/'/g, "%27")).join("/");
  return `${R2_PUBLIC_URL}/${safe}`;
}
