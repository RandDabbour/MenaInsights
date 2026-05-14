import path from "node:path";
import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import bcrypt from "bcrypt";
import { runMigrations } from "../db/migrate.mjs";
import { closeDbPool, getDbPool } from "../db/connection.mjs";
import { nowIso, toSqlDateTime } from "../utils/datetime.mjs";

const JSON_DB_PATH = String(
  process.env.JSON_DB_PATH || path.join(process.cwd(), "server", "data", "db.json"),
).trim();
const DEFAULT_ADMIN_PASSWORD = String(process.env.ADMIN_PASSWORD || "ChangeMe123!");

const REQUEST_STATUSES = new Set([
  "submitted",
  "proposal_sent",
  "negotiation_requested",
  "proposal_updated",
  "accepted_pending_payment",
  "paid",
  "rejected",
]);

const PAYMENT_STATUSES = new Set(["pending", "approved", "captured", "failed", "refunded"]);

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeDatabaseShape(rawDb) {
  const current = isPlainObject(rawDb) ? rawDb : {};
  return {
    admins: Array.isArray(current.admins) ? current.admins : [],
    adminSessions: Array.isArray(current.adminSessions) ? current.adminSessions : [],
    content: isPlainObject(current.content)
      ? current.content
      : {
          homepage: { heroImage: "", heroAlt: "Middle East Media Insights hero" },
          siteContent: {},
          updatedAt: nowIso(),
        },
    requests: Array.isArray(current.requests) ? current.requests : [],
    emailOutbox: Array.isArray(current.emailOutbox) ? current.emailOutbox : [],
  };
}

async function loadFromJsonFile() {
  try {
    await access(JSON_DB_PATH);
  } catch {
    return null;
  }
  const text = await readFile(JSON_DB_PATH, "utf8");
  return normalizeDatabaseShape(JSON.parse(text));
}

function hashToken(token) {
  return createHash("sha256").update(String(token || "")).digest("hex");
}

async function toBcryptPasswordHash(value) {
  const current = String(value || "");
  if (current.startsWith("$2a$") || current.startsWith("$2b$") || current.startsWith("$2y$")) {
    return current;
  }
  return bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 12);
}

function normalizeStatus(value) {
  const next = String(value || "").trim();
  return REQUEST_STATUSES.has(next) ? next : "submitted";
}

function normalizePaymentStatus(value) {
  const next = String(value || "").trim();
  if (next === "paid") {
    return "captured";
  }
  if (next === "checkout_pending") {
    return "approved";
  }
  return PAYMENT_STATUSES.has(next) ? next : "pending";
}

function normalizeCurrency(value) {
  const next = String(value || "USD").trim().toUpperCase();
  return /^[A-Z]{3}$/.test(next) ? next : "USD";
}

async function importData(data) {
  const pool = getDbPool();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    for (const admin of data.admins) {
      const adminId = String(admin.id || "");
      if (!adminId) {
        continue;
      }
      const passwordHash = await toBcryptPasswordHash(admin.passwordHash);
      const createdAt = toSqlDateTime(admin.createdAt || nowIso());
      const updatedAt = toSqlDateTime(nowIso());
      await connection.execute(
        `INSERT INTO users (id, name, email, password_hash, role, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'admin', 1, ?, ?)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           email = VALUES(email),
           password_hash = VALUES(password_hash),
           updated_at = VALUES(updated_at)`,
        [
          adminId,
          String(admin.name || "Site Owner").trim().slice(0, 120),
          String(admin.email || "").trim().toLowerCase(),
          passwordHash,
          createdAt,
          updatedAt,
        ],
      );
    }

    for (const session of data.adminSessions) {
      const sessionId = String(session.id || "");
      const userId = String(session.adminId || "");
      if (!sessionId || !userId) {
        continue;
      }
      const tokenHash = String(session.tokenHash || "").trim() || hashToken(session.token || "");
      if (!tokenHash) {
        continue;
      }
      await connection.execute(
        `INSERT INTO user_sessions (id, user_id, token_hash, created_at, expires_at)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           expires_at = VALUES(expires_at)`,
        [
          sessionId,
          userId,
          tokenHash,
          toSqlDateTime(session.createdAt || nowIso()),
          toSqlDateTime(session.expiresAt || nowIso()),
        ],
      );
    }

    await connection.execute(
      `INSERT INTO site_content
        (content_key, content_type, content_text, content_json, updated_by_user_id, created_at, updated_at)
       VALUES ('global', 'json', NULL, CAST(? AS JSON), NULL, ?, ?)
       ON DUPLICATE KEY UPDATE
         content_json = VALUES(content_json),
         updated_at = VALUES(updated_at)`,
      [
        JSON.stringify(data.content || {}),
        toSqlDateTime(data.content?.updatedAt || nowIso()),
        toSqlDateTime(data.content?.updatedAt || nowIso()),
      ],
    );

    for (const request of data.requests) {
      const requestId = String(request.id || "");
      if (!requestId) {
        continue;
      }
      const proposalPrice = Number(request.proposal?.price);
      const proposalValue = Number.isFinite(proposalPrice) ? proposalPrice : null;
      const proposalCurrency = normalizeCurrency(request.proposal?.currency || request.payment?.currency || "USD");
      const proposalTimeline = String(request.proposal?.timeline || "").trim();
      const proposalNotes = String(request.proposal?.notes || "").trim();
      const proposedAt = request.proposal?.proposedAt || null;

      await connection.execute(
        `INSERT INTO service_requests (
          id, access_token, requester_name, requester_email, organization,
          service, region, topic, urgency, description, budget, status,
          proposal_price, proposal_currency, proposal_timeline, proposal_notes, proposed_at,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          requester_name = VALUES(requester_name),
          requester_email = VALUES(requester_email),
          organization = VALUES(organization),
          service = VALUES(service),
          region = VALUES(region),
          topic = VALUES(topic),
          urgency = VALUES(urgency),
          description = VALUES(description),
          budget = VALUES(budget),
          status = VALUES(status),
          proposal_price = VALUES(proposal_price),
          proposal_currency = VALUES(proposal_currency),
          proposal_timeline = VALUES(proposal_timeline),
          proposal_notes = VALUES(proposal_notes),
          proposed_at = VALUES(proposed_at),
          updated_at = VALUES(updated_at)`,
        [
          requestId,
          String(request.accessToken || "").trim(),
          String(request.name || "").trim(),
          String(request.email || "").trim().toLowerCase(),
          String(request.organization || "").trim() || null,
          String(request.service || "").trim(),
          String(request.region || "").trim(),
          String(request.topic || "").trim(),
          String(request.urgency || "").trim() || null,
          String(request.description || "").trim(),
          String(request.budget || "").trim() || null,
          normalizeStatus(request.status),
          proposalValue,
          proposalCurrency,
          proposalTimeline || null,
          proposalNotes || null,
          toSqlDateTime(proposedAt || null),
          toSqlDateTime(request.createdAt || nowIso()),
          toSqlDateTime(request.updatedAt || nowIso()),
        ],
      );

      const payment = request.payment || {};
      const paymentAmount = Number(payment.amount);
      await connection.execute(
        `INSERT INTO payments
          (id, request_id, method, status, amount, currency, paypal_order_id, paypal_capture_id, raw_provider_response, created_at, updated_at)
         VALUES (?, ?, 'paypal', ?, ?, ?, ?, ?, CAST(? AS JSON), ?, ?)
         ON DUPLICATE KEY UPDATE
          method = VALUES(method),
          status = VALUES(status),
          amount = VALUES(amount),
          currency = VALUES(currency),
          paypal_order_id = VALUES(paypal_order_id),
          paypal_capture_id = VALUES(paypal_capture_id),
          raw_provider_response = VALUES(raw_provider_response),
          updated_at = VALUES(updated_at)`,
        [
          String(payment.id || requestId),
          requestId,
          normalizePaymentStatus(payment.status),
          Number.isFinite(paymentAmount) ? paymentAmount : null,
          normalizeCurrency(payment.currency || proposalCurrency || "USD"),
          payment.paypalOrderId ? String(payment.paypalOrderId) : payment.checkoutSessionId ? String(payment.checkoutSessionId) : null,
          payment.paypalCaptureId ? String(payment.paypalCaptureId) : null,
          JSON.stringify(payment.rawProviderResponse || {}),
          toSqlDateTime(request.createdAt || nowIso()),
          toSqlDateTime(request.updatedAt || nowIso()),
        ],
      );

      const messages = Array.isArray(request.messages) ? request.messages : [];
      for (const message of messages) {
        const messageId = String(message.id || "");
        if (!messageId) {
          continue;
        }
        await connection.execute(
          `INSERT INTO request_messages (id, request_id, author_role, body, created_at)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             body = VALUES(body),
             created_at = VALUES(created_at)`,
          [
            messageId,
            requestId,
            String(message.authorRole || "user") === "owner" ? "owner" : "user",
            String(message.body || "").trim(),
            toSqlDateTime(message.createdAt || nowIso()),
          ],
        );
      }
    }

    for (const email of data.emailOutbox) {
      const emailId = String(email.id || "");
      if (!emailId) {
        continue;
      }
      await connection.execute(
        `INSERT INTO email_outbox
          (id, recipient_email, subject, text_body, html_body, metadata_json, queued_at, sent_at, status, error_message)
         VALUES (?, ?, ?, ?, ?, CAST(? AS JSON), ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           status = VALUES(status),
           sent_at = VALUES(sent_at),
           error_message = VALUES(error_message)`,
        [
          emailId,
          String(email.to || "").trim().toLowerCase(),
          String(email.subject || "").trim(),
          String(email.text || ""),
          String(email.html || ""),
          JSON.stringify(email.metadata || {}),
          toSqlDateTime(email.queuedAt || nowIso()),
          toSqlDateTime(email.sentAt || null),
          String(email.status || "queued") === "failed" ? "failed" : String(email.status || "queued") === "sent" ? "sent" : "queued",
          email.error ? String(email.error) : null,
        ],
      );
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function main() {
  await runMigrations();

  const sourceData = await loadFromJsonFile();
  if (!sourceData) {
    throw new Error(`No import source found. Checked JSON file at "${JSON_DB_PATH}".`);
  }

  await importData(sourceData);
  // eslint-disable-next-line no-console
  console.log("Import completed successfully.");
}

main()
  .then(() => closeDbPool())
  .catch(async (error) => {
    // eslint-disable-next-line no-console
    console.error(error instanceof Error ? error.message : error);
    await closeDbPool();
    process.exitCode = 1;
  });
