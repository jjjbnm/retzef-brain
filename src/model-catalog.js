export const MODEL_CATALOG = [
  {
    id: "retzef-hebrew",
    name: "Retzef Hebrew",
    description: "Experimental Hebrew text model trained on the Hebrew corpus.",
    corpus: "retzef-hebrew.txt",
    order: 3,
    maxTokens: 64
  },
  {
    id: "retzef-general",
    name: "Retzef General",
    description: "Experimental general-purpose text model trained on the general corpus.",
    corpus: "retzef-general.txt",
    order: 3,
    maxTokens: 64
  },
  {
    id: "retzef-code",
    name: "Retzef Code",
    description: "Experimental code-text model trained on a small JavaScript corpus.",
    corpus: "retzef-code.txt",
    order: 3,
    maxTokens: 64
  }
];

export function getModelDefinition(id) {
  return MODEL_CATALOG.find((model) => model.id === id) ?? null;
}
