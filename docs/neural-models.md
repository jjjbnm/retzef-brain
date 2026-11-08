# Retzef Neural (experimental)

Retzef Neural is the first trainable neural-network prototype in Retzef Brain. It is implemented in plain JavaScript and has no paid runtime or external model dependency.

## Architecture

- Word-level tokenizer shared with Retzef Brain.
- Trainable token embeddings.
- A small tanh hidden layer.
- Softmax next-token prediction.
- Cross-entropy loss and backpropagation with stochastic gradient descent.

This is a small educational neural language-model experiment, not a transformer and not comparable to ChatGPT. The starter corpora are intentionally tiny. The model can only predict tokens from its training vocabulary and will often produce weak or repetitive text.

## Train

```bash
npm run train:neural
```

The three files are written to `models/neural/` and can be uploaded as a GitHub Actions artifact by the training workflow.
