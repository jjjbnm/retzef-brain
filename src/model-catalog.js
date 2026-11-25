export const MODEL_CATALOG = [
  {
    id: "retzef-general",
    name: "Retzef General",
    description: "General-purpose assistant for questions, explanations, and conversation.",
    corpus: "retzef-general.txt",
    architecture: "subword",
    order: 3,
    maxTokens: 64
  },
  {
    id: "retzef-code",
    name: "Retzef Code",
    description: "Software engineering assistant for code, debugging, and technical explanations.",
    corpus: "retzef-code.txt",
    architecture: "neural",
    order: 3,
    maxTokens: 64
  },
  {
    id: "retzef-creative",
    name: "Retzef Creative",
    description: "Creative writing, ideation, and planning assistant.",
    corpus: "retzef-creative.txt",
    architecture: "ngram",
    order: 4,
    maxTokens: 120
  }
];

export const MODEL_IDS = Object.freeze(MODEL_CATALOG.map((model) => model.id));
export const MODEL_ID_SET = new Set(MODEL_IDS);

export function getModelDefinition(id) {
  return MODEL_CATALOG.find((model) => model.id === id) ?? null;
}

export function isSupportedModel(id) {
  return MODEL_ID_SET.has(id);
}
