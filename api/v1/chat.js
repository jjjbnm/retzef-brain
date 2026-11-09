import { verifyApiKey } from "../../brain/key-store.js";
import { generateRetzefResponse } from "../chat.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: { message: "Method not allowed", type: "invalid_request_error" } });
  const match = String(req.headers.authorization || "").match(/^Bearer\s+(.+)$/i);
  if (!match) return res.status(401).json({ error: { message: "Missing Bearer API key", type: "authentication_error" } });
  try {
    const identity = await verifyApiKey(match[1]);
    if (!identity) return res.status(401).json({ error: { message: "Invalid or revoked API key", type: "authentication_error" } });
    let body = req.body;
    if (typeof body === "string") {
      try { body = JSON.parse(body); }
      catch { return res.status(400).json({ error: { message: "Invalid JSON", type: "invalid_request_error" } }); }
    }
    const modelId = identity.model || (typeof body?.model === "string" ? body.model : "retzef-code");
    if (identity.model && typeof body?.model === "string" && body.model !== identity.model) {
      return res.status(400).json({ error: { message: "This API key is assigned to " + identity.model + ".", type: "invalid_request_error" } });
    }
    const messages = Array.isArray(body?.messages) ? body.messages : [];
    const textMessages = messages.filter(m => m && typeof m.content === "string");
    const latestUser = [...textMessages].reverse().find(m => m.role === "user");
    if (!latestUser || !String(latestUser.content).trim()) return res.status(400).json({ error: { message: "messages must contain at least one text user message", type: "invalid_request_error" } });
    const prompt = textMessages.map(m => String(m.role || "user") + ": " + m.content).join("\n").slice(-12000);
    const answer = await generateRetzefResponse({ modelId, prompt });
    return res.status(200).json({
      id: "chatcmpl_" + Date.now().toString(36),
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: modelId,
      choices: [{ index: 0, message: { role: "assistant", content: answer }, finish_reason: "stop" }],
      usage: { prompt_tokens: prompt.length, completion_tokens: String(answer || "").length, total_tokens: prompt.length + String(answer || "").length }
    });
  } catch (error) {
    const message = String(error?.message || "");
    if (message.includes("not configured")) return res.status(503).json({ error: { message: "API key storage is not configured", type: "server_error" } });
    return res.status(400).json({ error: { message: message.slice(0, 200) || "Retzef model request failed", type: "invalid_request_error" } });
  }
}
