/**
 * Retzef model adapter contract.
 * All model adapters receive the same OpenAI-compatible tools array.
 * An adapter that supports native function calling returns:
 * { tool_calls: [{ id, type:"function", function:{ name, arguments:"JSON" } }] }
 * or { toolCalls: [{ id, name, arguments: object|string }] }.
 *
 * Current experimental Retzef N-gram/Neural/Subword generators are text-only:
 * they can be wrapped by the Brain tool protocol but do not natively select
 * tools. Do not label them as native function-calling models.
 */
export const MODEL_ADAPTER_METHOD="generate";
export const MODEL_MESSAGE_ROLES=Object.freeze(["system","user","assistant","tool"]);
export const MODEL_TOOL_PROTOCOL="openai-tools";
export const MODEL_TOOL_RESPONSE_FORMAT=Object.freeze(["tool_calls","toolCalls"]);
