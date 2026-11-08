import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { RetzefNgramModel } from "./model.js";
import { MODEL_CATALOG, getModelDefinition } from "./model-catalog.js";

export function listModels() {
  return MODEL_CATALOG.map(({ id, name, description, order, maxTokens }) => ({
    id, name, description, order, maxTokens,
    architecture: "ngram",
    status: "experimental"
  }));
}

export async function trainAllModels({ dataDir = "data/corpora", modelsDir = "models" } = {}) {
  await mkdir(modelsDir, { recursive: true });
  const results = [];

  for (const definition of MODEL_CATALOG) {
    const corpusPath = path.join(dataDir, definition.corpus);
    const corpus = await readFile(corpusPath, "utf8");
    const model = new RetzefNgramModel({
      order: definition.order,
      maxTokens: definition.maxTokens
    });
    const stats = model.train(corpus);
    const outputPath = path.join(modelsDir, definition.id + ".json");
    await writeFile(outputPath, JSON.stringify(model.toJSON(), null, 2) + "\n", "utf8");
    results.push({ id: definition.id, name: definition.name, outputPath, ...stats });
  }

  return results;
}

export async function loadModel(id, { modelsDir = "models" } = {}) {
  const definition = getModelDefinition(id);
  if (!definition) throw new Error("Unknown Retzef model: " + id);
  const filePath = path.join(modelsDir, id + ".json");
  const data = JSON.parse(await readFile(filePath, "utf8"));
  return RetzefNgramModel.fromJSON(data);
}
