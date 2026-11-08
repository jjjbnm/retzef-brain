

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
