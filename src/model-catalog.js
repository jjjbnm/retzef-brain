export const MODEL_CATALOG = [
  {
    id: "retzef-general",
    name: "Retzef General",
    description: "Experimental general-purpose text model. Reply language should follow the user's latest message.",
    corpus: "retzef-general.txt",
    order: 3,
    maxTokens: 64
  },
  {
    id: "retzef-code",
    name: "Retzef Code",
    description: "Experimental code-text model. Conversation language should follow the user's latest message.",
    corpus: "retzef-code.txt",
    order: 3,
    maxTokens: 64
  }
];

export function getModelDefinition(id) {
  return MODEL_CATALOG.find((model) => model.id === id) ?? null;
}
