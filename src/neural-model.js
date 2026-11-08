import { tokenize, detokenize } from "./tokenizer.js";

const START = "<s>";
const END = "</s>";
const UNK = "<unk>";

function seededRandom(seed = 17) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function softmax(logits, temperature = 1) {
  const t = Math.max(0.15, temperature);
  const max = Math.max(...logits);
  const values = logits.map((value) => Math.exp((value - max) / t));
  const total = values.reduce((sum, value) => sum + value, 0);
  return values.map((value) => value / total);
}

function sample(probabilities, random) {
  let cursor = random();
  for (let i = 0; i < probabilities.length; i += 1) {
    cursor -= probabilities[i];
    if (cursor <= 0) return i;
  }
  return probabilities.length - 1;
}

export class RetzefNeuralModel {
  constructor({
    embeddingSize = 8,
    hiddenSize = 12,
    contextSize = 2,
    learningRate = 0.035,
    seed = 17
  } = {}) {
    for (const [name, value] of Object.entries({ embeddingSize, hiddenSize, contextSize })) {
      if (!Number.isInteger(value) || value < 1 || value > 128) {
        throw new RangeError(name + " must be an integer from 1 to 128");
      }
    }
    this.embeddingSize = embeddingSize;
    this.hiddenSize = hiddenSize;
    this.contextSize = contextSize;
    this.learningRate = learningRate;
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
    this.seed = seed;
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
    const inputSize = this.contextSize * this.embeddingSize;
    const scaleE = 0.2;
    const scale1 = Math.sqrt(2 / inputSize);
    const scale2 = Math.sqrt(2 / this.hiddenSize);
    const values = (length, scale) =>
      Array.from({ length }, () => (random() * 2 - 1) * scale);

    this.embeddings = values(v * this.embeddingSize, scaleE);
    this.w1 = values(this.hiddenSize * inputSize, scale1);
    this.b1 = Array(this.hiddenSize).fill(0);
    this.w2 = values(v * this.hiddenSize, scale2);
    this.b2 = Array(v).fill(0);
  }

  forward(contextIds) {
    const inputSize = this.contextSize * this.embeddingSize;
    const x = new Array(inputSize);
    for (let slot = 0; slot < this.contextSize; slot += 1) {
      const id = contextIds[slot] ?? 0;
      for (let d = 0; d < this.embeddingSize; d += 1) {
        x[slot * this.embeddingSize + d] =
          this.embeddings[id * this.embeddingSize + d];
      }
    }

    const hidden = new Array(this.hiddenSize);
    for (let h = 0; h < this.hiddenSize; h += 1) {
      let sum = this.b1[h];
      const offset = h * inputSize;
      for (let j = 0; j < inputSize; j += 1) sum += this.w1[offset + j] * x[j];
      hidden[h] = Math.tanh(sum);
    }

    const logits = new Array(this.vocabulary.length);
    for (let token = 0; token < this.vocabulary.length; token += 1) {
      let sum = this.b2[token];
      const offset = token * this.hiddenSize;
      for (let h = 0; h < this.hiddenSize; h += 1) {
        sum += this.w2[offset + h] * hidden[h];
      }
      logits[token] = sum;
    }
    return { x, hidden, logits };
  }

  train(text, { epochs = 20, learningRate = this.learningRate } = {}) {
    if (!Number.isInteger(epochs) || epochs < 1 || epochs > 500) {
      throw new RangeError("epochs must be an integer from 1 to 500");
    }
    const tokens = tokenize(text);
    if (tokens.length < 3) throw new Error("Training text must contain at least three tokens");

    this.buildVocabulary(tokens);
    this.initialize();
    const sequence = [
      ...Array(this.contextSize).fill(START),
      ...tokens,
      END
    ].map((token) => this.tokenToId.get(token) ?? this.tokenToId.get(UNK));
    const examples = [];
    for (let i = this.contextSize; i < sequence.length; i += 1) {
      examples.push({
        context: sequence.slice(i - this.contextSize, i),
        target: sequence[i]
      });
    }

    let finalLoss = 0;
    for (let epoch = 0; epoch < epochs; epoch += 1) {
      let epochLoss = 0;
      for (const example of examples) {
        const { x, hidden, logits } = this.forward(example.context);
        const probabilities = softmax(logits);
        const target = example.target;
        epochLoss -= Math.log(Math.max(probabilities[target], 1e-12));

        const dLogits = probabilities.slice();
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
          const dPre = dHidden[h] * (1 - hidden[h] * hidden[h]);
          const offset = h * inputSize;
          this.b1[h] -= learningRate * dPre;
          for (let j = 0; j < inputSize; j += 1) {
            dInput[j] += this.w1[offset + j] * dPre;
            this.w1[offset + j] -= learningRate * dPre * x[j];
          }
        }

        for (let slot = 0; slot < this.contextSize; slot += 1) {
          const id = example.context[slot];
          for (let d = 0; d < this.embeddingSize; d += 1) {
            const index = id * this.embeddingSize + d;
            this.embeddings[index] -= learningRate * dInput[slot * this.embeddingSize + d];
          }
        }
      }
      finalLoss = epochLoss / examples.length;
    }

    this.trainedTokens = tokens.length;
    this.epochsTrained += epochs;
    this.loss = Number(finalLoss.toFixed(6));
    return {
      tokens: this.trainedTokens,
      vocabulary: this.vocabulary.length,
      examples: examples.length,
      epochs,
      loss: this.loss
    };
  }

  generate(prompt = "", {
    maxTokens = 32,
    temperature = 0.85,
    random = Math.random
  } = {}) {
    if (!this.trainedTokens) throw new Error("Neural model has not been trained");
    if (!Number.isInteger(maxTokens) || maxTokens < 1 || maxTokens > 256) {
      throw new RangeError("maxTokens must be an integer from 1 to 256");
    }

    const promptTokens = tokenize(prompt);
    let context = Array(this.contextSize).fill(this.tokenToId.get(START));
    for (const token of promptTokens) {
      context.push(this.tokenToId.get(token) ?? this.tokenToId.get(UNK));
    }
    context = context.slice(-this.contextSize);

    const generated = [];
    for (let i = 0; i < maxTokens; i += 1) {
      const { logits } = this.forward(context);
      const probabilities = softmax(logits, temperature);
      const nextId = sample(probabilities, random);
      const nextToken = this.vocabulary[nextId];
      if (nextToken === END || nextToken === START) break;
      generated.push(nextToken);
      context = [...context.slice(1), nextId];
    }
    return detokenize([...promptTokens, ...generated]);
  }

  toJSON() {
    return {
      format: "retzef-neural-v1",
      architecture: "embedding-tanh-softmax",
      embeddingSize: this.embeddingSize,
      hiddenSize: this.hiddenSize,
      contextSize: this.contextSize,
      vocabulary: this.vocabulary,
      embeddings: this.embeddings,
      w1: this.w1,
      b1: this.b1,
      w2: this.w2,
      b2: this.b2,
      trainedTokens: this.trainedTokens,
      epochsTrained: this.epochsTrained,
      loss: this.loss,
      seed: this.seed
    };
  }

  static fromJSON(data) {
    if (!data || data.format !== "retzef-neural-v1" || !Array.isArray(data.vocabulary)) {
      throw new Error("Unsupported or invalid Retzef neural model file");
    }
    const model = new RetzefNeuralModel({
      embeddingSize: data.embeddingSize,
      hiddenSize: data.hiddenSize,
      contextSize: data.contextSize,
      seed: data.seed
    });
    model.vocabulary = data.vocabulary;
    model.tokenToId = new Map(model.vocabulary.map((token, index) => [token, index]));
    for (const key of ["embeddings", "w1", "b1", "w2", "b2"]) {
      if (!Array.isArray(data[key]) || data[key].some((value) => !Number.isFinite(value))) {
        throw new Error("Invalid neural model weights: " + key);
      }
      model[key] = data[key];
    }
    model.trainedTokens = Number(data.trainedTokens ?? 0);
    model.epochsTrained = Number(data.epochsTrained ?? 0);
    model.loss = data.loss ?? null;
    return model;
  }
}
