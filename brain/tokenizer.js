// A deliberately small tokenizer for the first Retzef Brain experiment.
export function tokenize(text) {
  if (typeof text !== "string") throw new TypeError("Text must be a string.");
  return text.toLocaleLowerCase("he").match(/[\\p{L}\\p{N}]+|[^\\s\\p{L}\\p{N}]/gu) ?? [];
}

export function detokenize(tokens) {
  return tokens.reduce((out, token) => {
    if (/^[,.;:!?…%)\\]}]$/u.test(token)) return out + token;
    if (/^[(\\[{]$/u.test(token)) return out + (out ? " " : "") + token;
    return out ? out + " " + token : token;
  }, "");
}
