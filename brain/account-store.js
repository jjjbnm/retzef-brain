import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { neon } from "@neondatabase/serverless";

const scryptAsync = promisify(scrypt);
const SESSION_TTL = 30 * 24 * 60 * 60 * 1000;
let sqlClient;
let schemaPromise;
function database() {
  if (!process.env.DATABASE_URL) throw new Error("Account database is not configured. Set DATABASE_URL in Vercel.");
  if (!sqlClient) sqlClient = neon(process.env.DATABASE_URL);
  return sqlClient;
}
async function ensureSchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      const sql = database();
      await sql`CREATE TABLE IF NOT EXISTS retzef_accounts (
        id TEXT PRIMARY KEY, username TEXT NOT NULL, username_normalized TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL, password_salt TEXT NOT NULL, password_hash TEXT NOT NULL,
        created_at BIGINT NOT NULL
      )`;
      await sql`CREATE TABLE IF NOT EXISTS retzef_account_sessions (
        token_hash TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES retzef_accounts(id) ON DELETE CASCADE,
        created_at BIGINT NOT NULL, expires_at BIGINT NOT NULL
      )`;
      await sql`CREATE INDEX IF NOT EXISTS retzef_account_sessions_account_idx ON retzef_account_sessions(account_id)`;
      await sql`CREATE INDEX IF NOT EXISTS retzef_account_sessions_expiry_idx ON retzef_account_sessions(expires_at)`;
    })().catch((error) => { schemaPromise = undefined; throw error; });
  }
  await schemaPromise;
  return database();
}
const digest = (value) => createHash("sha256").update(value).digest("hex");
const publicUser = (row) => ({ id: row.id, username: row.username, displayName: row.display_name, createdAt: Number(row.created_at) });
export function validateUsername(value) { return typeof value === "string" && /^[a-zA-Z0-9_]{3,24}$/.test(value.trim()); }
export async function registerAccount({ username, displayName, password }) {
  const sql = await ensureSchema();
  const cleanUsername = username.trim();
  const normalized = cleanUsername.toLowerCase();
  const cleanDisplay = String(displayName || cleanUsername).trim().slice(0, 32);
  const salt = randomBytes(16);
  const passwordHash = await scryptAsync(password, salt, 64);
  const id = randomBytes(16).toString("hex");
  const createdAt = Date.now();
  try {
    const rows = await sql`INSERT INTO retzef_accounts (id, username, username_normalized, display_name, password_salt, password_hash, created_at)
      VALUES (${id}, ${cleanUsername}, ${normalized}, ${cleanDisplay}, ${salt.toString("hex")}, ${Buffer.from(passwordHash).toString("hex")}, ${createdAt})
      RETURNING id, username, display_name, created_at`;
    return publicUser(rows[0]);
  } catch (error) {
    if (String(error?.code || "").includes("23505") || String(error?.message || "").toLowerCase().includes("unique")) {
      const conflict = new Error("שם המשתמש כבר תפוס. נסו שם אחר."); conflict.code = "USERNAME_TAKEN"; throw conflict;
    }
    throw error;
  }
}
export async function authenticateAccount(username, password) {
  const sql = await ensureSchema();
  const rows = await sql`SELECT id, username, display_name, created_at, password_salt, password_hash
    FROM retzef_accounts WHERE username_normalized = ${String(username).trim().toLowerCase()} LIMIT 1`;
  const row = rows[0];
  if (!row) return null;
  const actual = Buffer.from(await scryptAsync(password, Buffer.from(row.password_salt, "hex"), 64));
  const expected = Buffer.from(row.password_hash, "hex");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  return publicUser(row);
}
export async function createAccountSession(accountId) {
  const sql = await ensureSchema();
  const token = randomBytes(32).toString("base64url");
  const createdAt = Date.now();
  const expiresAt = createdAt + SESSION_TTL;
  await sql`INSERT INTO retzef_account_sessions (token_hash, account_id, created_at, expires_at)
    VALUES (${digest(token)}, ${accountId}, ${createdAt}, ${expiresAt})`;
  return { token, expiresAt };
}
export async function getAccountSession(token) {
  if (typeof token !== "string" || token.length < 30 || token.length > 100) return null;
  const sql = await ensureSchema();
  const rows = await sql`SELECT a.id, a.username, a.display_name, a.created_at
    FROM retzef_account_sessions s JOIN retzef_accounts a ON a.id = s.account_id
    WHERE s.token_hash = ${digest(token)} AND s.expires_at > ${Date.now()} LIMIT 1`;
  return rows[0] ? publicUser(rows[0]) : null;
}
export async function deleteAccountSession(token) {
  if (typeof token !== "string" || !token) return;
  const sql = await ensureSchema();
  await sql`DELETE FROM retzef_account_sessions WHERE token_hash = ${digest(token)}`;
}
export function readSessionCookie(req) {
  const cookies = String(req.headers.cookie || "").split(";");
  const entry = cookies.map((part) => part.trim()).find((part) => part.startsWith("retzef_session="));
  if (!entry) return null;
  try { return decodeURIComponent(entry.slice("retzef_session=".length)); } catch { return null; }
}
export async function getAccountFromRequest(req) {
  const token = readSessionCookie(req);
  return token ? getAccountSession(token) : null;
}
export function sessionCookie(token, maxAge = 30 * 24 * 60 * 60) {
  return `retzef_session=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}
