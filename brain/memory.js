/**
 * Retzef Brain — short-term conversation memory.
 * This is process-local memory: it resets when the host process restarts.
 * Production persistence can be added behind the same interface later.
 */
export class InMemoryConversationStore {
  constructor({ maxMessagesPerConversation = 24 } = {}) {
    if (!Number.isInteger(maxMessagesPerConversation) || maxMessagesPerConversation < 1) {
      throw new TypeError("maxMessagesPerConversation must be a positive integer.");
    }
    this.maxMessagesPerConversation = maxMessagesPerConversation;
    this.conversations = new Map();
  }

  get(conversationId) {
    return [...(this.conversations.get(conversationId) ?? [])];
  }

  append(conversationId, ...messages) {
    const current = this.get(conversationId);
    current.push(...messages);
    this.conversations.set(conversationId, current.slice(-this.maxMessagesPerConversation));
  }

  clear(conversationId) {
    this.conversations.delete(conversationId);
  }
}
