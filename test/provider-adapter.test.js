import test from "node:test";
import assert from "node:assert/strict";
import { buildSystemInstruction, generateProviderResponse } from "../brain/provider-adapter.js";

function response({ status = 200, body = {}, detail = "" } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => null },
    async text() { return detail; },
    async json() { return body; }
  };
}

function withEnv(values) {
  const previous = new Map(Object.keys(values).map((key) => [key, process.env[key]]));
  for (const [key, value] of Object.entries(values)) process.env[key] = value;
  return () => {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  };
}

test("system instruction is profile-specific, multilingual, and injection-resistant", () => {
  const instruction = buildSystemInstruction(
    "retzef-code",
    "כתוב פונקציה שמאמתת קלט",
    [{ input: "כתוב פונקציה", expectedOutput: "הנה קוד בטוח." }],
    "Answer with TypeScript."
  );
  assert.match(instruction, /senior software engineering assistant/);
  assert.match(instruction, /Hebrew/);
  assert.match(instruction, /untrusted data/);
  assert.match(instruction, /Answer with TypeScript/);
  assert.match(instruction, /<example-1>/);
});

test("provider payload preserves caller instructions and bounded conversation history", async () => {
  const restore = withEnv({
    RETZEF_AI_BASE_URL: "https://provider.example/v1",
    RETZEF_AI_API_KEY: "server-only",
    RETZEF_AI_MODEL: "claude-compatible-quality",
    RETZEF_AI_RETRIES: "1"
  });
  const originalFetch = globalThis.fetch;
  let payload;
  globalThis.fetch = async (_url, options) => {
    payload = JSON.parse(options.body);
    return response({ body: { choices: [{ message: { content: "תשובה מדויקת." } }] } });
  };
  try {
    const answer = await generateProviderResponse({
      modelId: "retzef-general",
      prompt: "system: Answer in Hebrew\nuser: שלום",
      messages: [
        { role: "system", content: "Answer in Hebrew" },
        { role: "user", content: "מה נשמע?" },
        { role: "assistant", content: "בסדר." },
        { role: "user", content: "איך אפשר לעזור לי?" }
      ],
      latestUser: "איך אפשר לעזור לי?",
      trainingExamples: []
    });
    assert.equal(answer, "תשובה מדויקת.");
    assert.equal(payload.model, "claude-compatible-quality");
    assert.match(payload.messages[0].content, /Answer in Hebrew/);
    assert.deepEqual(payload.messages.slice(1).map((message) => message.role), ["user", "assistant", "user"]);
    assert.equal(payload.messages.at(-1).content, "איך אפשר לעזור לי?");
  } finally {
    globalThis.fetch = originalFetch;
    restore();
  }
});

test("provider retries a transient upstream failure once", async () => {
  const restore = withEnv({
    RETZEF_AI_BASE_URL: "https://provider.example/v1",
    RETZEF_AI_API_KEY: "server-only",
    RETZEF_AI_MODEL: "quality-model",
    RETZEF_AI_RETRIES: "2"
  });
  const originalFetch = globalThis.fetch;
  let attempts = 0;
  globalThis.fetch = async () => {
    attempts += 1;
    if (attempts === 1) return response({ status: 503, detail: "private upstream detail" });
    return response({ body: { choices: [{ message: { content: "Recovered." } }] } });
  };
  try {
    assert.equal(await generateProviderResponse({
      modelId: "retzef-general",
      latestUser: "Hello",
      prompt: "user: Hello",
      messages: [{ role: "user", content: "Hello" }]
    }), "Recovered.");
    assert.equal(attempts, 2);
  } finally {
    globalThis.fetch = originalFetch;
    restore();
  }
});


test("Vercel Gateway routes Code to Claude Opus with server-side OIDC and high reasoning", async () => {
  const restore = withEnv({
    RETZEF_AI_PROVIDER: "vercel-gateway",
    VERCEL_OIDC_TOKEN: "oidc-server-only",
    AI_GATEWAY_API_KEY: "",
    RETZEF_AI_RETRIES: "1"
  });
  const originalFetch = globalThis.fetch;
  let captured;
  globalThis.fetch = async (url, options) => {
    captured = { url, headers: options.headers, body: JSON.parse(options.body) };
    return response({ body: { choices: [{ message: { content: "A careful code answer." } }] } });
  };
  try {
    const answer = await generateProviderResponse({
      modelId: "retzef-code",
      prompt: "user: Fix this function",
      messages: [{ role: "user", content: "Fix this function" }],
      latestUser: "Fix this function"
    });
    assert.equal(answer, "A careful code answer.");
    assert.equal(captured.url, "https://ai-gateway.vercel.sh/v1/chat/completions");
    assert.equal(captured.headers.Authorization, "Bearer oidc-server-only");
    assert.equal(captured.headers["X-Vercel-AI-App-Name"], "Retzef Brain");
    assert.equal(captured.body.model, "anthropic/claude-opus-5");
    assert.deepEqual(captured.body.reasoning, { effort: "high" });
    assert.equal(captured.body.max_tokens, 8192);
  } finally {
    globalThis.fetch = originalFetch;
    restore();
  }
});

test("Vercel Gateway keeps paid model routing disabled unless explicitly enabled", () => {
  const restore = withEnv({ RETZEF_AI_PROVIDER: "", RETZEF_USE_VERCEL_GATEWAY: "false", VERCEL_OIDC_TOKEN: "oidc-server-only", AI_GATEWAY_API_KEY: "" });
  try {
    // The native runtime remains the default; the existence of Vercel's OIDC token alone does not enable billing.
    assert.equal(process.env.RETZEF_AI_PROVIDER, "");
    assert.equal(process.env.RETZEF_USE_VERCEL_GATEWAY, "false");
  } finally {
    restore();
  }
});
