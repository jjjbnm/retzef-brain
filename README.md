# Retzef Brain

Retzef Brain is an experimental AI core project for the Retzef ecosystem.

## Model families

- **Retzef Hebrew / General / Code** — small N-gram text models trained on separate corpora.
- **Retzef Neural Hebrew / General / Code** — small word-level neural next-token models implemented from scratch in JavaScript.
- **Retzef Subword Neural Hebrew / General / Code** — separate grapheme-level neural models that learn character sequences, spaces and punctuation.

These are educational prototypes, not Transformer models and not comparable to ChatGPT. Their small starter datasets mean generated text may be repetitive or incorrect.

## Train models

Requires Node.js 20+.

```bash
npm run train:models
npm run train:neural
npm run train:subword
npm test
```

GitHub Actions trains all model families and uploads the generated JSON weights as an artifact.
See [the subword model notes](docs/subword-models.md).
