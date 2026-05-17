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

export async function listPaymentEventsForAdmin(limit = 200) {
  const safeLimit = Number.isFinite(Number(limit)) ? Math.max(1, Math.min(1000, Number(limit))) : 200;
  const rows = await repoQuery(
    null,
    `SELECT
        pe.*,
        sr.topic AS request_topic,
        sr.requester_name,
        sr.requester_email,
        sr.status AS request_status,
        p.method AS payment_method,
        p.paypal_order_id,
        p.paypal_capture_id
      FROM payment_events pe
      LEFT JOIN service_requests sr ON sr.id = pe.request_id
      LEFT JOIN payments p ON p.id = pe.payment_id
      ORDER BY pe.created_at DESC
      LIMIT ?`,
    [safeLimit],
  );

  return rows.map((row) => ({
    ...mapPaymentEventRow(row),
    requestTopic: row.request_topic ? String(row.request_topic) : "",
    requesterName: row.requester_name ? String(row.requester_name) : "",
    requesterEmail: row.requester_email ? String(row.requester_email).toLowerCase() : "",
    requestStatus: row.request_status ? String(row.request_status) : "",
    paymentMethod: row.payment_method ? String(row.payment_method) : "paypal",
    paypalOrderId: row.paypal_order_id ? String(row.paypal_order_id) : null,
    paypalCaptureId: row.paypal_capture_id ? String(row.paypal_capture_id) : null,
  }));
}
