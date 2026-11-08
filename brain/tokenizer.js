// A deliberately small tokenizer for the first Retzef Brain experiment.
export function tokenize(text) {
  if (typeof text !== "string") throw new TypeError("Text must be a string.");
  return text.toLocaleLowerCase("he").match(/[\p{L}\p{N}]+|[^\s\p{L}\p{N}]/gu) ?? [];
}

export function detokenize(tokens) {
  const closing = new Set([",", ".", ";", ":", "!", "?", "…", ")", "]", "}"]);
  const opening = new Set(["(", "[", "{"]);
  return tokens.reduce((out, token) => {
    if (closing.has(token)) return out + token;
    if (opening.has(token)) return out + (out ? " " : "") + token;
    return out ? out + " " + token : token;
  }, "");
}
