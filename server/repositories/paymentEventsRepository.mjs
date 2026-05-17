import { randomUUID } from "node:crypto";
import { repoExecute, repoQuery } from "./_shared.mjs";
import { sqlToIso, toSqlDateTime } from "../utils/datetime.mjs";

function toNullableNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function parseJsonSafe(value, fallback = null) {
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

function mapPaymentEventRow(row) {
  if (!row) {
    return null;
  }
  return {
    id: String(row.id),
    paymentId: String(row.payment_id),
    requestId: String(row.request_id),
    status: String(row.status),
    eventType: String(row.event_type),
    eventNote: row.event_note ? String(row.event_note) : "",
    providerEventId: row.provider_event_id ? String(row.provider_event_id) : null,
    providerPayload: parseJsonSafe(row.provider_payload, null),
    amount: toNullableNumber(row.amount),
    currency: row.currency ? String(row.currency) : null,
    createdAt: sqlToIso(row.created_at),
    updatedAt: sqlToIso(row.updated_at),
  };
}

export async function listPaymentEventsByRequestId(requestId) {
  const rows = await repoQuery(
    null,
    `SELECT *
       FROM payment_events
      WHERE request_id = ?
      ORDER BY created_at ASC`,
    [requestId],
  );
  return rows.map(mapPaymentEventRow).filter(Boolean);
}

export async function createPaymentEvent(connection, eventRecord) {
  const payload = eventRecord.providerPayload ? JSON.stringify(eventRecord.providerPayload) : null;
  await repoExecute(
    connection,
    `INSERT INTO payment_events
      (id, payment_id, request_id, status, event_type, event_note, provider_event_id, provider_payload, amount, currency, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      eventRecord.id || randomUUID(),
      eventRecord.paymentId,
      eventRecord.requestId,
      eventRecord.status,
      eventRecord.eventType,
      eventRecord.eventNote || null,
      eventRecord.providerEventId || null,
      payload,
      eventRecord.amount ?? null,
      eventRecord.currency || null,
      toSqlDateTime(eventRecord.createdAt),
      toSqlDateTime(eventRecord.updatedAt || eventRecord.createdAt),
    ],
  );
}
