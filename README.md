

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
- `RETZEF_AI_MAX_TOKENS` — optional visible-output cap (256–16,384; otherwise profile defaults are used).
- `RETZEF_AI_RETRIES` — optional transient-failure retry count (1–3; default 2).
- `RETZEF_CORS_ORIGIN` — optional exact browser origin for the server-to-server `/api/v1/chat` API. It is intentionally not `*` because that endpoint accepts Bearer keys.

When configured, all three Retzef profiles use the provider with profile-specific quality instructions, language routing, bounded conversation history, relevant owner examples, uncertainty rules, prompt-injection defenses, and transient retry handling. Set `RETZEF_AI_MODEL` (or a profile override) to the high-quality Claude-compatible model identifier exposed by your provider. If not configured, the existing native experimental retrieval behavior remains active. Provider failures are returned as errors instead of silently pretending the native model answered. The small native neural prototypes are still experimental; Claude-like quality comes from selecting a capable upstream model and using this orchestration layer correctly.


## Claude-class inference through Vercel AI Gateway (opt-in)

Retzef Brain now includes a Claude-class runtime profile for Vercel AI Gateway. It uses Vercel's server-side `VERCEL_OIDC_TOKEN` automatically on deployed functions, so no Anthropic key is placed in the browser or committed to GitHub.

To activate paid inference, set the Vercel production environment variable `RETZEF_AI_PROVIDER=vercel-gateway` and redeploy. This is intentionally not enabled automatically because upstream model usage can incur charges. The default routing is:

- Retzef General → `anthropic/claude-sonnet-5`
- Retzef Code → `anthropic/claude-opus-5` with high reasoning effort
- Retzef Creative → `anthropic/claude-sonnet-5`

Optional overrides: `RETZEF_GATEWAY_GENERAL_MODEL`, `RETZEF_GATEWAY_CODE_MODEL`, `RETZEF_GATEWAY_CREATIVE_MODEL`, or shared `RETZEF_GATEWAY_MODEL`. The existing custom provider configuration (`RETZEF_AI_BASE_URL`, `RETZEF_AI_API_KEY`, and model variables) takes precedence when complete. The native experimental retrieval path remains active until Gateway is explicitly enabled.

The runtime now keeps a larger bounded conversation window, gives each model a task-specific reasoning budget, preserves recent turns, and exposes the active provider/model in `/api/models`. Gateway requests use Vercel OIDC server-side and are attributed to Retzef Brain. Model availability, usage prices, and account credits are controlled by Vercel AI Gateway; check the dashboard before enabling paid inference.


## Retzef Code — software and game engineering profile

Retzef Code is configured as the software-engineering specialist. Its instructions cover complete website, app, API, desktop-software, and game-project workflows; repository inspection; debugging and root-cause analysis; tests; security; deployment planning; Unreal Engine Blueprints/C++; and coding-agent task preparation.

### Extensible plugin catalog

The plugin catalog is designed to grow by provider manifests rather than hard-coding a fixed number of integrations. Retzef Code also has an expanded original engineering corpus for project planning, debugging, secure APIs, mobile layouts, Vercel/GitHub workflows, Unreal Engine, and plugin integration. It currently describes GitHub, Vercel, YouTube, TikTok, Discord, Retzef Engine, Unreal Engine project-bridge workflows, and Codex task/review workflows. `GET /api/plugins` lists providers and `GET /api/plugin-tools?providers=github,vercel` returns OpenAI-compatible tool definitions.

**Connection status:** listing a provider or tool does not mean its external connector is live. User OAuth, project bridges, and server-side execution adapters must be configured before external actions can run. Until then, external execution returns an explicit connection-required response; no fake success is returned. The catalog is extensible to thousands of manifest-defined plugins, but this commit does not claim that thousands of integrations are already installed or connected.

External write operations, deployment actions, and repository mutations must use least-privilege permissions and explicit user approval. Secrets remain server-side.
