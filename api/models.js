import { MODEL_CATALOG } from "../src/model-catalog.js";
import { getProviderConfig } from "../brain/provider-adapter.js";

const domainById = {
  "retzef-general": "General",
  "retzef-code": "Code",
  "retzef-creative": "Creative",
  "retzef-mini": "Mini"
};

const architectureById = {
  "retzef-general": "General",
  "retzef-code": "Programming",
  "retzef-creative": "Creative",
  "retzef-mini": "General"
};

const pluginSupport = {
  protocol: "openai-tools",
  available: true,
  nativeToolCalling: false,
  requiresBrainOrchestrator: true
};

function providerRuntime(id) {
  const config = getProviderConfig(id);
  if (!config) return { runtime: "native-experimental", providerModel: null, inferenceStatus: "experimental" };
  return {
    runtime: config.provider === "vercel-ai-gateway" ? "vercel-ai-gateway" : "external-provider-configured",
    providerModel: config.model,
    inferenceStatus: "active"
  };
}

export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const models = MODEL_CATALOG.map((model) => {
    const provider = providerRuntime(model.id);
    return ({
    ...provider,
    id: model.id,
    name: model.name,
    version: model.version,
    architecture: architectureById[model.id] || "General",
    domain: domainById[model.id] || "General",
    description: model.description,
    status: provider.inferenceStatus,
    owner: "Retzef",
    pluginSupport: { ...pluginSupport },
    runtime: provider.runtime
  });
  });
  return res.status(200).json({
    brand: "Retzef",
    models,
    count: models.length,
    pluginProtocol: "openai-tools",
    pluginProviders: ["github", "vercel", "youtube", "tiktok", "discord"]
  });
}
