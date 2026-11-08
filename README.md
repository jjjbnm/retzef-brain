# Retzef Brain

Retzef Brain is an experimental, from-scratch Hebrew text-model project. This first learning model is a small word-transition (bigram / N-gram) model. It is **not** a ChatGPT-level neural network and does not understand language like a large language model.

## Requirements
- Node.js 20 or newer
- No external AI API and no paid model provider required

## Quick start
```bash
npm test
npm run train
npm run chat
```

Type `/exit` to leave the chat demo.

## Project structure
- `brain/tiny-model.js` — trains, generates, and serializes the small language model
- `brain/tokenizer.js` — Hebrew-friendly word and punctuation tokenizer
- `data/hebrew-sample.json` — tiny example training corpus; add text samples here
- `train.js` — trains and saves `models/retzef-brain.json`
- `chat.js` — terminal chat demo
- `test/` — automated tests
- `brain/engine.js` — conversation orchestration layer
- `brain/memory.js` — bounded in-memory conversation storage

## How to improve it
1. Add more original, clean Hebrew training examples to the JSON array in `data/hebrew-sample.json`.
2. Run `npm run train` again.
3. Run `npm test` and try `npm run chat`.

The model learns only local next-word frequencies. With this tiny dataset, its output will often be repetitive or nonsensical. Better data and more advanced model architecture are future milestones.

## Security and privacy
This prototype has no login or OAuth implementation. Never put API keys, passwords, or access tokens in source files. Conversation memory is process-local and is not durable across server restarts.

## Roadmap
- [x] Small trainable Hebrew text model
- [x] JSON model save/load
- [x] Terminal demo and automated tests
- [ ] Larger curated Hebrew dataset
- [ ] Improved tokenizer and context-aware model
- [ ] Server API adapter for Retzef AI
- [ ] OAuth integration (separate, security-reviewed module)
