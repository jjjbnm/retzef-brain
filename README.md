# Retzef Brain

Retzef Brain is the standalone, model-independent intelligence core for Retzef products.

## Current milestone: AI orchestration core

- **Orchestration:** builds a structured model conversation from a system prompt, short-term history, and the latest user message.
- **Short-term memory:** stores a bounded message history per conversation ID.
- **Provider boundary:** accepts any server-side model adapter that implements `generate()`.
- **Input validation:** validates conversation IDs and messages and limits user input to 12,000 characters.
- **Credential safety:** provider API keys must stay in trusted server environment variables and must never be committed to this repository.

## Project layout

- `brain/engine.js` — `RetzefBrain` orchestration class.
- `brain/memory.js` — process-local conversation memory implementation.
- `brain/index.js` — public exports.
- `brain/model-adapter.contract.js` — model adapter contract marker.
- `test/brain.test.js` — automated tests for memory and orchestration.

## Requirements

- Node.js 20 or newer

## Install and test

```bash
npm test
```

## Minimal integration

```js
import { RetzefBrain, InMemoryConversationStore } from "./brain/index.js";

const model = {
  async generate({ messages }) {
    // Replace with a real server-side provider call.
    return "Model adapter is connected.";
  }
};

const brain = new RetzefBrain({
  model,
  memory: new InMemoryConversationStore()
});

const result = await brain.respond({
  conversationId: "demo-conversation",
  message: "Hello, Retzef!"
});

console.log(result.answer);
```

## Important status

This repository contains an initial orchestration framework, **not a trained language model**. It cannot produce open-ended AI answers until a real model provider is connected through the adapter. The included memory store is in-process only and resets when the host process restarts; persistent storage can be added behind the same interface later.

OAuth is intentionally out of scope for this first milestone and can be added as a separate module later.

## Security

Never put API keys, tokens, passwords, or other secrets in source files or Git history. Configure provider credentials only as server-side environment variables in the deployment platform.
