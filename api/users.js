const { supabaseAdmin, requireRole } = require("./_lib/auth");
const { createUsersService, HttpError } = require("./_lib/users-service");

const service = createUsersService(supabaseAdmin);

// Account management. Admins manage everyone; maintainers may only manage contributors
// (enforced in api/_lib/users-service.js). Contributors have no access at all. Listing is GET; every change is a POST with an
// `action` (create | setName | setUsername | setRole | resetPassword | remove) so it works the same on any host.
module.exports = async function handler(req, res) {
  const actor = await requireRole(req, res, "maintainer");
  if (!actor) return; // 401/403 already sent

  try {
    if (req.method === "GET") {
      res.status(200).json({ users: await service.list(actor), you: actor.id, myRole: actor.role });
      return;
    }
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }
    const body = req.body || {};
    switch (body.action) {
      case "create":
        res.status(201).json(await service.create(actor, body));
        return;
      case "setUsername":
        res.status(200).json(await service.setUsername(actor, body));
        return;
      case "setName":
        res.status(200).json(await service.setName(actor, body));
        return;
      case "setRole":
        res.status(200).json(await service.setRole(actor, body));
        return;
      case "resetPassword":
        res.status(200).json(await service.resetPassword(actor, body));
        return;
      case "remove":
        res.status(200).json(await service.remove(actor, body));
        return;
      default:
        res.status(400).json({ error: "Unknown action." });
    }
  } catch (err) {
    if (err instanceof HttpError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    console.error("users api error:", err);
    res.status(500).json({ error: "Something went wrong on the server." });
  }
};
