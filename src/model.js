import { tokenize, detokenize } from "./tokenizer.js";

const START = "<s>";
const END = "</s>";

export class RetzefNgramModel {
  constructor({ order = 3, temperature = 0.85, maxTokens = 48 } = {}) {
    if (!Number.isInteger(order) || order < 2 || order > 5) {
      throw new RangeError("order must be an integer between 2 and 5");
    }
    this.order = order;
    this.temperature = temperature;
    this.maxTokens = maxTokens;
    this.counts = new Map();
    this.vocabulary = new Set([END]);
    this.trainedTokens = 0;
  }

  train(text) {
    const tokens = tokenize(text);
    if (tokens.length < 2) throw new Error("Training text must contain at least two tokens");
    const padded = [...Array(this.order - 1).fill(START), ...tokens, END];
    for (let i = 0; i <= padded.length - this.order; i++) {
      const context = padded.slice(i, i + this.order - 1).join(" ");
      const next = padded[i + this.order - 1];
      if (!this.counts.has(context)) this.counts.set(context, new Map());
      const row = this.counts.get(context);
      row.set(next, (row.get(next) ?? 0) + 1);
      this.vocabulary.add(next);
    }
    this.trainedTokens += tokens.length;
    return { tokens: tokens.length, contexts: this.counts.size, vocabulary: this.vocabulary.size };
  }

  nextToken(contextTokens, random = Math.random) {
    const context = contextTokens.slice(-(this.order - 1));
    while (context.length < this.order - 1) context.unshift(START);
    const row = this.counts.get(context.join(" "));
    if (!row) return END;

    const candidates = [...row.entries()];
    const temperature = Math.max(0.05, this.temperature);
    const weights = candidates.map(([, count]) => Math.pow(count, 1 / temperature));
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    let choice = random() * total;
    for (let i = 0; i < candidates.length; i++) {
      choice -= weights[i];
      if (choice <= 0) return candidates[i][0];
    }
    return candidates.at(-1)[0];
  }

  generate(prompt = "", { maxTokens = this.maxTokens, random = Math.random } = {}) {
    if (this.counts.size === 0) throw new Error("Model has not been trained");
    const promptTokens = tokenize(prompt);
    const generated = [];
    const context = [...Array(this.order - 1).fill(START), ...promptTokens];
    for (let i = 0; i < maxTokens; i++) {
      const next = this.nextToken([...context, ...generated], random);
      if (next === END) break;
      generated.push(next);
    }
    return detokenize([...promptTokens, ...generated]);
  }

  toJSON() {
    return {
      format: "retzef-ngram-v1",
      order: this.order,
      temperature: this.temperature,
      maxTokens: this.maxTokens,
      trainedTokens: this.trainedTokens,
      counts: Object.fromEntries(
        [...this.counts.entries()].map(([context, row]) => [context, Object.fromEntries(row)])
      )
    };
  }

  static fromJSON(data) {
    if (!data || data.format !== "retzef-ngram-v1" || !data.counts) {
      throw new Error("Unsupported or invalid Retzef model file");
    }
    const model = new RetzefNgramModel(data);
    for (const [context, row] of Object.entries(data.counts)) {
      model.counts.set(context, new Map(Object.entries(row).map(([token, count]) => [token, Number(count)])));
      for (const token of Object.keys(row)) model.vocabulary.add(token);
    }
    model.trainedTokens = Number(data.trainedTokens ?? 0);
    return model;
  }
}
