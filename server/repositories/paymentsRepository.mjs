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

function mapPaymentRow(row) {
  if (!row) {
    return null;
  }
  return {
    id: String(row.id),
    requestId: String(row.request_id),
    method: String(row.method || "paypal"),
    status: String(row.status || "pending"),
    amount: toNullableNumber(row.amount),
    currency: String(row.currency || "USD"),
    paypalOrderId: row.paypal_order_id ? String(row.paypal_order_id) : null,
    paypalCaptureId: row.paypal_capture_id ? String(row.paypal_capture_id) : null,
    rawProviderResponse: parseJsonSafe(row.raw_provider_response, null),
    createdAt: sqlToIso(row.created_at),
    updatedAt: sqlToIso(row.updated_at),
  };
}

export async function findPaymentByRequestId(requestId) {
  const rows = await repoQuery(null, `SELECT * FROM payments WHERE request_id = ? LIMIT 1`, [requestId]);
  return mapPaymentRow(rows[0]);
}

export async function findPaymentByPaypalOrderId(paypalOrderId) {
  const rows = await repoQuery(null, `SELECT * FROM payments WHERE paypal_order_id = ? LIMIT 1`, [paypalOrderId]);
  return mapPaymentRow(rows[0]);
}

export async function findPaymentByPaypalCaptureId(paypalCaptureId) {
  const rows = await repoQuery(null, `SELECT * FROM payments WHERE paypal_capture_id = ? LIMIT 1`, [paypalCaptureId]);
  return mapPaymentRow(rows[0]);
}

export async function upsertPayment(connection, paymentRecord) {
  const existing = await repoQuery(connection, `SELECT id FROM payments WHERE request_id = ? LIMIT 1`, [
    paymentRecord.requestId,
  ]);
  const now = toSqlDateTime(paymentRecord.updatedAt);
  const rawProviderResponse = paymentRecord.rawProviderResponse
    ? JSON.stringify(paymentRecord.rawProviderResponse)
    : null;

  if (existing.length === 0) {
    await repoExecute(
      connection,
      `INSERT INTO payments
        (id, request_id, method, status, amount, currency, paypal_order_id, paypal_capture_id, raw_provider_response, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        paymentRecord.id || randomUUID(),
        paymentRecord.requestId,
        paymentRecord.method || "paypal",
        paymentRecord.status || "pending",
        paymentRecord.amount ?? null,
        paymentRecord.currency || "USD",
        paymentRecord.paypalOrderId || null,
        paymentRecord.paypalCaptureId || null,
        rawProviderResponse,
        toSqlDateTime(paymentRecord.createdAt || paymentRecord.updatedAt),
        now,
      ],
    );
    return;
  }

  await repoExecute(
    connection,
    `UPDATE payments
       SET method = ?,
           status = ?,
           amount = ?,
           currency = ?,
           paypal_order_id = ?,
           paypal_capture_id = ?,
           raw_provider_response = ?,
           updated_at = ?
     WHERE request_id = ?`,
    [
      paymentRecord.method || "paypal",
      paymentRecord.status || "pending",
      paymentRecord.amount ?? null,
      paymentRecord.currency || "USD",
      paymentRecord.paypalOrderId || null,
      paymentRecord.paypalCaptureId || null,
      rawProviderResponse,
      now,
      paymentRecord.requestId,
    ],
  );
}
