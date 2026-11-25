

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
- `RETZEF_AI_MAX_TOKENS` — optional visible-output cap (256–4,096; otherwise profile defaults are used).
- `RETZEF_AI_RETRIES` — optional transient-failure retry count (1–3; default 2).
- `RETZEF_CORS_ORIGIN` — optional exact browser origin for the server-to-server `/api/v1/chat` API. It is intentionally not `*` because that endpoint accepts Bearer keys.

When configured, all three Retzef profiles use the provider with profile-specific quality instructions, language routing, bounded conversation history, relevant owner examples, uncertainty rules, prompt-injection defenses, and transient retry handling. Set `RETZEF_AI_MODEL` (or a profile override) to the high-quality Claude-compatible model identifier exposed by your provider. If not configured, the existing native experimental retrieval behavior remains active. Provider failures are returned as errors instead of silently pretending the native model answered. The small native neural prototypes are still experimental; Claude-like quality comes from selecting a capable upstream model and using this orchestration layer correctly.
