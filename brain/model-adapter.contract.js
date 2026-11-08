/**
 * Provider-neutral model adapter contract.
 * Retzef Brain sends messages with system/user/assistant roles.
 * The adapter must forward the system message intact, including custom
 * instructions, to the provider's equivalent system/developer instruction
 * field. Provider APIs differ; translate roles as required without silently
 * dropping the instruction content. Keep API keys on the server.
 */
export const MODEL_ADAPTER_METHOD = "generate";
export const MODEL_MESSAGE_ROLES = Object.freeze(["system", "user", "assistant"]);
