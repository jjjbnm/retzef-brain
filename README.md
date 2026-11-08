# Retzef Brain

Retzef Brain is the home of Retzef's original experimental language models.

## Production
https://retzef-brain.vercel.app

## Retzef model catalog
The server exposes nine Retzef-owned experimental profiles:
- Retzef Hebrew / General / Code
- Each with N-gram, Neural and Subword architectures

## API
- `GET /api/health` — service health
- `GET /api/models` — Retzef-only model catalog
- `POST /api/chat` — trains/loads the selected Retzef prototype from its own corpus and generates a response

Request body: `{"modelId":"retzef-hebrew","prompt":"שלום"}`

## Important limitations
These are small research prototypes, not ChatGPT-level assistants. The Neural and Subword models train briefly on first use in a serverless instance; the first request may be slower. Warm instances cache trained weights in memory, but serverless memory is not permanent. Outputs may be repetitive or inaccurate.

No external model provider or API key is used. Model-stack selection and external provider integrations are intentionally not part of this Retzef-only edition.
