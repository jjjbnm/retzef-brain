# Retzef Brain

Retzef Brain is the home of Retzef's original experimental language models and plugin orchestration.

Production: https://retzef-brain.vercel.app

## Models
Nine Retzef-owned experimental profiles: Hebrew, General and Code, each with N-gram, Neural and Subword architectures.

## Plugin system
- `GET /api/plugins`: list registered Retzef plugins.
- `POST /api/plugin-run`: run an allowlisted plugin with JSON input.
- `/plugins.html`: mobile-friendly plugin center.
- Built-ins: calculator, text analyzer, JSON formatter, and plugin draft builder.
- Drafts are metadata only and never execute automatically.
- The orchestration engine accepts structured `toolCalls` from compatible model adapters. Current tiny text models still return plain text, so they do not yet autonomously choose plugins.

## API
- `GET /api/health`
- `GET /api/models`
- `POST /api/chat`

## Limitations
These are small research prototypes, not ChatGPT-level assistants. Serverless memory is temporary and outputs may be repetitive or inaccurate. No external model provider or API key is used. Plugins execute only from a server-side allowlist.
