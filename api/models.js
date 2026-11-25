import { MODEL_CATALOG } from "../src/model-catalog.js";

const domainById = {
  "retzef-general": "General",
  "retzef-code": "Code",
  "retzef-creative": "Creative"
};

const architectureById = {
  "retzef-general": "General",
  "retzef-code": "Programming",
  "retzef-creative": "Creative"
};

const pluginSupport = {
  protocol: "openai-tools",
  available: true,
  nativeToolCalling: false,
  requiresBrainOrchestrator: true
};

function providerConfigured(id) {
  const modelEnv = {
    "retzef-general": "RETZEF_GENERAL_MODEL",
    "retzef-code": "RETZEF_CODE_MODEL",
    "retzef-creative": "RETZEF_CREATIVE_MODEL"
  };
  return Boolean(
    process.env.RETZEF_AI_BASE_URL &&
    process.env.RETZEF_AI_API_KEY &&
    (process.env[modelEnv[id]] || process.env.RETZEF_AI_MODEL)
  );
}

export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const models = MODEL_CATALOG.map((model) => ({
    id: model.id,
    name: model.name,
    architecture: architectureById[model.id] || "General",
    domain: domainById[model.id] || "General",
    description: model.description,
    status: "experimental",
    owner: "Retzef",
    pluginSupport: { ...pluginSupport },
    runtime: providerConfigured(model.id) ? "external-provider-configured" : "native-experimental"
  }));
  return res.status(200).json({
    brand: "Retzef",
    models,
    count: models.length,
    pluginProtocol: "openai-tools",
    pluginProviders: ["github", "vercel", "youtube", "tiktok", "discord"]
  });
}
