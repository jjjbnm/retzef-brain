import test from "node:test";
import assert from "node:assert/strict";
import { RetzefNeuralModel } from "../src/neural-model.js";

test("neural model learns a small next-token task and generates text", () => {
  const model = new RetzefNeuralModel({
    embeddingSize: 4,
    hiddenSize: 6,
    contextSize: 2,
    seed: 9
  });
  const stats = model.train("שלום עולם שלום עולם שלום עולם", { epochs: 8 });
  assert.ok(stats.tokens >= 6);
  assert.ok(stats.vocabulary >= 5);
  assert.ok(Number.isFinite(stats.loss));

  const output = model.generate("שלום", {
    maxTokens: 5,
    random: () => 0.5
  });
  assert.equal(typeof output, "string");
  assert.ok(output.startsWith("שלום"));
});

test("neural model can be saved and loaded", () => {
  const model = new RetzefNeuralModel({ embeddingSize: 3, hiddenSize: 4, contextSize: 2 });
  model.train("hello world hello there hello world", { epochs: 2 });
  const restored = RetzefNeuralModel.fromJSON(model.toJSON());
  assert.equal(restored.trainedTokens, model.trainedTokens);
  assert.equal(restored.vocabulary.length, model.vocabulary.length);
  assert.equal(typeof restored.generate("hello", { maxTokens: 3, random: () => 0.4 }), "string");
});

test("rejects invalid training parameters", () => {
  const model = new RetzefNeuralModel();
  assert.throws(() => model.train("one two three", { epochs: 0 }), /epochs/);
  assert.throws(() => model.train("one", { epochs: 2 }), /at least three/);
});
