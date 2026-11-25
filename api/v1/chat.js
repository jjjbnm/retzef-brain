import { verifyApiKey } from "../../brain/key-store.js";
import { listTrainingExamples } from "../../brain/training-store.js";
import { generateRetzefResponse } from "../chat.js";
import { isSupportedModel } from "../../src/model-catalog.js";

const MAX_MESSAGES = 40;
const MAX_MESSAGE_CHARS = 8000;
const MAX_TOTAL_CHARS = 32000;
const ALLOWED_ROLES = new Set(["system", "developer", "user", "assistant"]);

function readJsonBody(body) {
  if (typeof body !== "string") return body;
  try { return JSON.parse(body); }
  catch { return null; }
}

function normalizeMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) return null;
  const normalized = [];
  let total = 0;
  for (const message of messages) {
    if (!message || !ALLOWED_ROLES.has(String(message.role || "").toLowerCase()) || typeof message.content !== "string") return null;
    const content = message.content.replace(/\u0000/g, "").trim();
    if (!content || content.length > MAX_MESSAGE_CHARS) return null;
    total += content.length;
    if (total > MAX_TOTAL_CHARS) return null;
    normalized.push({ role: String(message.role).toLowerCase(), content });
  }
  return normalized;
}

function setCorsHeaders(res, req) {
  const configuredOrigin = String(process.env.RETZEF_CORS_ORIGIN || "").trim();
  const requestOrigin = String(req.headers.origin || "").trim();
  if (configuredOrigin && (!requestOrigin || requestOrigin === configuredOrigin)) {
    res.setHeader("Access-Control-Allow-Origin", configuredOrigin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  setCorsHeaders(res, req);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: { message: "Method not allowed", type: "invalid_request_error" } });
  const match = String(req.headers.authorization || "").match(/^Bearer\s+(.+)$/i);
  if (!match) return res.status(401).json({ error: { message: "Missing Bearer API key", type: "authentication_error" } });
  try {
    const identity = await verifyApiKey(match[1]);
    if (!identity) return res.status(401).json({ error: { message: "Invalid or revoked API key", type: "authentication_error" } });
    const body = readJsonBody(req.body);
    if (!body || typeof body !== "object") return res.status(400).json({ error: { message: "Invalid JSON", type: "invalid_request_error" } });
    const modelId = identity.model || (typeof body.model === "string" ? body.model : "retzef-code");
    if (!isSupportedModel(modelId)) {
      return res.status(403).json({ error: { message: "This API key is assigned to an unsupported Retzef model.", type: "invalid_request_error" } });
    }
    if (typeof body.model === "string" && body.model !== modelId) {
      return res.status(400).json({ error: { message: "This API key is assigned to " + modelId + ".", type: "invalid_request_error" } });
    }
    const messages = normalizeMessages(body.messages);
    if (!messages) {
      return res.status(400).json({ error: {
        message: `messages must contain 1-${MAX_MESSAGES} messages with supported roles and text content (max ${MAX_MESSAGE_CHARS} characters each and ${MAX_TOTAL_CHARS} total).`,
        type: "invalid_request_error"
      } });
    }
    const latestUser = [...messages].reverse().find((message) => message.role === "user");
    if (!latestUser) return res.status(400).json({ error: { message: "messages must contain at least one text user message", type: "invalid_request_error" } });
    const prompt = messages.map((message) => `${message.role}: ${message.content}`).join("\n");
    const trainingExamples = await listTrainingExamples(identity.id, modelId, 8);
    const answer = await generateRetzefResponse({ modelId, prompt, messages, trainingExamples });
    const completionChars = String(answer || "").length;
    const promptChars = prompt.length;
    return res.status(200).json({
      id: "chatcmpl_" + Date.now().toString(36),
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: modelId,
      choices: [{ index: 0, message: { role: "assistant", content: answer }, finish_reason: "stop" }],
      usage: {
        prompt_tokens: Math.ceil(promptChars / 4),
        completion_tokens: Math.ceil(completionChars / 4),
        total_tokens: Math.ceil((promptChars + completionChars) / 4)
      }
    });
  } catch (error) {
    const message = String(error?.message || "");
    if (message.includes("not configured") || message.includes("DATABASE_URL")) return res.status(503).json({ error: { message: "Training or API key storage is not configured", type: "server_error" } });
    console.error("Retzef API request failed:", message.slice(0, 220));
    return res.status(error?.status === 429 ? 429 : 500).json({ error: { message: "Retzef model request failed", type: "server_error" } });
  }
}
