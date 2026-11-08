# Retzef Brain

Retzef Brain is an experimental AI model studio with a server-side API layer.

## Website
- Production: https://retzef-brain.vercel.app
- Provider integration: OpenRouter

## Server routes
- `GET /api/health` — server health.
- `POST /api/connect` — validates an OpenRouter key via `GET /api/v1/key`.
- `GET /api/models` — fetches live text, image and video model catalogs from OpenRouter.
- `POST /api/chat` — sends a prompt to selected text models using OpenRouter fallback routing.

## Security
- API keys are sent in the `x-openrouter-key` request header and are never stored in localStorage, database, source files, or returned in API responses.
- The browser keeps the key in memory only; refreshing the page clears it.
- Use HTTPS and do not share your API key.
- Provider usage may incur charges. Review provider pricing and account permissions before use.

## Model stack
The merge feature creates a configuration/fallback stack. It does not merge neural network weights or train a new model.
The existing Retzef N-gram, Neural and Subword prototypes remain separate research models and are not presented as production-hosted inference endpoints.

## Deploy
Vercel automatically deploys functions in the `api/` directory using the Node.js runtime. No third-party npm dependency is required.
