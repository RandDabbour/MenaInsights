import { randomUUID } from "node:crypto";
import { execute, query } from "../db/connection.mjs";
import { sqlToIso, toSqlDateTime } from "../utils/datetime.mjs";

function mapAttachmentRow(row) {
  return {
    id: String(row.id),
    requestId: String(row.request_id),
    fileName: String(row.file_name || ""),
    filePath: String(row.file_path || ""),
    mimeType: String(row.mime_type || ""),
    sizeBytes: Number(row.size_bytes || 0),
    kind: String(row.kind || "delivered_report"),
    uploadedByUserId: row.uploaded_by_user_id ? String(row.uploaded_by_user_id) : null,
    createdAt: sqlToIso(row.created_at),
  };
}

export async function listAttachmentsByRequestId(requestId) {
  const rows = await query(
    `SELECT * FROM request_attachments WHERE request_id = ? ORDER BY created_at DESC`,
    [requestId],
  );
  return rows.map(mapAttachmentRow);
}

export async function createRequestAttachment(attachment) {
  const id = attachment.id || randomUUID();
  await execute(
    `INSERT INTO request_attachments
      (id, request_id, file_name, file_path, mime_type, size_bytes, kind, uploaded_by_user_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      attachment.requestId,
      attachment.fileName,
      attachment.filePath,
      attachment.mimeType,
      attachment.sizeBytes,
      attachment.kind || "delivered_report",
      attachment.uploadedByUserId || null,
      toSqlDateTime(attachment.createdAt),
    ],
  );
  const rows = await query(`SELECT * FROM request_attachments WHERE id = ? LIMIT 1`, [id]);
  return mapAttachmentRow(rows[0]);
}
