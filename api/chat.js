export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const key = req.headers["x-openrouter-key"];
  if (typeof key !== "string" || !key.startsWith("sk-or-")) return res.status(401).json({ error: "Connect your OpenRouter API key first." });
  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { return res.status(400).json({ error: "Invalid JSON body." }); } }
  const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
  const models = Array.isArray(body?.models) ? body.models.filter(x => typeof x === "string" && /^[a-zA-Z0-9._/-]{3,180}$/.test(x)).slice(0, 10) : [];
  if (!prompt || prompt.length > 8000 || !models.length) return res.status(400).json({ error: "A prompt (up to 8,000 characters) and at least one text model are required." });
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: "Bearer " + key, "Content-Type": "application/json", "X-OpenRouter-Title": "Retzef Brain" },
      body: JSON.stringify({ models, messages: [{ role: "user", content: prompt }], max_tokens: 1200 })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data?.error?.message || "The model request failed.";
      return res.status(response.status >= 400 && response.status < 500 ? response.status : 502).json({ error: String(message).slice(0, 300) });
    }
    const text = data?.choices?.[0]?.message?.content;
    return res.status(200).json({ text: typeof text === "string" ? text : JSON.stringify(text || ""), model: data?.model || null, usage: data?.usage || null });
  } catch { return res.status(502).json({ error: "Could not reach the model provider. Please try again." }); }
}