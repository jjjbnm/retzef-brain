import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { RetzefNeuralModel } from "../src/neural-model.js";
import { MODEL_CATALOG } from "../src/model-catalog.js";

const outputDir = "models/neural";
await mkdir(outputDir, { recursive: true });

for (const definition of MODEL_CATALOG) {
  const corpusPath = path.join("data/corpora", definition.corpus);
  const corpus = await readFile(corpusPath, "utf8");
  const model = new RetzefNeuralModel({
    embeddingSize: 8,
    hiddenSize: 12,
    contextSize: 2,
    learningRate: 0.035,
    seed: definition.id.length * 31
  });
  const stats = model.train(corpus, { epochs: 24 });
  const outputPath = path.join(outputDir, definition.id + ".neural.json");
  await writeFile(outputPath, JSON.stringify(model.toJSON()) + "\n", "utf8");
  console.log(
    definition.name + " neural model: " +
    stats.tokens + " tokens, " + stats.vocabulary +
    " vocabulary items, loss " + stats.loss
  );
  console.log("Saved: " + outputPath);
}
