export const MODEL_CATALOG = [
  {
    id: "retzef-general",
    name: "Retzef General",
    version: "Sonnet 5.5",
    description: "General-purpose assistant for questions, explanations, research, and everyday conversation.",
    corpus: "retzef-general.txt",
    architecture: "subword",
    order: 1,
    maxTokens: 64
  },
  {
    id: "retzef-creative",
    name: "Retzef Creative",
    version: "Fable 5.2",
    description: "Creative storytelling assistant for plots, characters, dialogue, scripts, and imaginative world-building.",
    corpus: "retzef-creative.txt",
    architecture: "ngram",
    order: 2,
    maxTokens: 120
  },
  {
    id: "retzef-code",
    name: "Retzef Code",
    version: "Opus 5.5",
    description: "Software engineering assistant for code, debugging, architecture, and technical explanations.",
    corpus: "retzef-code.txt",
    architecture: "neural",
    order: 3,
    maxTokens: 64
  },
  {
    id: "retzef-mini",
    name: "Retzef Mini",
    version: "Haiku 5.5",
    description: "Fast, lightweight assistant for short answers, summaries, and simple everyday tasks.",
    corpus: "retzef-general.txt",
    architecture: "subword",
    order: 4,
    maxTokens: 64
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
