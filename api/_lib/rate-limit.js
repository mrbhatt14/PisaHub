const { checkRateLimit } = require("@vercel/firewall");

// Shared throttle for every sensitive /api endpoint (login, forgot-password, account
// management, R2 upload/delete). One rule covers all four - see README.md for the one-time
// Vercel dashboard step this depends on (Firewall -> New Rule -> Rate Limit ID "api"). The
// Hobby plan allows exactly 1 rate-limit rule per project, so everything shares this one ID
// rather than getting its own; the default key is the caller's IP, so it's one shared budget
// per visitor across all four routes, not per-route.
//
// Fails OPEN (never blocks a request) if: running locally (no Vercel firewall to call), the
// dashboard rule hasn't been created yet, or the firewall call itself errors - so a bug or
// missing setup here can never take the site down, only leave it unthrottled.
async function rateLimited(req) {
  try {
    const { rateLimited } = await checkRateLimit("api", { headers: req.headers });
    return rateLimited;
  } catch (err) {
    console.error("rate-limit check failed (failing open):", err);
    return false;
  }
}

// Call at the very top of a handler, before any other work. Returns true if the request was
// rejected (already responded to) - the caller should `return` immediately in that case.
async function enforceRateLimit(req, res) {
  if (await rateLimited(req)) {
    res.status(429).json({ error: "Too many requests. Please wait a moment and try again." });
    return true;
  }
  return false;
}

module.exports = { enforceRateLimit };
