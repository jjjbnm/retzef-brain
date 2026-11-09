import test from "node:test";
import assert from "node:assert/strict";
import { tokenizeSubwords, detokenizeSubwords } from "../src/subword-tokenizer.js";
import { RetzefSubwordNeuralModel } from "../src/subword-neural-model.js";
import { detectLanguageCode, buildModelPrompt } from "../api/chat.js";

test("subword tokenizer preserves multilingual graphemes, spaces and punctuation", () => {
  for (const sample of ["שלום עולם!", "مرحبا بالعالم!", "Hello world!", "你好世界！"]) {
    const tokens = tokenizeSubwords(sample);
    assert.equal(detokenizeSubwords(tokens), sample.toLowerCase());
    assert.ok(tokens.length > 3);
  }
});

test("language routing follows the latest user message", () => {
  assert.equal(detectLanguageCode("שלום, מי אתה?"), "he");
  assert.equal(detectLanguageCode("Hello, who are you?"), "en");
  assert.equal(detectLanguageCode("مرحبا"), "ar");
  assert.match(buildModelPrompt("שלום, מי אתה?", "retzef-code-subword"), /Assistant\[he\]:$/);
});

test("subword model trains, generates without special tokens and reloads", () => {
  const model = new RetzefSubwordNeuralModel({ embeddingSize: 4, hiddenSize: 6, contextSize: 8, seed: 4 });
  const stats = model.train("User: שלום, מי אתה?\nAssistant[he]: אני מודל ניסיוני.\nUser: Hello, who are you?\nAssistant[en]: I am a small model.", { epochs: 3 });
  assert.ok(stats.vocabulary > 3);
  assert.ok(Number.isFinite(stats.loss));
  const generated = model.generate("User: שלום, מי אתה?\nAssistant[he]:", { maxTokens: 12, minTokens: 3, random: () => 0.5 });
  assert.equal(typeof generated, "string");
  assert.ok(!generated.includes("<unk>"));
  assert.ok(!generated.includes("<s>"));
  const restored = RetzefSubwordNeuralModel.fromJSON(model.toJSON());
  assert.equal(restored.trainedTokens, model.trainedTokens);
  assert.equal(typeof restored.generate("שלום", { maxTokens: 4, minTokens: 1, random: () => 0.5 }), "string");
});

test("subword model rejects invalid epochs and incompatible files", () => {
  const model = new RetzefSubwordNeuralModel();
  assert.throws(() => model.train("שלום עולם", { epochs: 0 }), /epochs/);
  assert.throws(() => RetzefSubwordNeuralModel.fromJSON({ format: "wrong" }), /Unsupported/);
});
