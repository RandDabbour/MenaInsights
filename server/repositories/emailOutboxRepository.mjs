import { randomUUID } from "node:crypto";
import { execute, query } from "../db/connection.mjs";
import { sqlToIso, toSqlDateTime } from "../utils/datetime.mjs";

function parseMetadata(value) {
  if (!value) {
    return {};
  }
  if (typeof value === "object") {
    return value;
  }
  try {
    return JSON.parse(String(value));
  } catch {
    return {};
  }
}

function mapOutboxRow(row) {
  return {
    id: String(row.id),
    to: String(row.recipient_email),
    subject: String(row.subject || ""),
    text: row.text_body ? String(row.text_body) : "",
    html: row.html_body ? String(row.html_body) : "",
    metadata: parseMetadata(row.metadata_json),
    queuedAt: sqlToIso(row.queued_at),
    sentAt: row.sent_at ? sqlToIso(row.sent_at) : null,
    status: String(row.status || "queued"),
    error: row.error_message ? String(row.error_message) : null,
  };
}

export async function enqueueEmail(item) {
  const id = item.id || randomUUID();
  await execute(
    `INSERT INTO email_outbox
      (id, recipient_email, subject, text_body, html_body, metadata_json, queued_at, sent_at, status, error_message)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      item.to,
      item.subject,
      item.text || null,
      item.html || null,
      JSON.stringify(item.metadata || {}),
      toSqlDateTime(item.queuedAt),
      toSqlDateTime(item.sentAt || null),
      item.status || "queued",
      item.error || null,
    ],
  );
  return { ...item, id };
}

export async function updateEmailStatus({ id, status, sentAt, error }) {
  await execute(
    `UPDATE email_outbox
       SET status = ?, sent_at = ?, error_message = ?
     WHERE id = ?`,
    [status, toSqlDateTime(sentAt || null), error || null, id],
  );
}

export async function listRecentEmails(limit = 100) {
  const rows = await query(
    `SELECT * FROM email_outbox ORDER BY queued_at DESC LIMIT ?`,
    [Math.max(1, Math.min(500, Number(limit) || 100))],
  );
  return rows.map(mapOutboxRow);
}
