import { repoExecute, repoQuery } from "./_shared.mjs";
import { sqlToIso, toSqlDateTime } from "../utils/datetime.mjs";

function mapMessageRow(row) {
  return {
    id: String(row.id),
    requestId: String(row.request_id),
    authorRole: String(row.author_role),
    body: String(row.body || ""),
    createdAt: sqlToIso(row.created_at),
  };
}

export async function listMessagesByRequestId(requestId) {
  const rows = await repoQuery(
    null,
    `SELECT id, request_id, author_role, body, created_at
       FROM request_messages
      WHERE request_id = ?
      ORDER BY created_at ASC`,
    [requestId],
  );
  return rows.map(mapMessageRow);
}

export async function insertMessage(connection, messageRecord) {
  await repoExecute(
    connection,
    `INSERT INTO request_messages (id, request_id, author_role, body, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [
      messageRecord.id,
      messageRecord.requestId,
      messageRecord.authorRole,
      messageRecord.body,
      toSqlDateTime(messageRecord.createdAt),
    ],
  );
}
