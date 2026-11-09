import test from "node:test";
import assert from "node:assert/strict";
import { extractLatestUserMessage, generateRetzefResponse } from "../api/chat.js";

test("extracts the final user message and ignores Retzef system instructions", () => {
  const prompt = [
    "system: you are retzef ai",
    "reply in the same language",
    "additional user instructions:",
    "user: היי",
    "assistant[he]:"
  ].join("\n");
  assert.equal(extractLatestUserMessage(prompt), "היי");
});

test("extracts the latest user turn from a multi-turn transcript", () => {
  assert.equal(
    extractLatestUserMessage("user: hello\nassistant: hi\nuser: מה נשמע?\nassistant[he]:"),
    "מה נשמע?"
  );
});

for (const modelId of ["retzef-general", "retzef-code", "retzef-creative"]) {
  test(modelId + " answers a Hebrew greeting clearly", async () => {
    const answer = await generateRetzefResponse({
      modelId,
      prompt: "system: You are Retzef AI.\nuser: היי\nassistant[he]:"
    });
    assert.equal(answer, "היי! 😊 איך אפשר לעזור לך היום?");
  });
}
