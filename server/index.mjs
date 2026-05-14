import express from "express";
import path from "node:path";
import { existsSync } from "node:fs";
import { runMigrations } from "./db/migrate.mjs";
import { closeDbPool } from "./db/connection.mjs";
import { nowIso } from "./utils/datetime.mjs";
import { toSafeErrorResponse, UnauthorizedError, ValidationError } from "./lib/errors.mjs";
import {
  MUTABLE_STATUSES,
  REQUEST_STATUS,
  addRequestAttachment,
  applyOwnerMessage,
  applyProposal,
  applyPublicAction,
  applyStatusUpdate,
  createRequest,
  findRequestByPaypalCaptureId,
  findRequestByPaypalOrderId,
  getRequestByAccessToken,
  getRequestById,
  listRequestsSummary,
  markPaymentApproved,
  markPaymentCaptured,
  markPaymentFailed,
  markPaymentPendingWithOrder,
  markPaymentRefundedByCaptureId,
  toAdminRequestPayload,
  toPublicRequestPayload,
} from "./services/serviceRequestsService.mjs";
import {
  authenticateAdmin,
  bootstrapAdminIfMissing,
  createAdminSession,
  getAdminFromBearerToken,
  getPrimaryAdminEmail,
  logoutByToken,
  updateAdminCredentials,
} from "./services/usersService.mjs";
import { dispatchEmail } from "./services/emailService.mjs";
import { getSiteContentState, saveSiteContentState } from "./services/siteContentService.mjs";
import { registerMediaFile } from "./services/mediaFilesService.mjs";
import { listRecentEmails } from "./repositories/emailOutboxRepository.mjs";
import {
  assertValidEmail,
  normalizeEmail,
  validateAdminSettingsInput,
  validateContentUpdateInput,
  validateOwnerMessageInput,
  validateProposalInput,
  validatePublicActionInput,
  validateRequestSubmissionInput,
  validateStatusUpdateInput,
} from "./validation/inputValidation.mjs";
import {
  capturePaypalOrder,
  createPaypalOrder,
  extractPaypalCapture,
  getPaypalPublicConfig,
  isPaypalConfigured,
  verifyPaypalWebhookSignature,
} from "./services/paypalService.mjs";
import {
  runDocumentOrImageUpload,
  runImageUpload,
  serveUploadFile,
  toPublicUploadPath,
} from "./lib/uploads.mjs";

const NODE_ENV = process.env.NODE_ENV || "development";
const IS_PRODUCTION = NODE_ENV === "production";
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || (IS_PRODUCTION ? "0.0.0.0" : "127.0.0.1");
const PUBLIC_BASE_URL = String(process.env.PUBLIC_BASE_URL || (IS_PRODUCTION ? "" : "http://localhost:5173")).trim();
const CORS_ALLOW_ORIGIN = String(process.env.CORS_ALLOW_ORIGIN || PUBLIC_BASE_URL || "*").trim();
const JWT_SECRET = String(process.env.JWT_SECRET || "");
const PAYPAL_WEBHOOK_ID = String(process.env.PAYPAL_WEBHOOK_ID || "").trim();
const PAYPAL_CONFIG = getPaypalPublicConfig();
const DIST_DIR = path.join(process.cwd(), "dist");
const DIST_INDEX_FILE = path.join(DIST_DIR, "index.html");

function looksLikeProductionLocalhost(value) {
  const next = String(value || "").toLowerCase();
  return next.includes("localhost") || next.includes("127.0.0.1");
}

function validateRuntimeConfig() {
  if (!IS_PRODUCTION) {
    return;
  }

  const missing = [];
  if (!process.env.ADMIN_EMAIL) {
    missing.push("ADMIN_EMAIL");
  }
  if (!process.env.ADMIN_PASSWORD) {
    missing.push("ADMIN_PASSWORD");
  }
  if (!JWT_SECRET) {
    missing.push("JWT_SECRET");
  }
  if (!PUBLIC_BASE_URL) {
    missing.push("PUBLIC_BASE_URL");
  }
  if (!CORS_ALLOW_ORIGIN) {
    missing.push("CORS_ALLOW_ORIGIN");
  }
  if (!isPaypalConfigured()) {
    missing.push("PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET");
  }
  if (!PAYPAL_WEBHOOK_ID) {
    missing.push("PAYPAL_WEBHOOK_ID");
  }
  if (missing.length > 0) {
    throw new Error(`Missing required env vars in production: ${missing.join(", ")}`);
  }

  if (PUBLIC_BASE_URL && looksLikeProductionLocalhost(PUBLIC_BASE_URL)) {
    throw new Error("PUBLIC_BASE_URL cannot point to localhost in production.");
  }
  if (CORS_ALLOW_ORIGIN && looksLikeProductionLocalhost(CORS_ALLOW_ORIGIN)) {
    throw new Error("CORS_ALLOW_ORIGIN cannot point to localhost in production.");
  }
}

const app = express();
app.set("trust proxy", true);
const HAS_DIST = existsSync(DIST_INDEX_FILE);
if (HAS_DIST) {
  app.use(
    express.static(DIST_DIR, {
      index: false,
      maxAge: IS_PRODUCTION ? "1h" : 0,
    }),
  );
}

const rateLimitBuckets = new Map();
function takeRateLimitToken(key, { limit, windowMs }) {
  const now = Date.now();
  if (rateLimitBuckets.size > 10_000) {
    for (const [bucketKey, bucketValue] of rateLimitBuckets.entries()) {
      if (bucketValue.expiresAt <= now) {
        rateLimitBuckets.delete(bucketKey);
      }
    }
  }

  const current = rateLimitBuckets.get(key);
  if (!current || current.expiresAt <= now) {
    rateLimitBuckets.set(key, { count: 1, expiresAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: Math.ceil(windowMs / 1000) };
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.expiresAt - now) / 1000)),
    };
  }

  current.count += 1;
  rateLimitBuckets.set(key, current);
  return {
    allowed: true,
    retryAfterSeconds: Math.max(1, Math.ceil((current.expiresAt - now) / 1000)),
  };
}

function getClientIp(req) {
  const forwardedFor = String(req.headers["x-forwarded-for"] || "")
    .split(",")[0]
    .trim();
  return forwardedFor || req.socket.remoteAddress || "unknown";
}

function getBearerToken(req) {
  const authHeader = String(req.headers.authorization || "");
  if (!authHeader.startsWith("Bearer ")) {
    return "";
  }
  return authHeader.slice("Bearer ".length).trim();
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": CORS_ALLOW_ORIGIN,
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  });
  res.end(JSON.stringify(payload));
}

function sendNoContent(res) {
  res.writeHead(204, {
    "Access-Control-Allow-Origin": CORS_ALLOW_ORIGIN,
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  });
  res.end();
}

async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new ValidationError("Request body too large"));
      }
    });

    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new ValidationError("Invalid JSON body"));
      }
    });

    req.on("error", reject);
  });
}

function getRequestAccessLink(accessToken) {
  return `${PUBLIC_BASE_URL}/request/${accessToken}`;
}

async function requireAdmin(req) {
  const token = getBearerToken(req);
  const admin = await getAdminFromBearerToken(token);
  if (!admin) {
    throw new UnauthorizedError("Unauthorized");
  }
  return admin;
}

async function assertRequestAccess(requestId, accessToken) {
  const requestRecord = await getRequestById(requestId);
  if (!accessToken || requestRecord.accessToken !== accessToken) {
    throw new UnauthorizedError("Invalid request access token");
  }
  return requestRecord;
}

function getPaypalApproveUrl(orderPayload) {
  const links = Array.isArray(orderPayload?.links) ? orderPayload.links : [];
  const approve = links.find((item) => String(item?.rel || "").toLowerCase() === "approve");
  return approve?.href ? String(approve.href) : "";
}

async function handleRequestSubmission(req, res) {
  const submitRateLimit = takeRateLimitToken(`request-submit:${getClientIp(req)}`, {
    limit: 15,
    windowMs: 15 * 60 * 1000,
  });
  if (!submitRateLimit.allowed) {
    sendJson(res, 429, {
      error: "Too many submissions. Please try again later.",
      retryAfterSeconds: submitRateLimit.retryAfterSeconds,
    });
    return;
  }

  const body = await parseBody(req);
  const form = validateRequestSubmissionInput(body);
  const requestRecord = await createRequest({ form });
  const accessLink = getRequestAccessLink(requestRecord.accessToken);

  await dispatchEmail({
    to: requestRecord.email,
    subject: "Your request was received",
    text: `We received your request. Track updates here: ${accessLink}`,
    html: `<p>We received your request.</p><p>Track updates here: <a href="${accessLink}">${accessLink}</a></p>`,
    metadata: { requestId: requestRecord.id, event: "request_submitted" },
  });

  await dispatchEmail({
    to: await getPrimaryAdminEmail(),
    subject: "New service request received",
    text: `A new request was submitted by ${requestRecord.name} (${requestRecord.email}).`,
    html: `<p>A new request was submitted by <strong>${requestRecord.name}</strong> (${requestRecord.email}).</p>`,
    metadata: { requestId: requestRecord.id, event: "owner_new_request" },
  });

  sendJson(res, 201, {
    requestId: requestRecord.id,
    status: requestRecord.status,
    accessLink,
    accessToken: requestRecord.accessToken,
  });
}

async function handlePublicRequestGet(res, accessToken) {
  const requestRecord = await getRequestByAccessToken(accessToken);
  sendJson(res, 200, {
    request: toPublicRequestPayload(requestRecord),
  });
}

async function handlePublicResponseAction(req, res, accessToken, body) {
  const actionRateLimit = takeRateLimitToken(`request-action:${accessToken}:${getClientIp(req)}`, {
    limit: 40,
    windowMs: 15 * 60 * 1000,
  });
  if (!actionRateLimit.allowed) {
    sendJson(res, 429, {
      error: "Too many actions. Please wait before trying again.",
      retryAfterSeconds: actionRateLimit.retryAfterSeconds,
    });
    return;
  }

  const { action, message } = validatePublicActionInput(body);
  const updated = await applyPublicAction({
    accessToken,
    action,
    message,
  });

  await dispatchEmail({
    to: await getPrimaryAdminEmail(),
    subject: `Request update: ${updated.topic}`,
    text: `User selected action "${action}" on request ${updated.id}.`,
    html: `<p>User selected action "<strong>${action}</strong>" on request ${updated.id}.</p>`,
    metadata: { requestId: updated.id, event: `user_${action}` },
  });

  sendJson(res, 200, { request: toPublicRequestPayload(updated) });
}

async function handlePaypalCreateOrder(req, res, requestId) {
  const orderRateLimit = takeRateLimitToken(`paypal-create:${requestId}:${getClientIp(req)}`, {
    limit: 30,
    windowMs: 15 * 60 * 1000,
  });
  if (!orderRateLimit.allowed) {
    sendJson(res, 429, {
      error: "Too many payment attempts. Please try again later.",
      retryAfterSeconds: orderRateLimit.retryAfterSeconds,
    });
    return;
  }

  const body = await parseBody(req);
  const accessToken = String(body?.accessToken || "").trim();
  const requestRecord = await assertRequestAccess(requestId, accessToken);

  if (!requestRecord.proposal) {
    throw new ValidationError("No proposal is available for payment");
  }
  if (requestRecord.status !== REQUEST_STATUS.ACCEPTED_PENDING_PAYMENT) {
    throw new ValidationError("Payment is not available for this request status");
  }
  if (requestRecord.payment?.status === "captured") {
    throw new ValidationError("This request is already paid");
  }

  const returnUrl = `${getRequestAccessLink(requestRecord.accessToken)}?paypal=success`;
  const cancelUrl = `${getRequestAccessLink(requestRecord.accessToken)}?paypal=cancel`;
  const order = await createPaypalOrder({
    amount: requestRecord.proposal.price,
    currency: requestRecord.proposal.currency || PAYPAL_CONFIG.currency,
    requestId: requestRecord.id,
    title: requestRecord.topic,
    description: `Service request ${requestRecord.id}`,
    returnUrl,
    cancelUrl,
  });

  const updated = await markPaymentPendingWithOrder({
    requestId: requestRecord.id,
    paypalOrderId: String(order.id || ""),
    rawProviderResponse: order,
  });

  sendJson(res, 200, {
    paypalOrderId: String(order.id || ""),
    approveUrl: getPaypalApproveUrl(order),
    request: toPublicRequestPayload(updated),
  });
}

async function handlePaypalCaptureOrder(req, res, requestId) {
  const captureRateLimit = takeRateLimitToken(`paypal-capture:${requestId}:${getClientIp(req)}`, {
    limit: 40,
    windowMs: 15 * 60 * 1000,
  });
  if (!captureRateLimit.allowed) {
    sendJson(res, 429, {
      error: "Too many capture attempts. Please try again later.",
      retryAfterSeconds: captureRateLimit.retryAfterSeconds,
    });
    return;
  }

  const body = await parseBody(req);
  const accessToken = String(body?.accessToken || "").trim();
  const paypalOrderId = String(body?.paypalOrderId || "").trim();
  const requestRecord = await assertRequestAccess(requestId, accessToken);
  if (!paypalOrderId) {
    throw new ValidationError("paypalOrderId is required");
  }
  if (requestRecord.payment?.status === "captured") {
    sendJson(res, 200, { request: toPublicRequestPayload(requestRecord) });
    return;
  }

  const capture = await capturePaypalOrder(paypalOrderId);
  const captureInfo = extractPaypalCapture(capture);
  const normalizedStatus = String(captureInfo.status || capture.status || "").toUpperCase();

  let updated;
  if (normalizedStatus === "COMPLETED" && captureInfo.captureId) {
    updated = await markPaymentCaptured({
      requestId: requestRecord.id,
      amount: captureInfo.amount ?? requestRecord.payment?.amount ?? requestRecord.proposal?.price ?? null,
      currency: captureInfo.currency || requestRecord.payment?.currency || requestRecord.proposal?.currency || "USD",
      paypalOrderId: captureInfo.orderId || paypalOrderId,
      paypalCaptureId: captureInfo.captureId,
      rawProviderResponse: capture,
    });

    if (!updated.wasAlreadyPaid) {
      await dispatchEmail({
        to: await getPrimaryAdminEmail(),
        subject: `Payment received for request ${updated.id}`,
        text: `PayPal payment was captured for request ${updated.id}.`,
        html: `<p>PayPal payment was captured for request <strong>${updated.id}</strong>.</p>`,
        metadata: { requestId: updated.id, event: "payment_captured" },
      });

      await dispatchEmail({
        to: updated.email,
        subject: "Payment confirmed",
        text: `Your PayPal payment for request ${updated.id} is confirmed.`,
        html: `<p>Your PayPal payment for request <strong>${updated.id}</strong> is confirmed.</p>`,
        metadata: { requestId: updated.id, event: "payment_confirmed_user" },
      });
    }
  } else if (normalizedStatus === "APPROVED") {
    updated = await markPaymentApproved({
      requestId: requestRecord.id,
      paypalOrderId: captureInfo.orderId || paypalOrderId,
      rawProviderResponse: capture,
    });
  } else {
    updated = await markPaymentFailed({
      requestId: requestRecord.id,
      paypalOrderId: captureInfo.orderId || paypalOrderId,
      rawProviderResponse: capture,
    });
  }

  sendJson(res, 200, { request: toPublicRequestPayload(updated), paypal: capture });
}

async function handlePaypalWebhook(req, res) {
  const body = await parseBody(req);
  const verified = await verifyPaypalWebhookSignature({
    headers: req.headers,
    webhookEvent: body,
  });

  if (!verified) {
    sendJson(res, 400, { error: "Invalid PayPal webhook signature" });
    return;
  }

  const eventType = String(body?.event_type || "").trim();
  const resource = body?.resource || {};
  const rawEvent = body;
  const orderId = String(resource?.supplementary_data?.related_ids?.order_id || resource?.invoice_id || "").trim();
  const captureId = String(resource?.id || "").trim();
  const amount = Number(resource?.amount?.value);
  const currency = String(resource?.amount?.currency_code || "").trim();

  if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
    let requestRecord = orderId ? await findRequestByPaypalOrderId(orderId) : null;
    if (!requestRecord && captureId) {
      requestRecord = await findRequestByPaypalCaptureId(captureId);
    }
    if (requestRecord) {
      const updated = await markPaymentCaptured({
        requestId: requestRecord.id,
        amount: Number.isFinite(amount) ? amount : requestRecord.payment?.amount ?? null,
        currency: currency || requestRecord.payment?.currency || "USD",
        paypalOrderId: orderId || requestRecord.payment?.paypalOrderId || null,
        paypalCaptureId: captureId || requestRecord.payment?.paypalCaptureId || null,
        rawProviderResponse: rawEvent,
      });

      if (!updated.wasAlreadyPaid) {
        await dispatchEmail({
          to: await getPrimaryAdminEmail(),
          subject: `Payment received for request ${updated.id}`,
          text: `PayPal payment was captured for request ${updated.id}.`,
          html: `<p>PayPal payment was captured for request <strong>${updated.id}</strong>.</p>`,
          metadata: { requestId: updated.id, event: "payment_captured_webhook" },
        });
      }
    }
  } else if (eventType === "PAYMENT.CAPTURE.DENIED") {
    const requestRecord = orderId ? await findRequestByPaypalOrderId(orderId) : null;
    if (requestRecord) {
      await markPaymentFailed({
        requestId: requestRecord.id,
        paypalOrderId: orderId || requestRecord.payment?.paypalOrderId || null,
        rawProviderResponse: rawEvent,
      });
    }
  } else if (eventType === "PAYMENT.CAPTURE.REFUNDED") {
    if (captureId) {
      await markPaymentRefundedByCaptureId(captureId, rawEvent);
    }
  }

  sendJson(res, 200, { ok: true });
}

async function handleAdminImageUpload(req, res, kind) {
  const admin = await requireAdmin(req);
  const file = await runImageUpload(req, res);
  const publicPath = toPublicUploadPath(file.filename);

  const media = await registerMediaFile(
    {
      fileName: file.filename,
      originalUrl: publicPath,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      altText: kind === "site_image" ? "Site image upload" : "Article image upload",
    },
    admin.id,
  );

  sendJson(res, 201, {
    file: {
      id: media.id,
      path: publicPath,
      url: publicPath,
      mimeType: media.mimeType,
      sizeBytes: media.sizeBytes,
      kind,
    },
  });
}

async function handleAdminRequestAttachmentUpload(req, res, requestId) {
  const admin = await requireAdmin(req);
  const file = await runDocumentOrImageUpload(req, res);
  const publicPath = toPublicUploadPath(file.filename);

  await registerMediaFile(
    {
      fileName: file.filename,
      originalUrl: publicPath,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      altText: "Delivered report attachment",
    },
    admin.id,
  );

  const requestRecord = await addRequestAttachment({
    requestId,
    fileName: file.originalname,
    filePath: publicPath,
    mimeType: file.mimetype,
    sizeBytes: file.size,
    kind: "delivered_report",
    uploadedByUserId: admin.id,
  });

  sendJson(res, 201, {
    request: toAdminRequestPayload(requestRecord, getRequestAccessLink(requestRecord.accessToken)),
  });
}

async function handleAdminLogin(req, res) {
  const loginRateLimit = takeRateLimitToken(`admin-login:${getClientIp(req)}`, {
    limit: 10,
    windowMs: 15 * 60 * 1000,
  });
  if (!loginRateLimit.allowed) {
    sendJson(res, 429, {
      error: "Too many login attempts. Please try again later.",
      retryAfterSeconds: loginRateLimit.retryAfterSeconds,
    });
    return;
  }

  const body = await parseBody(req);
  const email = normalizeEmail(body.email);
  const password = String(body.password || "");
  assertValidEmail(email);

  const admin = await authenticateAdmin(email, password);
  const session = await createAdminSession(admin.id);

  sendJson(res, 200, {
    token: session.token,
    expiresAt: session.expiresAt,
    admin: {
      id: admin.id,
      email: admin.email,
      name: admin.name,
    },
  });
}

async function handleAdminApi(req, res, pathname) {
  const admin = await requireAdmin(req);

  if (pathname === "/api/admin/logout" && req.method === "POST") {
    await logoutByToken(getBearerToken(req));
    sendJson(res, 200, { ok: true });
    return;
  }

  if (pathname === "/api/admin/me" && req.method === "GET") {
    sendJson(res, 200, { admin: { id: admin.id, email: admin.email, name: admin.name } });
    return;
  }

  if (pathname === "/api/admin/settings" && req.method === "GET") {
    sendJson(res, 200, { admin: { id: admin.id, email: admin.email, name: admin.name } });
    return;
  }

  if (pathname === "/api/admin/settings" && req.method === "PATCH") {
    const body = await parseBody(req);
    const input = validateAdminSettingsInput(body);
    const updated = await updateAdminCredentials({
      adminUser: admin,
      currentPassword: input.currentPassword,
      nextEmail: input.email,
      newPassword: input.newPassword,
      activeToken: getBearerToken(req),
    });

    sendJson(res, 200, {
      admin: { id: updated.id, email: updated.email, name: updated.name },
      passwordChanged: Boolean(input.newPassword),
    });
    return;
  }

  if (pathname === "/api/admin/requests" && req.method === "GET") {
    const requests = await listRequestsSummary();
    sendJson(res, 200, { requests });
    return;
  }

  const requestByIdMatch = pathname.match(/^\/api\/admin\/requests\/([^/]+)$/);
  if (requestByIdMatch && req.method === "GET") {
    const requestRecord = await getRequestById(decodeURIComponent(requestByIdMatch[1]));
    sendJson(res, 200, {
      request: toAdminRequestPayload(requestRecord, getRequestAccessLink(requestRecord.accessToken)),
    });
    return;
  }

  const proposalMatch = pathname.match(/^\/api\/admin\/requests\/([^/]+)\/proposal$/);
  if (proposalMatch && req.method === "POST") {
    const requestId = decodeURIComponent(proposalMatch[1]);
    const body = await parseBody(req);
    const proposal = validateProposalInput(body);
    const updated = await applyProposal({ requestId, proposal });

    const accessLink = getRequestAccessLink(updated.accessToken);
    await dispatchEmail({
      to: updated.email,
      subject: "Your proposal is ready",
      text: `Your proposal is ready. Review and respond here: ${accessLink}`,
      html: `<p>Your proposal is ready.</p><p><a href="${accessLink}">Review your request</a></p>`,
      metadata: { requestId: updated.id, event: "proposal_sent" },
    });

    sendJson(res, 200, { request: toAdminRequestPayload(updated, accessLink) });
    return;
  }

  const messageMatch = pathname.match(/^\/api\/admin\/requests\/([^/]+)\/message$/);
  if (messageMatch && req.method === "POST") {
    const requestId = decodeURIComponent(messageMatch[1]);
    const body = await parseBody(req);
    const { message } = validateOwnerMessageInput(body);
    const updated = await applyOwnerMessage({ requestId, message });

    const accessLink = getRequestAccessLink(updated.accessToken);
    await dispatchEmail({
      to: updated.email,
      subject: "Update on your request",
      text: `There is a new message about your request: ${accessLink}`,
      html: `<p>There is a new message about your request.</p><p><a href="${accessLink}">Open request</a></p>`,
      metadata: { requestId: updated.id, event: "owner_message" },
    });

    sendJson(res, 200, { request: toAdminRequestPayload(updated, accessLink) });
    return;
  }

  const statusMatch = pathname.match(/^\/api\/admin\/requests\/([^/]+)\/status$/);
  if (statusMatch && req.method === "PATCH") {
    const requestId = decodeURIComponent(statusMatch[1]);
    const body = await parseBody(req);
    const { nextStatus } = validateStatusUpdateInput(body, MUTABLE_STATUSES);
    const updated = await applyStatusUpdate({ requestId, nextStatus });
    sendJson(res, 200, {
      request: toAdminRequestPayload(updated, getRequestAccessLink(updated.accessToken)),
    });
    return;
  }

  if (pathname === "/api/admin/content" && req.method === "GET") {
    const content = await getSiteContentState();
    sendJson(res, 200, { content });
    return;
  }

  if (pathname === "/api/admin/content" && req.method === "PUT") {
    const body = await parseBody(req);
    const current = await getSiteContentState();
    const contentInput = validateContentUpdateInput(body, current);
    const nextContent = await saveSiteContentState({
      content: {
        ...current,
        homepage: {
          heroImage: contentInput.homepage.heroImage,
          heroAlt: contentInput.homepage.heroAlt || current.homepage.heroAlt,
        },
        siteContent: contentInput.siteContent,
      },
      adminUserId: admin.id,
    });
    sendJson(res, 200, { content: nextContent });
    return;
  }

  if (pathname === "/api/admin/outbox" && req.method === "GET") {
    sendJson(res, 200, { emails: await listRecentEmails(100) });
    return;
  }

  sendJson(res, 404, { error: "Admin endpoint not found" });
}

app.use(async (req, res) => {
  try {
    if (req.method === "OPTIONS") {
      sendNoContent(res);
      return;
    }

    const url = new URL(req.url || "/", "http://internal");
    const pathname = url.pathname;

    if (req.method === "GET") {
      const served = await serveUploadFile(req, res, pathname);
      if (served) {
        return;
      }
    }

    if (pathname === "/api/health" && req.method === "GET") {
      sendJson(res, 200, {
        ok: true,
        now: nowIso(),
        adminEmail: await getPrimaryAdminEmail(),
      });
      return;
    }

    if (pathname === "/api/payments/paypal/config" && req.method === "GET") {
      sendJson(res, 200, {
        paypal: {
          clientId: PAYPAL_CONFIG.clientId,
          mode: PAYPAL_CONFIG.mode,
          currency: PAYPAL_CONFIG.currency,
        },
      });
      return;
    }

    if (pathname === "/api/content" && req.method === "GET") {
      const content = await getSiteContentState();
      sendJson(res, 200, { content });
      return;
    }

    if (pathname === "/api/requests" && req.method === "POST") {
      await handleRequestSubmission(req, res);
      return;
    }

    const publicRequestMatch = pathname.match(/^\/api\/requests\/([^/]+)$/);
    if (publicRequestMatch && req.method === "GET") {
      await handlePublicRequestGet(res, decodeURIComponent(publicRequestMatch[1]));
      return;
    }

    const publicRespondMatch = pathname.match(/^\/api\/requests\/([^/]+)\/respond$/);
    if (publicRespondMatch && req.method === "POST") {
      const body = await parseBody(req);
      await handlePublicResponseAction(req, res, decodeURIComponent(publicRespondMatch[1]), body);
      return;
    }

    const createOrderMatch = pathname.match(/^\/api\/payments\/([^/]+)\/paypal\/create-order$/);
    if (createOrderMatch && req.method === "POST") {
      await handlePaypalCreateOrder(req, res, decodeURIComponent(createOrderMatch[1]));
      return;
    }

    const captureOrderMatch = pathname.match(/^\/api\/payments\/([^/]+)\/paypal\/capture-order$/);
    if (captureOrderMatch && req.method === "POST") {
      await handlePaypalCaptureOrder(req, res, decodeURIComponent(captureOrderMatch[1]));
      return;
    }

    if (pathname === "/api/admin/uploads/site-image" && req.method === "POST") {
      await handleAdminImageUpload(req, res, "site_image");
      return;
    }

    if (pathname === "/api/admin/uploads/article-image" && req.method === "POST") {
      await handleAdminImageUpload(req, res, "article_image");
      return;
    }

    const uploadAttachmentMatch = pathname.match(/^\/api\/admin\/requests\/([^/]+)\/attachments\/upload$/);
    if (uploadAttachmentMatch && req.method === "POST") {
      await handleAdminRequestAttachmentUpload(req, res, decodeURIComponent(uploadAttachmentMatch[1]));
      return;
    }

    if (pathname === "/api/webhooks/paypal" && req.method === "POST") {
      await handlePaypalWebhook(req, res);
      return;
    }

    if (pathname === "/api/admin/login" && req.method === "POST") {
      await handleAdminLogin(req, res);
      return;
    }

    if (pathname.startsWith("/api/admin/")) {
      await handleAdminApi(req, res, pathname);
      return;
    }

    if (req.method === "GET" && HAS_DIST && !pathname.startsWith("/api/")) {
      res.sendFile(DIST_INDEX_FILE);
      return;
    }

    sendJson(res, 404, { error: "Not found" });
  } catch (error) {
    if (!IS_PRODUCTION) {
      // eslint-disable-next-line no-console
      console.error(error);
    } else if (!(error instanceof ValidationError || error instanceof UnauthorizedError)) {
      // eslint-disable-next-line no-console
      console.error(error instanceof Error ? error.message : error);
    }
    const safe = toSafeErrorResponse(error, IS_PRODUCTION);
    sendJson(res, safe.statusCode, safe.payload);
  }
});

async function startServer() {
  // eslint-disable-next-line no-console
  console.log("Server starting...");
  // eslint-disable-next-line no-console
  console.log("PORT:", PORT);
  // eslint-disable-next-line no-console
  console.log("HOST:", HOST);

  validateRuntimeConfig();

  await runMigrations();
  await bootstrapAdminIfMissing();
  await getSiteContentState();

  const server = app.listen(PORT, HOST, () => {
    // eslint-disable-next-line no-console
    console.log(`MenaInsight backend running on http://${HOST}:${PORT}`);
    // eslint-disable-next-line no-console
    console.log(`Environment: ${NODE_ENV}`);
    // eslint-disable-next-line no-console
    console.log(`CORS allow origin: ${CORS_ALLOW_ORIGIN}`);
    // eslint-disable-next-line no-console
    console.log(`PayPal mode: ${PAYPAL_CONFIG.mode}`);
    // eslint-disable-next-line no-console
    console.log(`PayPal configured: ${isPaypalConfigured() ? "yes" : "no"}`);
  });

  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, async () => {
      try {
        await closeDbPool();
      } catch {
        // no-op
      } finally {
        server.close(() => process.exit(0));
      }
    });
  }
}

process.on("uncaughtException", (error) => {
  // eslint-disable-next-line no-console
  console.error("Uncaught exception during runtime:", error);
});

process.on("unhandledRejection", (error) => {
  // eslint-disable-next-line no-console
  console.error("Unhandled promise rejection during runtime:", error);
});

startServer().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Fatal startup error:", error);
  process.exit(1);
});
