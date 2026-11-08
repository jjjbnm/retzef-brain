/**
 * Model adapter contract.
 *
 * Implement this interface on the SERVER, not in browser code:
 *
 * export function createModelAdapter({ providerClient, modelName }) {
 *   return {
 *     async generate({ messages, temperature, maxOutputTokens }) {
 *       // Call the selected model provider using server-side credentials.
 *       // Return the assistant response as plain text.
 *     }
 *   };
 * }
 *
 * Retzef Brain deliberately does not contain an API key or assume a provider.
 */
export const MODEL_ADAPTER_METHOD = "generate";
