import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { listModels, trainAllModels, loadModel } from "../src/model-registry.js";

test("catalog exposes two language-neutral experimental model profiles", () => {
  const models = listModels();
  assert.deepEqual(models.map(model => model.id), ["retzef-general", "retzef-code"]);
  assert.ok(models.every(model => model.architecture === "ngram"));
});

test("all remaining models can be trained, saved, and loaded", async () => {
  const modelsDir = await mkdtemp(path.join(os.tmpdir(), "retzef-models-"));
  try {
    const results = await trainAllModels({ modelsDir });
    assert.equal(results.length, 2);
    assert.ok(results.every(result => result.tokens > 0));

    const model = await loadModel("retzef-general", { modelsDir });
    const output = model.generate("hello", { maxTokens: 8, random: () => 0.5 });
    assert.equal(typeof output, "string");
    assert.ok(output.length > 0);
  } finally {
    await rm(modelsDir, { recursive: true, force: true });
  }
});
