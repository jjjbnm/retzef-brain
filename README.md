# Retzef Brain

Retzef Brain is an experimental AI core project for the Retzef ecosystem.

## Model families

- **Retzef Hebrew / General / Code** — small N-gram text models trained on separate corpora.
- **Retzef Neural Hebrew / General / Code** — small neural next-token prediction models implemented from scratch in JavaScript. They use trainable embeddings, a tanh hidden layer, softmax, and backpropagation.

These are educational prototypes, not transformer models and not comparable to ChatGPT. The starter datasets are small, so generated text is limited and may be repetitive or incorrect.

## Train models

Requires Node.js 20+.

```bash
npm run train:models
npm run train:neural
npm test
```

GitHub Actions also trains both families and uploads the generated JSON model files as a workflow artifact.

See [docs/neural-models.md](docs/neural-models.md) for the neural architecture and limitations.
