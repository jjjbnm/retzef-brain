export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const key = req.headers["x-openrouter-key"];
  if (typeof key !== "string" || !key.startsWith("sk-or-")) return res.status(401).json({ error: "Connect a valid OpenRouter API key first." });
  const headers = { Authorization: "Bearer " + key };
  const base = "https://openrouter.ai/api/v1";
  try {
    const [textRes, imageRes, videoRes] = await Promise.all([
      fetch(base + "/models?output_modalities=text&sort=most-popular", { headers }),
      fetch(base + "/images/models", { headers }),
      fetch(base + "/videos/models", { headers })
    ]);
    const responses = [textRes, imageRes, videoRes];
    if (responses.some(r => !r.ok)) {
      const failed = responses.find(r => !r.ok);
      return res.status(failed.status === 401 ? 401 : 502).json({ error: "The provider could not load the complete model catalog. Please reconnect or refresh." });
    }
    const [t, i, v] = await Promise.all(responses.map(r => r.json()));
    const cleanText = (t.data || []).map(m => ({
      id: m.id, name: m.name || m.id, description: m.description || "",
      pricing: m.pricing || null, context_length: m.context_length || null,
      architecture: m.architecture || null, top_provider: m.top_provider || null
    }));
    const cleanMedia = arr => (arr || []).map(m => ({
      id: m.id, name: m.name || m.id, description: m.description || "",
      pricing: m.pricing || null, supported_durations: m.supported_durations || [],
      supported_resolutions: m.supported_resolutions || [], supported_parameters: m.supported_parameters || null
    }));
    return res.status(200).json({ models: { text: cleanText, image: cleanMedia(i.data), video: cleanMedia(v.data) }, fetchedAt: new Date().toISOString() });
  } catch { return res.status(502).json({ error: "Model catalog service is temporarily unavailable." }); }
}