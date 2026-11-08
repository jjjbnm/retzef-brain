import test from "node:test";
import assert from "node:assert/strict";
import { RetzefNgramModel } from "../src/model.js";

test("training learns contexts and can generate", () => {
  const model = new RetzefNgramModel({ order: 2 });
  const stats = model.train("שלום עולם שלום חבר");
  assert.equal(stats.tokens, 4);
  assert.ok(stats.contexts > 0);
  assert.equal(typeof model.generate("שלום", { random: () => 0 }), "string");
});

test("model can be saved and loaded", () => {
  const model = new RetzefNgramModel({ order: 2 });
  model.train("רצף לומד טקסט רצף לומד");
  const restored = RetzefNgramModel.fromJSON(model.toJSON());
  assert.equal(restored.trainedTokens, model.trainedTokens);
  assert.ok(restored.counts.size > 0);
});

test("untrained model cannot generate", () => {
  const model = new RetzefNgramModel();
  assert.throws(() => model.generate("שלום"), /not been trained/);
});

test("invalid model order is rejected", () => {
  assert.throws(() => new RetzefNgramModel({ order: 1 }), /order/);
});
