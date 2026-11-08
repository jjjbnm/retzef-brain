import test from "node:test";
import assert from "node:assert/strict";
import { tokenizeSubwords, detokenizeSubwords } from "../src/subword-tokenizer.js";
import { RetzefSubwordNeuralModel } from "../src/subword-neural-model.js";

test("subword tokenizer preserves Hebrew graphemes, spaces and punctuation", () => {
  const tokens = tokenizeSubwords("שלום עולם!");
  assert.equal(detokenizeSubwords(tokens), "שלום עולם!");
  assert.ok(tokens.length > 3);
});

test("subword neural model trains, generates and reloads", () => {
  const model = new RetzefSubwordNeuralModel({ embeddingSize: 4, hiddenSize: 6, contextSize: 3, seed: 4 });
  const stats = model.train("שלום עולם שלום עולם שלום עולם", { epochs: 3 });
  assert.ok(stats.vocabulary > 3);
  assert.ok(Number.isFinite(stats.loss));
  assert.equal(typeof model.generate("שלום", { maxTokens: 4, random: () => 0.5 }), "string");
  const restored = RetzefSubwordNeuralModel.fromJSON(model.toJSON());
  assert.equal(restored.trainedTokens, model.trainedTokens);
  assert.equal(typeof restored.generate("של", { maxTokens: 3, random: () => 0.5 }), "string");
});

test("subword model rejects invalid epoch counts and incompatible files", () => {
  const model = new RetzefSubwordNeuralModel();
  assert.throws(() => model.train("שלום עולם", { epochs: 0 }), /epochs/);
  assert.throws(() => RetzefSubwordNeuralModel.fromJSON({ format: "wrong" }), /Unsupported/);
});
