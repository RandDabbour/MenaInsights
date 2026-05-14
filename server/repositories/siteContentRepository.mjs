import { execute, query } from "../db/connection.mjs";
import { sqlToIso, toSqlDateTime } from "../utils/datetime.mjs";

const GLOBAL_CONTENT_KEY = "global";

function parseJsonSafely(value, fallback = {}) {
  if (!value) {
    return fallback;
  }
  if (typeof value === "object") {
    return value;
  }
  try {
    return JSON.parse(String(value));
  } catch {
    return fallback;
  }
}

export async function getGlobalSiteContent() {
  const rows = await query(`SELECT * FROM site_content WHERE content_key = ? LIMIT 1`, [GLOBAL_CONTENT_KEY]);
  const row = rows[0];
  if (!row) {
    return null;
  }

  const parsed = parseJsonSafely(row.content_json, {});
  return {
    contentKey: String(row.content_key),
    contentType: String(row.content_type || "json"),
    data: parsed,
    updatedByUserId: row.updated_by_user_id ? String(row.updated_by_user_id) : null,
    createdAt: sqlToIso(row.created_at),
    updatedAt: sqlToIso(row.updated_at),
  };
}

export async function upsertGlobalSiteContent({ data, updatedByUserId, updatedAt }) {
  const now = toSqlDateTime(updatedAt);
  const payload = JSON.stringify(data || {});
  await execute(
    `INSERT INTO site_content (content_key, content_type, content_text, content_json, updated_by_user_id, created_at, updated_at)
     VALUES (?, 'json', NULL, CAST(? AS JSON), ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       content_type = VALUES(content_type),
       content_text = VALUES(content_text),
       content_json = VALUES(content_json),
       updated_by_user_id = VALUES(updated_by_user_id),
       updated_at = VALUES(updated_at)`,
    [GLOBAL_CONTENT_KEY, payload, updatedByUserId || null, now, now],
  );
}
