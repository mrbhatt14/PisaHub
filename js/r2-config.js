// Public value — safe to expose in browser code (just a CDN base URL, not a credential).
const R2_PUBLIC_URL = "https://pub-13b930ac6afa421991be373af820bf01.r2.dev";

function photoUrl(storageKey) {
  return `${R2_PUBLIC_URL}/${storageKey}`;
}
