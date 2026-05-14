const PAYPAL_CLIENT_ID = String(process.env.PAYPAL_CLIENT_ID || "").trim();
const PAYPAL_CLIENT_SECRET = String(process.env.PAYPAL_CLIENT_SECRET || "").trim();
const PAYPAL_MODE = String(process.env.PAYPAL_MODE || "sandbox").trim().toLowerCase() === "live" ? "live" : "sandbox";
const PAYPAL_WEBHOOK_ID = String(process.env.PAYPAL_WEBHOOK_ID || "").trim();
const PAYMENT_CURRENCY = String(process.env.PAYMENT_CURRENCY || "USD").trim().toUpperCase();

function getBaseUrl() {
  return PAYPAL_MODE === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

function ensureCredentials() {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error("Missing PayPal credentials. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.");
  }
}

function normalizeCurrency(code) {
  const next = String(code || PAYMENT_CURRENCY || "USD").trim().toUpperCase();
  return /^[A-Z]{3}$/.test(next) ? next : "USD";
}

export function getPaypalPublicConfig() {
  return {
    clientId: PAYPAL_CLIENT_ID || "",
    mode: PAYPAL_MODE,
    currency: normalizeCurrency(PAYMENT_CURRENCY),
  };
}

export function isPaypalConfigured() {
  return Boolean(PAYPAL_CLIENT_ID && PAYPAL_CLIENT_SECRET);
}

export async function createPaypalAccessToken() {
  ensureCredentials();
  const credentials = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64");

  const response = await fetch(`${getBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.access_token) {
    const message = payload?.error_description || payload?.error || "Unable to get PayPal access token";
    throw new Error(message);
  }

  return payload.access_token;
}

export async function createPaypalOrder({
  amount,
  currency,
  requestId,
  title,
  description,
  returnUrl,
  cancelUrl,
}) {
  const accessToken = await createPaypalAccessToken();
  const money = Number(amount);
  if (!Number.isFinite(money) || money <= 0) {
    throw new Error("Invalid payment amount");
  }

  const nextCurrency = normalizeCurrency(currency);
  const payload = {
    intent: "CAPTURE",
    purchase_units: [
      {
        reference_id: String(requestId || ""),
        description: String(description || "").slice(0, 127),
        custom_id: String(requestId || ""),
        amount: {
          currency_code: nextCurrency,
          value: money.toFixed(2),
        },
      },
    ],
    application_context: {
      brand_name: "Middle East Media Insights",
      user_action: "PAY_NOW",
      return_url: returnUrl,
      cancel_url: cancelUrl,
    },
  };

  const response = await fetch(`${getBaseUrl()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(payload),
  });

  const order = await response.json().catch(() => ({}));
  if (!response.ok || !order?.id) {
    const message = order?.message || order?.name || "Unable to create PayPal order";
    throw new Error(message);
  }
  return order;
}

export async function capturePaypalOrder(paypalOrderId) {
  const accessToken = await createPaypalAccessToken();
  const orderId = String(paypalOrderId || "").trim();
  if (!orderId) {
    throw new Error("PayPal order ID is required");
  }

  const response = await fetch(`${getBaseUrl()}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: "{}",
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.message || payload?.name || "Unable to capture PayPal order";
    throw new Error(message);
  }
  return payload;
}

export function extractPaypalCapture(captureResponse) {
  const purchaseUnits = Array.isArray(captureResponse?.purchase_units) ? captureResponse.purchase_units : [];
  for (const unit of purchaseUnits) {
    const captures = unit?.payments?.captures;
    if (Array.isArray(captures) && captures.length > 0) {
      const capture = captures[0];
      const amountValue = Number(capture?.amount?.value);
      return {
        orderId: String(captureResponse?.id || ""),
        captureId: String(capture?.id || ""),
        status: String(capture?.status || captureResponse?.status || ""),
        amount: Number.isFinite(amountValue) ? amountValue : null,
        currency: String(capture?.amount?.currency_code || ""),
      };
    }
  }

  return {
    orderId: String(captureResponse?.id || ""),
    captureId: "",
    status: String(captureResponse?.status || ""),
    amount: null,
    currency: "",
  };
}

export async function verifyPaypalWebhookSignature({
  headers,
  webhookEvent,
}) {
  ensureCredentials();
  if (!PAYPAL_WEBHOOK_ID) {
    throw new Error("Missing PAYPAL_WEBHOOK_ID for webhook signature verification.");
  }

  const accessToken = await createPaypalAccessToken();
  const transmissionId = String(headers["paypal-transmission-id"] || headers["PAYPAL-TRANSMISSION-ID"] || "");
  const transmissionTime = String(headers["paypal-transmission-time"] || headers["PAYPAL-TRANSMISSION-TIME"] || "");
  const transmissionSig = String(headers["paypal-transmission-sig"] || headers["PAYPAL-TRANSMISSION-SIG"] || "");
  const certUrl = String(headers["paypal-cert-url"] || headers["PAYPAL-CERT-URL"] || "");
  const authAlgo = String(headers["paypal-auth-algo"] || headers["PAYPAL-AUTH-ALGO"] || "");

  if (!transmissionId || !transmissionTime || !transmissionSig || !certUrl || !authAlgo) {
    return false;
  }

  const response = await fetch(`${getBaseUrl()}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      auth_algo: authAlgo,
      cert_url: certUrl,
      transmission_id: transmissionId,
      transmission_sig: transmissionSig,
      transmission_time: transmissionTime,
      webhook_id: PAYPAL_WEBHOOK_ID,
      webhook_event: webhookEvent,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    return false;
  }
  return String(payload?.verification_status || "").toUpperCase() === "SUCCESS";
}
