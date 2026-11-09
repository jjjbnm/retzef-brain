import { tokenizeSubwords, detokenizeSubwords } from "./subword-tokenizer.js";

const START = "<s>";
const END = "</s>";
const UNK = "<unk>";

function seededRandom(seed = 29) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function softmax(logits, temperature = 0.8) {
  const t = Math.max(0.15, temperature);
  const max = Math.max(...logits);
  const values = logits.map(value => Math.exp((value - max) / t));
  const sum = values.reduce((a, b) => a + b, 0);
  return values.map(value => value / sum);
}

function sample(probabilities, random) {
  let cursor = random();
  for (let i = 0; i < probabilities.length; i += 1) {
    cursor -= probabilities[i];
    if (cursor <= 0) return i;
  }
  return probabilities.length - 1;
}

export class RetzefSubwordNeuralModel {
  constructor({ embeddingSize = 12, hiddenSize = 24, contextSize = 24, learningRate = 0.02, seed = 29 } = {}) {
    for (const [name, value] of Object.entries({ embeddingSize, hiddenSize, contextSize })) {
      if (!Number.isInteger(value) || value < 1 || value > 128) throw new RangeError(name + " must be an integer from 1 to 128");
    }
    this.embeddingSize = embeddingSize;
    this.hiddenSize = hiddenSize;
    this.contextSize = contextSize;
    this.learningRate = learningRate;
    this.seed = seed;
    this.vocabulary = [START, END, UNK];
    this.tokenToId = new Map(this.vocabulary.map((token, index) => [token, index]));
    this.embeddings = [];
    this.w1 = [];
    this.b1 = [];
    this.w2 = [];
    this.b2 = [];
    this.trainedTokens = 0;
    this.epochsTrained = 0;
    this.loss = null;
  }

  buildVocabulary(tokens) {
    for (const token of tokens) {
      if (!this.tokenToId.has(token)) {
        this.tokenToId.set(token, this.vocabulary.length);
        this.vocabulary.push(token);
      }
    }
  }

  initialize() {
    const random = seededRandom(this.seed);
    const v = this.vocabulary.length;
    const input = this.contextSize * this.embeddingSize;
    const values = (length, scale) => Array.from({ length }, () => (random() * 2 - 1) * scale);
    this.embeddings = values(v * this.embeddingSize, 0.16);
    this.w1 = values(this.hiddenSize * input, Math.sqrt(2 / input));
    this.b1 = Array(this.hiddenSize).fill(0);
    this.w2 = values(v * this.hiddenSize, Math.sqrt(2 / this.hiddenSize));
    this.b2 = Array(v).fill(0);
  }

  forward(context) {
    const inputSize = this.contextSize * this.embeddingSize;
    const x = new Array(inputSize);
    for (let slot = 0; slot < this.contextSize; slot += 1) {
      const id = context[slot] ?? 0;
      for (let d = 0; d < this.embeddingSize; d += 1) {
        x[slot * this.embeddingSize + d] = this.embeddings[id * this.embeddingSize + d];
      }
    }
    const hidden = new Array(this.hiddenSize);
    for (let h = 0; h < this.hiddenSize; h += 1) {
      let sum = this.b1[h];
      for (let j = 0; j < inputSize; j += 1) sum += this.w1[h * inputSize + j] * x[j];
      hidden[h] = Math.tanh(sum);
    }
    const logits = new Array(this.vocabulary.length);
    for (let token = 0; token < this.vocabulary.length; token += 1) {
      let sum = this.b2[token];
      for (let h = 0; h < this.hiddenSize; h += 1) sum += this.w2[token * this.hiddenSize + h] * hidden[h];
      logits[token] = sum;
    }
    return { x, hidden, logits };
  }

  train(text, { epochs = 20, learningRate = this.learningRate } = {}) {
    if (!Number.isInteger(epochs) || epochs < 1 || epochs > 500) throw new RangeError("epochs must be an integer from 1 to 500");
    if (!Number.isFinite(learningRate) || learningRate <= 0 || learningRate > 1) throw new RangeError("learningRate must be between 0 and 1");
    const tokens = tokenizeSubwords(text);
    if (tokens.length < 3) throw new Error("Training text must contain at least three characters");
    this.buildVocabulary(tokens);
    this.initialize();

    const ids = [0, ...tokens.map(token => this.tokenToId.get(token)), 1];
    const examples = [];
    // START is context only; never teach the model to emit it as normal text.
    for (let i = 1; i < ids.length; i += 1) {
      const context = Array(this.contextSize).fill(0);
      const history = ids.slice(Math.max(0, i - this.contextSize), i);
      history.forEach((id, index) => { context[this.contextSize - history.length + index] = id; });
      examples.push({ context, target: ids[i] });
    }

    let finalLoss = 0;
    for (let epoch = 0; epoch < epochs; epoch += 1) {
      let totalLoss = 0;
      for (const { context, target } of examples) {
        const { x, hidden, logits } = this.forward(context);
        const probs = softmax(logits);
        totalLoss += -Math.log(Math.max(probs[target], 1e-12));
        const dLogits = probs.slice();
        dLogits[target] -= 1;
        const dHidden = Array(this.hiddenSize).fill(0);
        for (let token = 0; token < this.vocabulary.length; token += 1) {
          const offset = token * this.hiddenSize;
          for (let h = 0; h < this.hiddenSize; h += 1) {
            dHidden[h] += this.w2[offset + h] * dLogits[token];
            this.w2[offset + h] -= learningRate * dLogits[token] * hidden[h];
          }
          this.b2[token] -= learningRate * dLogits[token];
        }
        const inputSize = this.contextSize * this.embeddingSize;
        const dInput = Array(inputSize).fill(0);
        for (let h = 0; h < this.hiddenSize; h += 1) {
          const dz = dHidden[h] * (1 - hidden[h] * hidden[h]);
          this.b1[h] -= learningRate * dz;
          for (let j = 0; j < inputSize; j += 1) {
            const index = h * inputSize + j;
            dInput[j] += this.w1[index] * dz;
            this.w1[index] -= learningRate * dz * x[j];
          }
        }
        for (let slot = 0; slot < this.contextSize; slot += 1) {
          const id = context[slot];
          for (let d = 0; d < this.embeddingSize; d += 1) {
            const index = id * this.embeddingSize + d;
            this.embeddings[index] -= learningRate * dInput[slot * this.embeddingSize + d];
          }
        }
      }
      finalLoss = totalLoss / examples.length;
    }
    this.trainedTokens = tokens.length;
    this.epochsTrained += epochs;
    this.loss = Number(finalLoss.toFixed(6));
    return { tokens: tokens.length, vocabulary: this.vocabulary.length, examples: examples.length, epochs, loss: this.loss };
  }

  generate(prompt = "", {
    maxTokens = 120,
    minTokens = 8,
    temperature = 0.72,
    topK = 12,
    repetitionPenalty = 0.22,
    random = Math.random
  } = {}) {
    if (!this.trainedTokens) throw new Error("Subword neural model has not been trained");
    if (!Number.isInteger(maxTokens) || maxTokens < 1 || maxTokens > 1000) throw new RangeError("maxTokens must be from 1 to 1000");
    if (!Number.isInteger(topK) || topK < 1 || topK > 128) throw new RangeError("topK must be from 1 to 128");
    const promptTokens = tokenizeSubwords(prompt);
    const ids = promptTokens.map(token => this.tokenToId.get(token) ?? 2);
    const generated = [];
    for (let i = 0; i < maxTokens; i += 1) {
      const context = Array(this.contextSize).fill(0);
      const history = ids.slice(-this.contextSize);
      history.forEach((id, index) => { context[this.contextSize - history.length + index] = id; });
      const logits = this.forward(context).logits.slice();
      // Never emit the start or unknown marker as user-facing text.
      logits[0] = -1e9;
      logits[2] = -1e9;
      if (generated.length < minTokens) logits[1] = -1e9;
      const recent = ids.slice(-Math.max(8, this.contextSize));
      for (const id of new Set(recent)) {
        if (id > 2 && Number.isFinite(logits[id])) {
          const count = recent.filter(item => item === id).length;
          logits[id] -= repetitionPenalty * count;
        }
      }
      const candidates = logits
        .map((value, id) => ({ id, value }))
        .filter(item => item.value > -1e8)
        .sort((a, b) => b.value - a.value)
        .slice(0, topK);
      const probabilities = softmax(candidates.map(item => item.value), temperature);
      const picked = candidates[sample(probabilities, random)];
      if (!picked) break;
      const nextId = picked.id;
      if (nextId === 1) break;
      ids.push(nextId);
      generated.push(this.vocabulary[nextId]);
    }
    return detokenizeSubwords([...promptTokens, ...generated]);
  }

  toJSON() {
    return {
      format: "retzef-subword-neural-v1",
      architecture: "grapheme-embedding-tanh-softmax-v2",
      embeddingSize: this.embeddingSize, hiddenSize: this.hiddenSize, contextSize: this.contextSize,
      vocabulary: this.vocabulary, embeddings: this.embeddings, w1: this.w1, b1: this.b1,
      w2: this.w2, b2: this.b2, trainedTokens: this.trainedTokens,
      epochsTrained: this.epochsTrained, loss: this.loss, seed: this.seed
    };
  }

  static fromJSON(data) {
    if (!data || !["retzef-subword-neural-v1", "retzef-subword-neural-v2"].includes(data.format) || !Array.isArray(data.vocabulary)) {
      throw new Error("Unsupported or invalid Retzef subword neural model file");
    }
    const model = new RetzefSubwordNeuralModel({
      embeddingSize: data.embeddingSize, hiddenSize: data.hiddenSize,
      contextSize: data.contextSize, seed: data.seed
    });
    for (const key of ["vocabulary", "embeddings", "w1", "b1", "w2", "b2"]) {
      if (!Array.isArray(data[key]) || data[key].some(value => typeof value !== (key === "vocabulary" ? "string" : "number") || (key !== "vocabulary" && !Number.isFinite(value)))) {
        throw new Error("Invalid subword model data: " + key);
      }
    }
    model.vocabulary = data.vocabulary;
    model.tokenToId = new Map(model.vocabulary.map((token, index) => [token, index]));
    for (const key of ["embeddings", "w1", "b1", "w2", "b2"]) model[key] = data[key];
    model.trainedTokens = Number(data.trainedTokens ?? 0);
    model.epochsTrained = Number(data.epochsTrained ?? 0);
    model.loss = data.loss ?? null;
    return model;
  }
}
