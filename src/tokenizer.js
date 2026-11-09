export function tokenize(text) {
  return String(text)
    .normalize("NFC")
    .toLowerCase()
    .match(/[\p{L}\p{N}]+|[.!?،,;:]/gu) ?? [];
}

export function detokenize(tokens) {
  let out = "";
  for (const token of tokens) {
    if (/^[.!?،,;:]$/.test(token)) out = out.replace(/\s+$/, "") + token + " ";
    else out += token + " ";
  }
  return out.trim();
}
