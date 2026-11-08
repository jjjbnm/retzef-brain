# Retzef Brain

Retzef Brain is an experimental model-independent AI orchestration layer plus a small from-scratch Hebrew text model.

## Custom instructions

Pass a `customInstructions` string to `brain.respond()`. Retzef Brain appends it to the system message and forwards that message to the selected model adapter. This works across providers when their adapter supports the standard `system`, `user`, and `assistant` message roles. Provider APIs differ, so each adapter must map the system message to the provider's equivalent instruction field.

Example:
```js
await brain.respond({
  conversationId: "chat-1",
  message: "שלום",
  customInstructions: "ענה בעברית, בקצרה ובטון ידידותי."
});
```

Custom instructions are preferences, not a way to override higher-priority safety or system rules. The app must pass the user's saved instructions on each request. Keep provider API keys on the server.

## Run

Node.js 20+: `npm test`, `npm run train`, `npm run chat`.

The tiny N-gram model is an educational prototype, not a ChatGPT-level model. The custom-instructions feature is implemented in the orchestration layer and tested with a mock adapter; provider compatibility must be verified separately.
