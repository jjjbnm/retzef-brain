import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { RetzefSubwordNeuralModel } from "../src/subword-neural-model.js";
import { MODEL_CATALOG } from "../src/model-catalog.js";

const outputDir = "models/subword";
await mkdir(outputDir, { recursive: true });
for (const definition of MODEL_CATALOG) {
  const corpus = await readFile(path.join("data/corpora", definition.corpus), "utf8");
  const model = new RetzefSubwordNeuralModel({ embeddingSize: 12, hiddenSize: 24, contextSize: 8, seed: definition.id.length * 37 });
  const stats = model.train(corpus, { epochs: 16 });
  const output = path.join(outputDir, definition.id + ".subword.json");
  await writeFile(output, JSON.stringify(model.toJSON()) + "\n", "utf8");
  console.log(definition.name + " Subword: " + stats.tokens + " graphemes, " + stats.vocabulary + " vocabulary items, loss " + stats.loss);
  console.log("Saved: " + output);
}
