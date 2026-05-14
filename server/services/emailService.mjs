import { randomUUID } from "node:crypto";
import { nowIso } from "../utils/datetime.mjs";
import { enqueueEmail, updateEmailStatus } from "../repositories/emailOutboxRepository.mjs";

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const RESEND_FROM = process.env.RESEND_FROM || "";

export async function dispatchEmail({ to, subject, text, html, metadata }) {
  const queuedEmail = {
    id: randomUUID(),
    to,
    subject,
    text,
    html,
    metadata: metadata || {},
    queuedAt: nowIso(),
    sentAt: null,
    status: "queued",
    error: null,
  };

  await enqueueEmail(queuedEmail);

  if (!RESEND_API_KEY || !RESEND_FROM) {
    return queuedEmail;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [to],
        subject,
        text,
        html,
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`Resend error ${response.status}: ${details}`);
    }

    queuedEmail.status = "sent";
    queuedEmail.sentAt = nowIso();
    queuedEmail.error = null;
    await updateEmailStatus({
      id: queuedEmail.id,
      status: queuedEmail.status,
      sentAt: queuedEmail.sentAt,
      error: null,
    });
    return queuedEmail;
  } catch (error) {
    queuedEmail.status = "failed";
    queuedEmail.error = error instanceof Error ? error.message : "Unknown email error";
    await updateEmailStatus({
      id: queuedEmail.id,
      status: queuedEmail.status,
      sentAt: null,
      error: queuedEmail.error,
    });
    return queuedEmail;
  }
}
