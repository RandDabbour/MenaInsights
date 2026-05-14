import { randomBytes, randomUUID } from "node:crypto";
import { withTransaction } from "../db/connection.mjs";
import {
  findServiceRequestByAccessToken,
  findServiceRequestById,
  insertServiceRequest,
  listServiceRequestsSummary,
  updateServiceRequest,
} from "../repositories/serviceRequestsRepository.mjs";
import { insertMessage, listMessagesByRequestId } from "../repositories/messagesRepository.mjs";
import {
  findPaymentByPaypalCaptureId,
  findPaymentByPaypalOrderId,
  findPaymentByRequestId,
  upsertPayment,
} from "../repositories/paymentsRepository.mjs";
import {
  createRequestAttachment,
  listAttachmentsByRequestId,
} from "../repositories/requestAttachmentsRepository.mjs";
import { NotFoundError, ValidationError } from "../lib/errors.mjs";
import { nowIso } from "../utils/datetime.mjs";
import { normalizeCurrencyCode } from "../validation/inputValidation.mjs";

export const REQUEST_STATUS = {
  SUBMITTED: "submitted",
  PROPOSAL_SENT: "proposal_sent",
  NEGOTIATION_REQUESTED: "negotiation_requested",
  PROPOSAL_UPDATED: "proposal_updated",
  ACCEPTED_PENDING_PAYMENT: "accepted_pending_payment",
  PAID: "paid",
  REJECTED: "rejected",
};

export const MUTABLE_STATUSES = new Set([
  REQUEST_STATUS.SUBMITTED,
  REQUEST_STATUS.PROPOSAL_SENT,
  REQUEST_STATUS.NEGOTIATION_REQUESTED,
  REQUEST_STATUS.PROPOSAL_UPDATED,
  REQUEST_STATUS.ACCEPTED_PENDING_PAYMENT,
  REQUEST_STATUS.PAID,
  REQUEST_STATUS.REJECTED,
]);

export const PAYMENT_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  CAPTURED: "captured",
  FAILED: "failed",
  REFUNDED: "refunded",
};

function randomToken(bytes = 20) {
  return randomBytes(bytes).toString("hex");
}

function createFallbackPayment() {
  return {
    id: randomUUID(),
    requestId: "",
    method: "paypal",
    status: PAYMENT_STATUS.PENDING,
    amount: null,
    currency: "USD",
    paypalOrderId: null,
    paypalCaptureId: null,
    rawProviderResponse: null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
}

function toMessagePayload(messageRecord) {
  return {
    id: messageRecord.id,
    authorRole: messageRecord.authorRole,
    body: messageRecord.body,
    createdAt: messageRecord.createdAt,
  };
}

function buildProposalFromInput(input, timestamp = nowIso()) {
  return {
    price: Number(input.price),
    currency: normalizeCurrencyCode(input.currency || "USD"),
    timeline: String(input.timeline || "").trim(),
    notes: String(input.notes || "").trim(),
    proposedAt: timestamp,
  };
}

function sanitizePublicRequest(requestRecord) {
  return {
    id: requestRecord.id,
    status: requestRecord.status,
    createdAt: requestRecord.createdAt,
    updatedAt: requestRecord.updatedAt,
    request: {
      name: requestRecord.name,
      email: requestRecord.email,
      organization: requestRecord.organization,
      service: requestRecord.service,
      region: requestRecord.region,
      topic: requestRecord.topic,
      urgency: requestRecord.urgency,
      description: requestRecord.description,
      budget: requestRecord.budget,
    },
    proposal: requestRecord.proposal,
    payment: requestRecord.payment,
    messages: requestRecord.messages,
  };
}

async function loadRequestDetails(requestRecord) {
  if (!requestRecord) {
    return null;
  }

  const [messages, payment, attachments] = await Promise.all([
    listMessagesByRequestId(requestRecord.id),
    findPaymentByRequestId(requestRecord.id),
    listAttachmentsByRequestId(requestRecord.id),
  ]);

  return {
    ...requestRecord,
    payment: payment || {
      ...createFallbackPayment(),
      requestId: requestRecord.id,
    },
    messages: messages.map(toMessagePayload),
    attachments,
  };
}

function applyPaymentProposalDefaults(requestRecord, updatedAt) {
  requestRecord.payment.method = "paypal";
  requestRecord.payment.status = PAYMENT_STATUS.PENDING;
  requestRecord.payment.amount = requestRecord.proposal?.price ?? null;
  requestRecord.payment.currency = normalizeCurrencyCode(requestRecord.proposal?.currency || "USD");
  requestRecord.payment.paypalOrderId = null;
  requestRecord.payment.paypalCaptureId = null;
  requestRecord.payment.rawProviderResponse = null;
  requestRecord.payment.updatedAt = updatedAt;
}

export async function getRequestByAccessToken(accessToken) {
  const requestRecord = await findServiceRequestByAccessToken(accessToken);
  if (!requestRecord) {
    throw new NotFoundError("Request not found");
  }
  return loadRequestDetails(requestRecord);
}

export async function getRequestById(requestId) {
  const requestRecord = await findServiceRequestById(requestId);
  if (!requestRecord) {
    throw new NotFoundError("Request not found");
  }
  return loadRequestDetails(requestRecord);
}

export async function listRequestsSummary() {
  return listServiceRequestsSummary();
}

export async function createRequest({ form }) {
  const createdAt = nowIso();
  const requestRecord = {
    id: randomUUID(),
    accessToken: randomToken(20),
    status: REQUEST_STATUS.SUBMITTED,
    name: form.name,
    email: form.email,
    organization: form.organization,
    service: form.service,
    region: form.region,
    topic: form.topic,
    urgency: form.urgency,
    description: form.description,
    budget: form.budget,
    proposal: null,
    createdAt,
    updatedAt: createdAt,
  };

  await withTransaction(async (connection) => {
    await insertServiceRequest(connection, requestRecord);
    await upsertPayment(connection, {
      id: randomUUID(),
      requestId: requestRecord.id,
      method: "paypal",
      status: PAYMENT_STATUS.PENDING,
      amount: null,
      currency: "USD",
      paypalOrderId: null,
      paypalCaptureId: null,
      rawProviderResponse: null,
      createdAt,
      updatedAt: createdAt,
    });
  });

  return loadRequestDetails(requestRecord);
}

export async function applyPublicAction({ accessToken, action, message }) {
  const requestRecord = await getRequestByAccessToken(accessToken);
  const updatedAt = nowIso();

  if (action === "accept") {
    if (!requestRecord.proposal) {
      throw new ValidationError("No proposal available to accept yet");
    }
    requestRecord.status = REQUEST_STATUS.ACCEPTED_PENDING_PAYMENT;
    requestRecord.payment.amount = requestRecord.proposal.price;
    requestRecord.payment.currency = normalizeCurrencyCode(requestRecord.proposal.currency || "USD");
  } else if (action === "reject") {
    requestRecord.status = REQUEST_STATUS.REJECTED;
  } else if (action === "negotiate") {
    requestRecord.status = REQUEST_STATUS.NEGOTIATION_REQUESTED;
  } else {
    throw new ValidationError("Invalid action");
  }

  requestRecord.updatedAt = updatedAt;

  await withTransaction(async (connection) => {
    await updateServiceRequest(connection, requestRecord);
    await upsertPayment(connection, {
      ...requestRecord.payment,
      requestId: requestRecord.id,
      updatedAt,
    });

    if (action === "negotiate") {
      await insertMessage(connection, {
        id: randomUUID(),
        requestId: requestRecord.id,
        authorRole: "user",
        body: message,
        createdAt: updatedAt,
      });
    }
  });

  return getRequestById(requestRecord.id);
}

export async function applyProposal({ requestId, proposal }) {
  const requestRecord = await getRequestById(requestId);
  const updatedAt = nowIso();

  requestRecord.proposal = buildProposalFromInput(proposal, updatedAt);
  requestRecord.status = REQUEST_STATUS.PROPOSAL_SENT;
  requestRecord.updatedAt = updatedAt;
  applyPaymentProposalDefaults(requestRecord, updatedAt);

  await withTransaction(async (connection) => {
    await updateServiceRequest(connection, requestRecord);
    await upsertPayment(connection, {
      ...requestRecord.payment,
      requestId: requestRecord.id,
      updatedAt,
    });

    if (requestRecord.proposal?.notes) {
      await insertMessage(connection, {
        id: randomUUID(),
        requestId: requestRecord.id,
        authorRole: "owner",
        body: requestRecord.proposal.notes,
        createdAt: updatedAt,
      });
    }
  });

  return getRequestById(requestId);
}

export async function applyOwnerMessage({ requestId, message }) {
  const requestRecord = await getRequestById(requestId);
  const updatedAt = nowIso();

  if (requestRecord.status === REQUEST_STATUS.NEGOTIATION_REQUESTED) {
    requestRecord.status = REQUEST_STATUS.PROPOSAL_UPDATED;
  }
  requestRecord.updatedAt = updatedAt;

  await withTransaction(async (connection) => {
    await updateServiceRequest(connection, requestRecord);
    await insertMessage(connection, {
      id: randomUUID(),
      requestId: requestRecord.id,
      authorRole: "owner",
      body: message,
      createdAt: updatedAt,
    });
  });

  return getRequestById(requestId);
}

export async function applyStatusUpdate({ requestId, nextStatus }) {
  const requestRecord = await getRequestById(requestId);
  requestRecord.status = nextStatus;
  requestRecord.updatedAt = nowIso();

  if (nextStatus === REQUEST_STATUS.PAID) {
    requestRecord.payment.status = PAYMENT_STATUS.CAPTURED;
  }

  await withTransaction(async (connection) => {
    await updateServiceRequest(connection, requestRecord);
    await upsertPayment(connection, {
      ...requestRecord.payment,
      requestId: requestRecord.id,
      updatedAt: requestRecord.updatedAt,
    });
  });

  return getRequestById(requestId);
}

export async function markPaymentPendingWithOrder({
  requestId,
  paypalOrderId,
  rawProviderResponse,
}) {
  const requestRecord = await getRequestById(requestId);
  requestRecord.payment.status = PAYMENT_STATUS.PENDING;
  requestRecord.payment.paypalOrderId = paypalOrderId || requestRecord.payment.paypalOrderId || null;
  requestRecord.payment.rawProviderResponse = rawProviderResponse || null;
  requestRecord.payment.updatedAt = nowIso();

  await withTransaction(async (connection) => {
    await upsertPayment(connection, {
      ...requestRecord.payment,
      requestId: requestRecord.id,
      updatedAt: requestRecord.payment.updatedAt,
    });
  });

  return getRequestById(requestId);
}

export async function markPaymentApproved({
  requestId,
  paypalOrderId,
  rawProviderResponse,
}) {
  const requestRecord = await getRequestById(requestId);
  requestRecord.payment.status = PAYMENT_STATUS.APPROVED;
  requestRecord.payment.paypalOrderId = paypalOrderId || requestRecord.payment.paypalOrderId || null;
  requestRecord.payment.rawProviderResponse = rawProviderResponse || null;
  requestRecord.payment.updatedAt = nowIso();

  await withTransaction(async (connection) => {
    await upsertPayment(connection, {
      ...requestRecord.payment,
      requestId: requestRecord.id,
      updatedAt: requestRecord.payment.updatedAt,
    });
  });

  return getRequestById(requestId);
}

export async function markPaymentCaptured({
  requestId,
  amount,
  currency,
  paypalOrderId,
  paypalCaptureId,
  rawProviderResponse,
}) {
  const requestRecord = await getRequestById(requestId);
  const wasAlreadyPaid =
    requestRecord.status === REQUEST_STATUS.PAID && requestRecord.payment?.status === PAYMENT_STATUS.CAPTURED;

  requestRecord.status = REQUEST_STATUS.PAID;
  requestRecord.updatedAt = nowIso();

  requestRecord.payment.method = "paypal";
  requestRecord.payment.status = PAYMENT_STATUS.CAPTURED;
  requestRecord.payment.amount = Number.isFinite(amount) ? amount : requestRecord.payment.amount;
  requestRecord.payment.currency = normalizeCurrencyCode(currency || requestRecord.payment.currency || "USD");
  requestRecord.payment.paypalOrderId = paypalOrderId || requestRecord.payment.paypalOrderId || null;
  requestRecord.payment.paypalCaptureId = paypalCaptureId || requestRecord.payment.paypalCaptureId || null;
  requestRecord.payment.rawProviderResponse = rawProviderResponse || null;
  requestRecord.payment.updatedAt = requestRecord.updatedAt;

  await withTransaction(async (connection) => {
    await updateServiceRequest(connection, requestRecord);
    await upsertPayment(connection, {
      ...requestRecord.payment,
      requestId: requestRecord.id,
      updatedAt: requestRecord.updatedAt,
    });
  });

  const refreshed = await getRequestById(requestId);
  refreshed.wasAlreadyPaid = wasAlreadyPaid;
  return refreshed;
}

export async function markPaymentFailed({
  requestId,
  paypalOrderId,
  rawProviderResponse,
}) {
  const requestRecord = await getRequestById(requestId);
  requestRecord.payment.status = PAYMENT_STATUS.FAILED;
  requestRecord.payment.paypalOrderId = paypalOrderId || requestRecord.payment.paypalOrderId || null;
  requestRecord.payment.rawProviderResponse = rawProviderResponse || null;
  requestRecord.payment.updatedAt = nowIso();

  await withTransaction(async (connection) => {
    await upsertPayment(connection, {
      ...requestRecord.payment,
      requestId: requestRecord.id,
      updatedAt: requestRecord.payment.updatedAt,
    });
  });

  return getRequestById(requestId);
}

export async function markPaymentRefundedByCaptureId(paypalCaptureId, rawProviderResponse) {
  const payment = await findPaymentByPaypalCaptureId(paypalCaptureId);
  if (!payment) {
    return null;
  }

  const requestRecord = await getRequestById(payment.requestId);
  requestRecord.payment.status = PAYMENT_STATUS.REFUNDED;
  requestRecord.payment.rawProviderResponse = rawProviderResponse || requestRecord.payment.rawProviderResponse || null;
  requestRecord.payment.updatedAt = nowIso();

  await withTransaction(async (connection) => {
    await upsertPayment(connection, {
      ...requestRecord.payment,
      requestId: requestRecord.id,
      updatedAt: requestRecord.payment.updatedAt,
    });
  });

  return getRequestById(requestRecord.id);
}

export async function findRequestByPaypalOrderId(paypalOrderId) {
  const payment = await findPaymentByPaypalOrderId(paypalOrderId);
  if (!payment) {
    return null;
  }
  return getRequestById(payment.requestId);
}

export async function findRequestByPaypalCaptureId(paypalCaptureId) {
  const payment = await findPaymentByPaypalCaptureId(paypalCaptureId);
  if (!payment) {
    return null;
  }
  return getRequestById(payment.requestId);
}

export async function addRequestAttachment({
  requestId,
  fileName,
  filePath,
  mimeType,
  sizeBytes,
  kind = "delivered_report",
  uploadedByUserId = null,
}) {
  await getRequestById(requestId);
  await createRequestAttachment({
    requestId,
    fileName,
    filePath,
    mimeType,
    sizeBytes,
    kind,
    uploadedByUserId,
    createdAt: nowIso(),
  });
  return getRequestById(requestId);
}

export function toPublicRequestPayload(requestRecord) {
  return sanitizePublicRequest(requestRecord);
}

export function toAdminRequestPayload(requestRecord, accessLink) {
  return {
    ...requestRecord,
    accessLink,
  };
}
