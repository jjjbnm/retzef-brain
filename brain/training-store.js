import { randomBytes } from "node:crypto";
import { neon } from "@neondatabase/serverless";

let sqlClient;
let schemaPromise;

function database() {
  if (!process.env.DATABASE_URL) throw new Error("Training storage is not configured.");
  if (!sqlClient) sqlClient = neon(process.env.DATABASE_URL);
  return sqlClient;
}

async function ensureSchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      const sql = database();
      await sql`
        CREATE TABLE IF NOT EXISTS retzef_training_examples (
          id TEXT PRIMARY KEY,
          key_id TEXT NOT NULL,
          owner_id TEXT NOT NULL,
          model TEXT NOT NULL,
          input TEXT NOT NULL,
          expected_output TEXT NOT NULL,
          created_at BIGINT NOT NULL
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS retzef_training_examples_key_model_idx ON retzef_training_examples (key_id, model, created_at DESC)`;
      await sql`
        CREATE TABLE IF NOT EXISTS retzef_model_weights (
          key_id TEXT NOT NULL,
          owner_id TEXT NOT NULL,
          model TEXT NOT NULL,
          weights JSONB NOT NULL,
          training_examples INTEGER NOT NULL DEFAULT 0,
          updated_at BIGINT NOT NULL,
          PRIMARY KEY (key_id, model)
        )
      `;
    })().catch((error) => {
      schemaPromise = undefined;
      throw error;
    });
  }
  await schemaPromise;
  return database();
}

export async function addTrainingExample({ keyId, ownerId, model, input, expectedOutput }) {
  const sql = await ensureSchema();
  const id = randomBytes(12).toString("hex");
  const createdAt = Date.now();
  await sql`
    INSERT INTO retzef_training_examples (id, key_id, owner_id, model, input, expected_output, created_at)
    VALUES (${id}, ${keyId}, ${ownerId}, ${model}, ${input}, ${expectedOutput}, ${createdAt})
  `;
  return { id, createdAt };
}

export async function listTrainingExamples(keyId, model, limit = 8) {
  const sql = await ensureSchema();
  const rows = await sql`
    SELECT input, expected_output AS "expectedOutput"
    FROM retzef_training_examples
    WHERE key_id = ${keyId} AND model = ${model}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  return rows.reverse();
}

export async function saveModelWeights({ keyId, ownerId, model, weights, trainingExamples }) {
  const sql = await ensureSchema();
  const updatedAt = Date.now();
  await sql`
    INSERT INTO retzef_model_weights (key_id, owner_id, model, weights, training_examples, updated_at)
    VALUES (${keyId}, ${ownerId}, ${model}, ${JSON.stringify(weights)}::jsonb, ${trainingExamples}, ${updatedAt})
    ON CONFLICT (key_id, model) DO UPDATE SET
      owner_id = EXCLUDED.owner_id,
      weights = EXCLUDED.weights,
      training_examples = EXCLUDED.training_examples,
      updated_at = EXCLUDED.updated_at
  `;
  return { updatedAt, trainingExamples };
}

export async function getModelWeights(keyId, model) {
  const sql = await ensureSchema();
  const rows = await sql`
    SELECT weights, training_examples AS "trainingExamples", updated_at AS "updatedAt"
    FROM retzef_model_weights
    WHERE key_id = ${keyId} AND model = ${model}
    LIMIT 1
  `;
  return rows[0] || null;
}

export async function getTrainingStatus(keyId, model) {
  const sql = await ensureSchema();
  const rows = await sql`
    SELECT COUNT(*)::int AS "exampleCount"
    FROM retzef_training_examples
    WHERE key_id = ${keyId} AND model = ${model}
  `;
  const saved = await getModelWeights(keyId, model);
  return {
    exampleCount: Number(rows[0]?.exampleCount || 0),
    trained: Boolean(saved),
    trainingExamples: Number(saved?.trainingExamples || 0),
    updatedAt: saved?.updatedAt ? Number(saved.updatedAt) : null
  };
}
