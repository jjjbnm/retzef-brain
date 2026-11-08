import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { RetzefNeuralModel } from "../src/neural-model.js";
import { listNeuralModels, loadNeuralModel } from "../src/neural-registry.js";

test("neural registry lists three selectable models", () => {
  const models = listNeuralModels();
  assert.deepEqual(models.map((model) => model.id), [
    "retzef-hebrew-neural",
    "retzef-general-neural",
    "retzef-code-neural"
  ]);
});

test("neural registry loads a trained model file", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "retzef-neural-"));
  const modelsDir = path.join(root, "models");
  try {
    await mkdir(modelsDir, { recursive: true });
    const model = new RetzefNeuralModel({ embeddingSize: 3, hiddenSize: 4, contextSize: 2 });
    model.train("hello world hello world", { epochs: 2 });
    await writeFile(
      path.join(modelsDir, "retzef-hebrew.neural.json"),
      JSON.stringify(model.toJSON())
    );
    const loaded = await loadNeuralModel("retzef-hebrew", { modelsDir });
    assert.equal(loaded.trainedTokens, model.trainedTokens);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
