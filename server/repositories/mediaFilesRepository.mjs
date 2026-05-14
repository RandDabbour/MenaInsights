import { execute, query } from "../db/connection.mjs";
import { sqlToIso, toSqlDateTime } from "../utils/datetime.mjs";

function mapMediaRow(row) {
  if (!row) {
    return null;
  }
  return {
    id: String(row.id),
    fileName: String(row.file_name || ""),
    originalUrl: String(row.original_url || ""),
    mimeType: row.mime_type ? String(row.mime_type) : null,
    sizeBytes: row.size_bytes === null || row.size_bytes === undefined ? null : Number(row.size_bytes),
    altText: row.alt_text ? String(row.alt_text) : null,
    createdByUserId: row.created_by_user_id ? String(row.created_by_user_id) : null,
    createdAt: sqlToIso(row.created_at),
    updatedAt: sqlToIso(row.updated_at),
  };
}

export async function listMediaFiles(limit = 100) {
  const rows = await query(
    `SELECT * FROM media_files ORDER BY created_at DESC LIMIT ?`,
    [Math.max(1, Math.min(500, Number(limit) || 100))],
  );
  return rows.map(mapMediaRow);
}

export async function upsertMediaFile(file) {
  await execute(
    `INSERT INTO media_files
      (id, file_name, original_url, mime_type, size_bytes, alt_text, created_by_user_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       file_name = VALUES(file_name),
       original_url = VALUES(original_url),
       mime_type = VALUES(mime_type),
       size_bytes = VALUES(size_bytes),
       alt_text = VALUES(alt_text),
       created_by_user_id = VALUES(created_by_user_id),
       updated_at = VALUES(updated_at)`,
    [
      file.id,
      file.fileName,
      file.originalUrl,
      file.mimeType || null,
      file.sizeBytes ?? null,
      file.altText || null,
      file.createdByUserId || null,
      toSqlDateTime(file.createdAt),
      toSqlDateTime(file.updatedAt),
    ],
  );
}
