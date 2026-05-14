import { repoExecute, repoQuery } from "./_shared.mjs";
import { sqlToIso, toSqlDateTime } from "../utils/datetime.mjs";

function toNullableString(value, fallback = "") {
  const next = String(value ?? fallback).trim();
  return next || null;
}

function toNullableNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

export function mapServiceRequestRow(row) {
  if (!row) {
    return null;
  }
  const proposalPrice = toNullableNumber(row.proposal_price);
  return {
    id: String(row.id),
    accessToken: String(row.access_token),
    status: String(row.status),
    name: String(row.requester_name),
    email: String(row.requester_email).toLowerCase(),
    organization: String(row.organization || ""),
    service: String(row.service || ""),
    region: String(row.region || ""),
    topic: String(row.topic || ""),
    urgency: String(row.urgency || ""),
    description: String(row.description || ""),
    budget: String(row.budget || ""),
    proposal:
      proposalPrice === null
        ? null
        : {
            price: proposalPrice,
            currency: String(row.proposal_currency || "USD"),
            timeline: String(row.proposal_timeline || ""),
            notes: String(row.proposal_notes || ""),
            proposedAt: sqlToIso(row.proposed_at),
          },
    createdAt: sqlToIso(row.created_at),
    updatedAt: sqlToIso(row.updated_at),
  };
}

export async function insertServiceRequest(connection, requestRecord) {
  await repoExecute(
    connection,
    `INSERT INTO service_requests (
      id, access_token, requester_name, requester_email, organization,
      service, region, topic, urgency, description, budget, status,
      proposal_price, proposal_currency, proposal_timeline, proposal_notes, proposed_at,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      requestRecord.id,
      requestRecord.accessToken,
      requestRecord.name,
      String(requestRecord.email || "").toLowerCase(),
      toNullableString(requestRecord.organization, ""),
      requestRecord.service,
      requestRecord.region,
      requestRecord.topic,
      toNullableString(requestRecord.urgency, ""),
      requestRecord.description,
      toNullableString(requestRecord.budget, ""),
      requestRecord.status,
      requestRecord.proposal?.price ?? null,
      requestRecord.proposal?.currency || "USD",
      toNullableString(requestRecord.proposal?.timeline, ""),
      toNullableString(requestRecord.proposal?.notes, ""),
      toSqlDateTime(requestRecord.proposal?.proposedAt || null),
      toSqlDateTime(requestRecord.createdAt),
      toSqlDateTime(requestRecord.updatedAt),
    ],
  );
}

export async function findServiceRequestByAccessToken(accessToken) {
  const rows = await repoQuery(
    null,
    `SELECT * FROM service_requests WHERE access_token = ? LIMIT 1`,
    [accessToken],
  );
  return mapServiceRequestRow(rows[0]);
}

export async function findServiceRequestById(requestId) {
  const rows = await repoQuery(null, `SELECT * FROM service_requests WHERE id = ? LIMIT 1`, [requestId]);
  return mapServiceRequestRow(rows[0]);
}

export async function listServiceRequestsSummary() {
  const rows = await repoQuery(
    null,
    `SELECT id, requester_name, requester_email, topic, service, status, created_at, updated_at, proposal_price
     FROM service_requests
     ORDER BY created_at DESC`,
  );

  return rows.map((row) => ({
    id: String(row.id),
    name: String(row.requester_name),
    email: String(row.requester_email).toLowerCase(),
    topic: String(row.topic || ""),
    service: String(row.service || ""),
    status: String(row.status || ""),
    createdAt: sqlToIso(row.created_at),
    updatedAt: sqlToIso(row.updated_at),
    proposalPrice: toNullableNumber(row.proposal_price),
  }));
}

export async function updateServiceRequest(connection, requestRecord) {
  await repoExecute(
    connection,
    `UPDATE service_requests
       SET status = ?,
           proposal_price = ?,
           proposal_currency = ?,
           proposal_timeline = ?,
           proposal_notes = ?,
           proposed_at = ?,
           updated_at = ?
     WHERE id = ?`,
    [
      requestRecord.status,
      requestRecord.proposal?.price ?? null,
      requestRecord.proposal?.currency || "USD",
      toNullableString(requestRecord.proposal?.timeline, ""),
      toNullableString(requestRecord.proposal?.notes, ""),
      toSqlDateTime(requestRecord.proposal?.proposedAt || null),
      toSqlDateTime(requestRecord.updatedAt),
      requestRecord.id,
    ],
  );
}
