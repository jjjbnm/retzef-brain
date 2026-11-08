import { createHash, randomBytes } from "node:crypto";

const PREFIX = "rb:api-key:";
const OWNER_PREFIX = "rb:owner:";
const TTL_SECONDS = 60 * 60 * 24 * 90;

function redisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error("API key storage is not configured. Connect Upstash Redis and set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.");
  return { url: url.replace(/\/$/, ""), token };
}

async function command(...args) {
  const { url, token } = redisConfig();
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify(args)
  });
  if (!response.ok) throw new Error("Redis request failed (" + response.status + ").");
  const data = await response.json();
  if (data.error) throw new Error("Redis command failed.");
  return data.result;
}

const hashKey = key => createHash("sha256").update(key).digest("hex");
const ownerSet = ownerId => OWNER_PREFIX + ownerId + ":keys";

export function validOwnerId(value) {
  return typeof value === "string" && /^[a-zA-Z0-9_-]{16,80}$/.test(value);
}

export async function createApiKey(ownerId, name) {
  const id = randomBytes(10).toString("hex");
  const secret = "rzf_live_" + randomBytes(32).toString("hex");
  const createdAt = Date.now();
  const record = { id, ownerId, name, createdAt, expiresAt: createdAt + TTL_SECONDS * 1000, last4: secret.slice(-4), prefix: "rzf_live_" };
  const hash = hashKey(secret);
  await command("SET", PREFIX + hash, JSON.stringify(record), "EX", String(TTL_SECONDS));
  await command("SADD", ownerSet(ownerId), hash);
  await command("EXPIRE", ownerSet(ownerId), String(TTL_SECONDS));
  return { apiKey: secret, key: { id, name, createdAt, expiresAt: record.expiresAt, last4: record.last4, prefix: record.prefix } };
}

export async function listApiKeys(ownerId) {
  const hashes = await command("SMEMBERS", ownerSet(ownerId)) || [];
  if (!hashes.length) return [];
  const records = await Promise.all(hashes.map(async hash => {
    const raw = await command("GET", PREFIX + hash);
    if (!raw) { await command("SREM", ownerSet(ownerId), hash); return null; }
    try {
      const r = JSON.parse(raw);
      return r.ownerId === ownerId ? { id: r.id, name: r.name, createdAt: r.createdAt, expiresAt: r.expiresAt, last4: r.last4, prefix: r.prefix } : null;
    } catch { return null; }
  }));
  return records.filter(Boolean).sort((a,b) => b.createdAt-a.createdAt);
}

export async function revokeApiKey(ownerId, id) {
  const hashes = await command("SMEMBERS", ownerSet(ownerId)) || [];
  for (const hash of hashes) {
    const raw = await command("GET", PREFIX + hash);
    if (!raw) { await command("SREM", ownerSet(ownerId), hash); continue; }
    try {
      const record = JSON.parse(raw);
      if (record.id === id && record.ownerId === ownerId) {
        await command("DEL", PREFIX + hash);
        await command("SREM", ownerSet(ownerId), hash);
        return true;
      }
    } catch {}
  }
  return false;
}

export async function verifyApiKey(secret) {
  if (typeof secret !== "string" || !secret.startsWith("rzf_live_") || secret.length < 40) return null;
  const raw = await command("GET", PREFIX + hashKey(secret));
  if (!raw) return null;
  try {
    const record = JSON.parse(raw);
    if (!record.ownerId || record.expiresAt <= Date.now()) return null;
    return { id: record.id, ownerId: record.ownerId, name: record.name };
  } catch { return null; }
}