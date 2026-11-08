/**
 * Retzef Brain — model-independent AI orchestration.
 * Provider credentials must remain on a trusted server.
 */
const MAX_INPUT_CHARS = 12000;
const MAX_CUSTOM_INSTRUCTION_CHARS = 4000;

export class RetzefBrain {
  constructor({ model, memory, systemPrompt = "You are Retzef AI, a helpful and honest assistant." }) {
    if (!model || typeof model.generate !== "function") throw new TypeError("RetzefBrain requires a model adapter with generate().");
    if (!memory || typeof memory.get !== "function" || typeof memory.append !== "function") throw new TypeError("RetzefBrain requires a conversation memory store.");
    this.model = model;
    this.memory = memory;
    this.systemPrompt = systemPrompt;
  }

  async respond({ conversationId, message, systemPrompt, customInstructions = "", temperature = 0.7, maxOutputTokens = 700 }) {
    if (typeof conversationId !== "string" || !conversationId.trim()) throw new TypeError("conversationId is required.");
    if (typeof message !== "string" || !message.trim()) throw new TypeError("message must be a non-empty string.");
    if (message.length > MAX_INPUT_CHARS) throw new RangeError(`message exceeded the ${MAX_INPUT_CHARS} character limit.`);
    if (typeof customInstructions !== "string") throw new TypeError("customInstructions must be a string.");
    if (customInstructions.length > MAX_CUSTOM_INSTRUCTION_CHARS) throw new RangeError(`customInstructions exceeded the ${MAX_CUSTOM_INSTRUCTION_CHARS} character limit.`);

    const basePrompt = typeof systemPrompt === "string" && systemPrompt.trim() ? systemPrompt.trim() : this.systemPrompt;
    const extra = customInstructions.trim()
      ? "\n\nUser custom instructions (follow when relevant and consistent with higher-priority safety and system rules):\n" + customInstructions.trim()
      : "";
    const messages = [
      { role: "system", content: basePrompt + extra },
      ...this.memory.get(conversationId),
      { role: "user", content: message.trim() }
    ];

    const answer = await this.model.generate({ messages, temperature, maxOutputTokens });
    if (typeof answer !== "string" || !answer.trim()) throw new Error("The configured model returned an empty response.");
    this.memory.append(conversationId, { role: "user", content: message.trim() }, { role: "assistant", content: answer.trim() });
    return { conversationId, answer: answer.trim(), memoryMessages: this.memory.get(conversationId).length };
  }

  clearConversation(conversationId) {
    this.memory.clear(conversationId);
  }
}
