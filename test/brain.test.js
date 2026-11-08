import test from "node:test";
import assert from "node:assert/strict";
import { RetzefBrain, InMemoryConversationStore } from "../brain/index.js";

test("memory keeps only the configured number of recent messages", () => {
  const memory = new InMemoryConversationStore({ maxMessagesPerConversation: 2 });
  memory.append("chat-1", { role: "user", content: "one" }, { role: "assistant", content: "two" }, { role: "user", content: "three" });
  assert.deepEqual(memory.get("chat-1").map((item) => item.content), ["two", "three"]);
});

test("brain sends context to the model and stores the exchange", async () => {
  const memory = new InMemoryConversationStore();
  let received;
  const model = { async generate(input) { received = input; return "Hello from the test model."; } };
  const brain = new RetzefBrain({ model, memory });
  const result = await brain.respond({ conversationId: "chat-1", message: "Hello" });

  assert.equal(result.answer, "Hello from the test model.");
  assert.equal(received.messages[0].role, "system");
  assert.equal(received.messages.at(-1).content, "Hello");
  assert.equal(memory.get("chat-1").length, 2);
});

test("brain rejects blank messages", async () => {
  const brain = new RetzefBrain({
    model: { async generate() { return "unused"; } },
    memory: new InMemoryConversationStore()
  });
  await assert.rejects(() => brain.respond({ conversationId: "chat-1", message: "  " }), TypeError);
});
