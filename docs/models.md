# Retzef Brain model family

Retzef Brain currently includes three small, from-scratch experimental N-gram models:

- **Retzef Hebrew** — trained on `data/corpora/retzef-hebrew.txt`.
- **Retzef General** — trained on `data/corpora/retzef-general.txt`.
- **Retzef Code** — trained on `data/corpora/retzef-code.txt`.

## Train the models

Requires Node.js 20 or newer:

```bash
npm run train:models
```

The trainer writes model files to `models/<model-id>.json`. These generated files are local build artifacts and are not committed automatically.

## Use the model registry

```js
import { listModels, loadModel } from "./src/model-registry.js";

console.log(listModels());
const model = await loadModel("retzef-hebrew");
console.log(model.generate("שלום", { maxTokens: 24 }));
```

## Current limitations

These are N-gram text models, not neural transformer models or ChatGPT-level assistants. They learn local token patterns from small text corpora. They do not reliably reason, follow complex instructions, or understand meaning. Custom instructions are forwarded by the orchestration layer to compatible provider adapters; this experimental N-gram family does not yet reliably follow them.

The three profiles currently use the same N-gram architecture with different training corpora. They are separate trained model files, not three independently designed neural architectures.
