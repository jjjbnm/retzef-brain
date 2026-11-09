# Retzef native model training API

Retzef model training is independent from Gemini. The API key's assigned Retzef model is trained using Retzef's own model implementation and stored weights. Gemini credentials are not used for training or inference on this API route.

## Teach a model

`POST /api/v1/training/teach`

Headers:

```http
Authorization: Bearer rzf_live_...
Content-Type: application/json
```

Body:

```json
{
  "input": "What is Retzef Brain?",
  "expected_output": "Retzef Brain is Retzef's native AI model studio."
}
```

Both fields are required and limited to 500 characters. Each API key is isolated: examples and trained weights are scoped to that key and its assigned model.

## Training status

`GET /api/v1/training/status`

Uses the same Bearer API key and returns example count, whether trained weights exist, and the last training timestamp.

## Chat with the trained model

Use `POST /api/v1/chat` with the same API key. When trained weights exist, Retzef loads those weights for that key. Otherwise it uses the built-in Retzef model.

Training currently updates a compact native neural or n-gram model. It is genuine Retzef-side training, but these small models are experimental and are not comparable in capability to large hosted language models.
