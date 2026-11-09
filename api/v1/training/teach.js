import { verifyApiKey } from "../../../brain/key-store.js";
import { addTrainingExample, listTrainingExamples, saveModelWeights } from "../../../brain/training-store.js";
import { trainNativeModel } from "../../chat.js";

const allowedModels = new Set(["retzef-general", "retzef-code", "retzef-creative"]);

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const match = String(req.headers.authorization || "").match(/^Bearer\s+(.+)$/i);
  if (!match) return res.status(401).json({ error: "Missing Bearer API key." });
  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); }
    catch { return res.status(400).json({ error: "Invalid JSON." }); }
  }
  const input = typeof body?.input === "string" ? body.input.trim() : "";
  const expectedOutput = typeof body?.expected_output === "string"
    ? body.expected_output.trim()
    : typeof body?.expectedOutput === "string" ? body.expectedOutput.trim() : "";
  if (!input || !expectedOutput) return res.status(400).json({ error: "Both input and expected_output are required." });
  if (input.length > 500 || expectedOutput.length > 500) return res.status(400).json({ error: "Each training field is limited to 500 characters." });

  try {
    const identity = await verifyApiKey(match[1]);
    if (!identity) return res.status(401).json({ error: "Invalid or expired API key." });
    const model = identity.model;
    if (!allowedModels.has(model)) return res.status(403).json({ error: "This API key is not assigned to a trainable Retzef model." });
    await addTrainingExample({ keyId: identity.id, ownerId: identity.ownerId, model, input, expectedOutput });
    const examples = await listTrainingExamples(identity.id, model, 8);
    const trained = await trainNativeModel(model, examples);
    const saved = await saveModelWeights({
      keyId: identity.id,
      ownerId: identity.ownerId,
      model,
      weights: trained.weights,
      trainingExamples: examples.length
    });
    return res.status(200).json({
      ok: true,
      model,
      engine: "retzef-native",
      learned: true,
      trainingExamples: examples.length,
      stats: trained.stats,
      updatedAt: saved.updatedAt
    });
  } catch (error) {
    const message = String(error?.message || "");
    if (message.includes("not configured") || message.includes("DATABASE_URL")) {
      return res.status(503).json({ error: "Training database is not configured. Set DATABASE_URL in Vercel." });
    }
    console.error("Retzef training error:", message);
    return res.status(500).json({ error: "Retzef training failed. Check server logs." });
  }
}
