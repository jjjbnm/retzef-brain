import { tokenize, detokenize } from "./tokenizer.js";

export class TinyLanguageModel {
  constructor({ maxNextTokens = 12 } = {}) {
    this.maxNextTokens = maxNextTokens;
    this.transitions = new Map();
    this.vocabulary = new Set();
  }

  train(texts) {
    if (!Array.isArray(texts) || texts.length === 0) {
      throw new TypeError("Training data must be a non-empty array of strings.");
    }
    for (const text of texts) {
      const tokens = tokenize(text);
      for (let i = 0; i < tokens.length; i += 1) {
        const current = tokens[i];
        this.vocabulary.add(current);
        const next = tokens[i + 1] ?? "<END>";
        if (!this.transitions.has(current)) this.transitions.set(current, new Map());
        const counts = this.transitions.get(current);
        counts.set(next, (counts.get(next) ?? 0) + 1);
      }
    }
    return this;
  }

  generate(prompt, { maxTokens = 40, seed = 1 } = {}) {
    if (!Number.isInteger(maxTokens) || maxTokens < 1 || maxTokens > 200) {
      throw new RangeError("maxTokens must be between 1 and 200.");
    }
    const promptTokens = tokenize(prompt);
    let current = promptTokens.at(-1);
    if (!current || !this.transitions.has(current)) {
      current = [...this.transitions.keys()][0];
    }
    if (!current) return "עדיין לא אימנתי את המודל. צריך לאמן אותו קודם.";
    const output = [...promptTokens];
    let state = Math.abs(Number(seed) || 1);
    for (let i = 0; i < maxTokens; i += 1) {
      const choices = this.transitions.get(current);
      if (!choices) break;
      const entries = [...choices.entries()];
      const total = entries.reduce((sum, [, count]) => sum + count, 0);
      state = (state * 48271) % 2147483647;
      let pick = (state / 2147483647) * total;
      let next = "<END>";
      for (const [token, count] of entries) {
        pick -= count;
        if (pick < 0) { next = token; break; }
      }
      if (next === "<END>") break;
      output.push(next);
      current = next;
    }
    return detokenize(output);
  }

  toJSON() {
    return {
      format: "retzef-tiny-ngram-v1",
      maxNextTokens: this.maxNextTokens,
      transitions: [...this.transitions].map(([token, counts]) => [token, [...counts]]),
      vocabulary: [...this.vocabulary]
    };
  }

  static fromJSON(data) {
    if (!data || data.format !== "retzef-tiny-ngram-v1" || !Array.isArray(data.transitions)) {
      throw new TypeError("Unsupported or invalid Retzef Brain model file.");
    }
    const model = new TinyLanguageModel({ maxNextTokens: data.maxNextTokens });
    model.transitions = new Map(data.transitions.map(([token, counts]) => [token, new Map(counts)]));
    model.vocabulary = new Set(Array.isArray(data.vocabulary) ? data.vocabulary : []);
    return model;
  }
}
