import { verifyApiKey } from "../../../brain/key-store.js";
import { getTrainingStatus } from "../../../brain/training-store.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const match = String(req.headers.authorization || "").match(/^Bearer\s+(.+)$/i);
  if (!match) return res.status(401).json({ error: "Missing Bearer API key." });
  try {
    const identity = await verifyApiKey(match[1]);
    if (!identity) return res.status(401).json({ error: "Invalid or expired API key." });
    const status = await getTrainingStatus(identity.id, identity.model);
    return res.status(200).json({ ok: true, model: identity.model, engine: "retzef-native", ...status });
  } catch (error) {
    const message = String(error?.message || "");
    if (message.includes("not configured") || message.includes("DATABASE_URL")) {
      return res.status(503).json({ error: "Training database is not configured." });
    }
    return res.status(500).json({ error: "Could not read training status." });
  }
}
