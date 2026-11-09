const models = [
  {
    id: "retzef-general",
    name: "Retzef General",
    architecture: "General",
    domain: "General",
    description: "עוזר כללי לשאלות, הסברים ושיחה. מתאים את שפת התשובה לשפת המשתמש.",
    status: "experimental",
    owner: "Retzef",
    pluginSupport: { protocol: "openai-tools", available: true, nativeToolCalling: false, requiresBrainOrchestrator: true }
  },
  {
    id: "retzef-code",
    name: "Retzef Code",
    architecture: "Programming",
    domain: "Code",
    description: "עוזר לפיתוח תוכנה, כתיבת קוד, איתור תקלות והסברים טכניים.",
    status: "experimental",
    owner: "Retzef",
    pluginSupport: { protocol: "openai-tools", available: true, nativeToolCalling: false, requiresBrainOrchestrator: true }
  },
  {
    id: "retzef-creative",
    name: "Retzef Creative",
    architecture: "Creative",
    domain: "Creative",
    description: "עוזר לרעיונות, כתיבה יצירתית, תכנון ותוכן מקורי.",
    status: "experimental",
    owner: "Retzef",
    pluginSupport: { protocol: "openai-tools", available: true, nativeToolCalling: false, requiresBrainOrchestrator: true }
  }
];

export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  return res.status(200).json({
    brand: "Retzef",
    models,
    count: models.length,
    pluginProtocol: "openai-tools",
    pluginProviders: ["github", "vercel", "youtube", "tiktok", "discord"]
  });
}
