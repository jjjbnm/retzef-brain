import { createApiKey, listApiKeys, revokeApiKey, validOwnerId } from "../brain/key-store.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (!["GET", "POST", "DELETE"].includes(req.method)) {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); }
    catch { return res.status(400).json({ error: "Invalid JSON" }); }
  }
  const ownerId = req.method === "GET" ? req.query?.ownerId : body?.ownerId;
  if (!validOwnerId(ownerId)) {
    return res.status(400).json({ error: "A valid browser owner ID is required." });
  }

  try {
    if (req.method === "GET") {
      return res.status(200).json({ ok: true, keys: await listApiKeys(ownerId) });
    }
    if (req.method === "POST") {
      const name = typeof body?.name === "string" ? body.name.trim().slice(0, 40) : "My Retzef App";
      if (!name) return res.status(400).json({ error: "Key name is required." });
      const model = typeof body?.model === "string" && /^retzef-[a-z0-9-]{1,80}$/.test(body.model)
        ? body.model : "retzef-code";
      const result = await createApiKey(ownerId, name, model);
      return res.status(201).json({
        ok: true,
        ...result,
        warning: "Copy this API key now. Its full value is never stored or shown again."
      });
    }
    if (typeof body?.id !== "string") {
      return res.status(400).json({ error: "Key ID is required." });
    }
    const revoked = await revokeApiKey(ownerId, body.id);
    return revoked
      ? res.status(200).json({ ok: true, revoked: true })
      : res.status(404).json({ error: "API key not found." });
  } catch (error) {
    const message = String(error?.message || "");
    if (message.includes("not configured")) {
      return res.status(503).json({ error: "API key storage is not configured yet. Set DATABASE_URL in Vercel." });
    }
    console.error("API key service error:", message);
    return res.status(500).json({ error: "API key service failed. Check the server configuration." });
  }
}
