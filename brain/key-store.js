import { createHash, randomBytes } from "node:crypto";
import { neon } from "@neondatabase/serverless";

const TTL_SECONDS = 60 * 60 * 24 * 90;
let sqlClient;
let schemaPromise;

function database() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("API key storage is not configured. Set DATABASE_URL in the Vercel project.");
  if (!sqlClient) sqlClient = neon(url);
  return sqlClient;
}

async function ensureSchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      const sql = database();
      await sql`
        CREATE TABLE IF NOT EXISTS retzef_api_keys (
          key_hash TEXT PRIMARY KEY,
          id TEXT NOT NULL UNIQUE,
          owner_id TEXT NOT NULL,
          name TEXT NOT NULL,
          model TEXT NOT NULL DEFAULT 'retzef-code',
          created_at BIGINT NOT NULL,
          expires_at BIGINT NOT NULL,
          last4 TEXT NOT NULL,
          prefix TEXT NOT NULL DEFAULT 'rzf_live_'
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS retzef_api_keys_owner_created_idx ON retzef_api_keys (owner_id, created_at DESC)`;
      await sql`CREATE INDEX IF NOT EXISTS retzef_api_keys_expiry_idx ON retzef_api_keys (expires_at)`;
    })().catch((error) => {
      schemaPromise = undefined;
      throw error;
    });
  }
  await schemaPromise;
  return database();
}

const hashKey = (key) => createHash("sha256").update(key).digest("hex");

export function validOwnerId(value) {
  return typeof value === "string" && /^[a-zA-Z0-9_-]{16,80}$/.test(value);
}

function publicRecord(row) {
  return {
    id: row.id,
    name: row.name,
    model: row.model || "retzef-code",
    createdAt: Number(row.created_at),
    expiresAt: Number(row.expires_at),
    last4: row.last4,
    prefix: row.prefix || "rzf_live_"
  };
}

export async function createApiKey(ownerId, name, model = "retzef-code") {
  const sql = await ensureSchema();
  const id = randomBytes(10).toString("hex");
  const secret = "rzf_live_" + randomBytes(32).toString("hex");
  const createdAt = Date.now();
  const expiresAt = createdAt + TTL_SECONDS * 1000;
  const safeModel = typeof model === "string" && /^retzef-[a-z0-9-]{1,80}$/.test(model)
    ? model
    : "retzef-code";
  const record = {
    id,
    ownerId,
    name,
    model: safeModel,
    createdAt,
    expiresAt,
    last4: secret.slice(-4),
    prefix: "rzf_live_"
  };

  await sql`
    INSERT INTO retzef_api_keys
      (key_hash, id, owner_id, name, model, created_at, expires_at, last4, prefix)
    VALUES
      (${hashKey(secret)}, ${id}, ${ownerId}, ${name}, ${safeModel},
       ${createdAt}, ${expiresAt}, ${record.last4}, ${record.prefix})
  `;
  return { apiKey: secret, key: publicRecord({
    id: record.id, name: record.name, model: record.model,
    created_at: record.createdAt, expires_at: record.expiresAt,
    last4: record.last4, prefix: record.prefix
  }) };
}

export async function listApiKeys(ownerId) {
  const sql = await ensureSchema();
  const rows = await sql`
    SELECT id, name, model, created_at, expires_at, last4, prefix
    FROM retzef_api_keys
    WHERE owner_id = ${ownerId} AND expires_at > ${Date.now()}
    ORDER BY created_at DESC
  `;
  return rows.map(publicRecord);
}

export async function revokeApiKey(ownerId, id) {
  const sql = await ensureSchema();
  const rows = await sql`
    DELETE FROM retzef_api_keys
    WHERE owner_id = ${ownerId} AND id = ${id}
    RETURNING id
  `;
  return rows.length > 0;
}

export async function verifyApiKey(secret) {
  if (typeof secret !== "string" || !secret.startsWith("rzf_live_") || secret.length < 40) return null;
  const sql = await ensureSchema();
  const rows = await sql`
    SELECT id, owner_id, name, model, expires_at
    FROM retzef_api_keys
    WHERE key_hash = ${hashKey(secret)}
    LIMIT 1
  `;
  const row = rows[0];
  if (!row || !row.owner_id || Number(row.expires_at) <= Date.now()) return null;
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    model: row.model || "retzef-code"
  };
}

export async function claimLegacyApiKeys(legacyOwnerId, accountId) {
  const sql = await ensureSchema();
  const rows = await sql`UPDATE retzef_api_keys SET owner_id = ${accountId} WHERE owner_id = ${legacyOwnerId} RETURNING id`;
  return rows.length;
}
