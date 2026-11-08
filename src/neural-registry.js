import { readFile } from "node:fs/promises";
import path from "node:path";
import { RetzefNeuralModel } from "./neural-model.js";
import { MODEL_CATALOG, getModelDefinition } from "./model-catalog.js";

export function listNeuralModels() {
  return MODEL_CATALOG.map(({ id, name, description }) => ({
    id: id + "-neural",
    sourceId: id,
    name: name + " Neural",
    description,
    architecture: "embedding-tanh-softmax",
    status: "experimental"
  }));
}

export async function loadNeuralModel(id, { modelsDir = "models/neural" } = {}) {
  const sourceId = id.endsWith("-neural") ? id.slice(0, -7) : id;
  if (!getModelDefinition(sourceId)) {
    throw new Error("Unknown Retzef neural model: " + id);
  }
  const filePath = path.join(modelsDir, sourceId + ".neural.json");
  const data = JSON.parse(await readFile(filePath, "utf8"));
  return RetzefNeuralModel.fromJSON(data);
}
