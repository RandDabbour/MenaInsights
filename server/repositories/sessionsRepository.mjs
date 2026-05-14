import { execute, query } from "../db/connection.mjs";
import { sqlToIso, toSqlDateTime } from "../utils/datetime.mjs";

function mapSessionRow(row) {
  if (!row) {
    return null;
  }
  return {
    id: String(row.id),
    userId: String(row.user_id),
    tokenHash: String(row.token_hash),
    createdAt: sqlToIso(row.created_at),
    expiresAt: sqlToIso(row.expires_at),
  };
}

export async function createSession(session) {
  await execute(
    `INSERT INTO user_sessions (id, user_id, token_hash, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?)`,
    [
      session.id,
      session.userId,
      session.tokenHash,
      toSqlDateTime(session.createdAt),
      toSqlDateTime(session.expiresAt),
    ],
  );
}

export async function findSessionByTokenHash(tokenHash) {
  const rows = await query(`SELECT * FROM user_sessions WHERE token_hash = ? LIMIT 1`, [tokenHash]);
  return mapSessionRow(rows[0]);
}

export async function deleteSessionByTokenHash(tokenHash) {
  await execute(`DELETE FROM user_sessions WHERE token_hash = ?`, [tokenHash]);
}

export async function deleteSessionsForUserExceptTokenHash(userId, keepTokenHash = "") {
  if (keepTokenHash) {
    await execute(`DELETE FROM user_sessions WHERE user_id = ? AND token_hash <> ?`, [userId, keepTokenHash]);
    return;
  }
  await execute(`DELETE FROM user_sessions WHERE user_id = ?`, [userId]);
}

export async function deleteExpiredSessions() {
  await execute(`DELETE FROM user_sessions WHERE expires_at <= ?`, [toSqlDateTime(new Date().toISOString())]);
}
