

## Developer Studio update

The homepage now includes a TypeScript Playground and API key manager.

### TypeScript Playground
- Loads TypeScript 5.8.3 from esm.sh and transpiles in the browser.
- Runs the emitted JavaScript inside a sandboxed iframe with a restrictive CSP.
- Playground code is not sent to the Retzef Brain API.

### API keys
- `POST /api/keys` creates a 90-day `rzf_live_` key.
- `GET /api/keys?ownerId=...` lists key metadata for the browser owner ID.
- `DELETE /api/keys` revokes a key by ID.
- The plaintext key is returned only once; Redis stores only its SHA-256 hash.
- `POST /api/v1/chat` accepts Bearer API keys and OpenAI-style `messages`.

### Required production storage
Connect an Upstash Redis database to the Vercel project and add these server-side environment variables:
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Until both variables are present, the API key manager returns HTTP 503 and does not pretend to save keys. Never put these credentials in browser code.


## High-quality model provider (optional)

Retzef Brain can route Retzef General, Retzef Code, and Retzef Creative through any **OpenAI-compatible Chat Completions API**. Configure these as server-side Vercel environment variables (never in browser code):

- `RETZEF_AI_BASE_URL` — provider base URL, such as an OpenAI-compatible `/v1` endpoint.
- `RETZEF_AI_API_KEY` — provider API key.
- `RETZEF_AI_MODEL` — shared model ID (optional if all three model-specific IDs are set).
- `RETZEF_GENERAL_MODEL`, `RETZEF_CODE_MODEL`, `RETZEF_CREATIVE_MODEL` — optional per-model overrides.
- `RETZEF_AI_TIMEOUT_MS` — optional request timeout (10,000–90,000 ms; default 45,000).

When configured, all three Retzef profiles use the provider with their own system instructions, conversation history, and optional account training examples. If not configured, the existing native experimental retrieval behavior remains active. Provider failures are returned as errors instead of silently pretending the native model answered. This integration does not make the small native neural prototypes equivalent to Claude; answer quality depends on the external model selected and its provider.
