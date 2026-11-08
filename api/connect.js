export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const key = req.headers["x-openrouter-key"];
  if (typeof key !== "string" || !key.startsWith("sk-or-")) return res.status(400).json({ error: "A valid OpenRouter API key is required." });
  try {
    const response = await fetch("https://openrouter.ai/api/v1/key", { headers: { Authorization: "Bearer " + key } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return res.status(response.status === 401 ? 401 : 502).json({ error: response.status === 401 ? "The API key was rejected. Check it and try again." : "The provider could not verify the key." });
    return res.status(200).json({ ok: true, provider: "OpenRouter", label: data?.data?.label || "Connected", limitRemaining: data?.data?.limit_remaining ?? null });
  } catch { return res.status(502).json({ error: "Could not reach OpenRouter. Please try again." }); }
}