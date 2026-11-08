import test from "node:test";
import assert from "node:assert/strict";
import { RetzefBrain, InMemoryConversationStore } from "../brain/index.js";

test("custom instructions are forwarded in the system message", async () => {
  let captured;
  const model = { async generate(input) { captured = input; return "שלום!"; } };
  const brain = new RetzefBrain({ model, memory: new InMemoryConversationStore() });
  await brain.respond({ conversationId: "custom-1", message: "היי", customInstructions: "ענה תמיד בעברית ובקצרה." });
  assert.equal(captured.messages[0].role, "system");
  assert.match(captured.messages[0].content, /ענה תמיד בעברית ובקצרה/);
  assert.match(captured.messages[0].content, /higher-priority safety/);
});

test("empty custom instructions preserve the default system prompt", async () => {
  let captured;
  const model = { async generate(input) { captured = input; return "OK"; } };
  const brain = new RetzefBrain({ model, memory: new InMemoryConversationStore(), systemPrompt: "Base prompt" });
  await brain.respond({ conversationId: "custom-2", message: "Hi" });
  assert.equal(captured.messages[0].content, "Base prompt");
});

test("custom instructions have a size limit", async () => {
  const model = { async generate() { return "unused"; } };
  const brain = new RetzefBrain({ model, memory: new InMemoryConversationStore() });
  await assert.rejects(() => brain.respond({ conversationId: "custom-3", message: "Hi", customInstructions: "x".repeat(4001) }), RangeError);
});
