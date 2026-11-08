import test from "node:test";
import assert from "node:assert/strict";
import { TinyLanguageModel } from "../brain/tiny-model.js";
import { tokenize, detokenize } from "../brain/tokenizer.js";

test("tokenizer reads Hebrew words and punctuation", () => {
  assert.deepEqual(tokenize("שלום עולם!"), ["שלום", "עולם", "!"]);
  assert.equal(detokenize(["שלום", "עולם", "!"]), "שלום עולם!");
});

test("model trains and generates a deterministic continuation", () => {
  const model = new TinyLanguageModel().train(["שלום עולם", "שלום חבר"]);
  assert.equal(model.generate("שלום", { maxTokens: 1, seed: 1 }), "שלום עולם");
});

test("model can be saved and restored as JSON data", () => {
  const model = new TinyLanguageModel().train(["רטזף בריין"]);
  const restored = TinyLanguageModel.fromJSON(model.toJSON());
  assert.equal(restored.vocabulary.size, 2);
});

test("model rejects invalid training data", () => {
  assert.throws(() => new TinyLanguageModel().train([]), /non-empty/);
});
