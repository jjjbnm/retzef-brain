/**
 * Retzef Brain — model-independent AI orchestration layer.
 *
 * A model adapter must implement:
 *   generate({ messages, temperature, maxOutputTokens }) => Promise<string>
 *
 * API keys and provider credentials belong only in a trusted server environment.
 */
const MAX_INPUT_CHARS = 12_000;

export class RetzefBrain {
  constructor({ model, memory, systemPrompt = "You are Retzef AI, a helpful and honest assistant." }) {
    if (!model || typeof model.generate !== "function") {
      throw new TypeError("RetzefBrain requires a model adapter with generate().");
    }
    if (!memory || typeof memory.get !== "function" || typeof memory.append !== "function") {
      throw new TypeError("RetzefBrain requires a conversation memory store.");
    }

    this.model = model;
    this.memory = memory;
    this.systemPrompt = systemPrompt;
  }

  async respond({ conversationId, message, systemPrompt, temperature = 0.7, maxOutputTokens = 700 }) {
    if (typeof conversationId !== "string" || !conversationId.trim()) {
      throw new TypeError("conversationId is required.");
    }
    if (typeof message !== "string" || !message.trim()) {
      throw new TypeError("message must be a non-empty string.");
    }
    if (message.length > MAX_INPUT_CHARS) {
      throw new RangeError(`message exceeds the ${MAX_INPUT_CHARS} character limit.`);
    }

    const history = this.memory.get(conversationId);
    const messages = [
      { role: "system", content: systemPrompt || this.systemPrompt },
      ...history,
      { role: "user", content: message.trim() }
    ];

    const answer = await this.model.generate({ messages, temperature, maxOutputTokens });

    if (typeof answer !== "string" || !answer.trim()) {
      throw new Error("The configured model returned an empty response.");
    }

    this.memory.append(
      conversationId,
      { role: "user", content: message.trim() },
      { role: "assistant", content: answer.trim() }
    );

    return {
      conversationId,
      answer: answer.trim(),
      memoryMessages: this.memory.get(conversationId).length
    };
  }

  clearConversation(conversationId) {
    this.memory.clear(conversationId);
  }
}
