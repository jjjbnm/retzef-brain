# Retzef Brain

Retzef Brain is an experimental AI brain project. Version 0.2.0 adds a tiny Hebrew word-level n-gram language model that learns from a local text corpus. It does not call Gemini, Claude, or another hosted AI API.

## What this first model is

This is a small statistical language model trained from scratch: it counts which words tend to follow short word sequences, then samples likely next words. It is a real learned model, but **not a neural network and not comparable to ChatGPT**. With the tiny sample corpus included here, its replies will be repetitive and limited. Better results require a larger, varied, permission-safe training corpus.

## Requirements

- Node.js 20 or newer
- No third-party packages and no API key

## Train

```bash
npm install
npm run train
```

Training reads `data/training.txt` and writes `model/retzef-model.json`.

To train on another text file:

```bash
node scripts/train.js path/to/your-corpus.txt model/retzef-model.json
```

## Chat

```bash
npm run chat
```

Type `/exit` to quit.

## Test

```bash
npm test
```

## Project layout

- `src/tokenizer.js` — Unicode-aware Hebrew tokenization
- `src/model.js` — trainable n-gram model, generation, JSON save/load
- `data/training.txt` — tiny starter corpus
- `scripts/train.js` — training command
- `scripts/chat.js` — terminal chat demo
- `brain/` — model-independent conversation orchestration core
- `test/` — automated tests

## Roadmap

1. Collect a larger clean Hebrew corpus with permission to use it.
2. Add corpus evaluation and quality metrics.
3. Experiment with a small neural language model if compute becomes available.
4. Connect the trained model to the Retzef Brain conversation API.

## Security

Never commit passwords, API keys, access tokens, or private training data. Keep credentials in server-side environment variables. Do not train on private messages without permission.
