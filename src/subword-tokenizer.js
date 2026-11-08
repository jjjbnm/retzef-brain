const segmenter = typeof Intl.Segmenter === "function"
  ? new Intl.Segmenter("und", { granularity: "grapheme" })
  : null;

export function tokenizeSubwords(text) {
  const normalized = String(text).normalize("NFC").toLocaleLowerCase("und");
  if (segmenter) return Array.from(segmenter.segment(normalized), part => part.segment);
  return Array.from(normalized);
}

export function detokenizeSubwords(tokens) {
  return tokens.join("");
}
