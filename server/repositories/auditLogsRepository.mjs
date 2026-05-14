import { randomUUID } from "node:crypto";
import { execute } from "../db/connection.mjs";
import { nowIso, toSqlDateTime } from "../utils/datetime.mjs";

export async function createAuditLog(entry) {
  await execute(
    `INSERT INTO audit_logs
      (id, actor_user_id, action, entity_type, entity_id, metadata_json, ip_address, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      entry.id || randomUUID(),
      entry.actorUserId || null,
      entry.action,
      entry.entityType,
      entry.entityId || null,
      JSON.stringify(entry.metadata || {}),
      entry.ipAddress || null,
      toSqlDateTime(entry.createdAt || nowIso()),
    ],
  );
}
