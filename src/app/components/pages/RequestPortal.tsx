import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Clock3, FileText, MessageSquare, Wallet, XCircle } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router";

type PublicRequest = {
  id: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  request: {
    name: string;
    email: string;
    organization: string;
    service: string;
    region: string;
    topic: string;
    urgency: string;
    description: string;
    budget: string;
  };
  proposal: null | {
    price: number;
    currency: string;
    timeline: string;
    notes: string;
    proposedAt: string;
  };
  payment: {
    status: string;
    amount: number | null;
    currency: string;
    method?: string;
    paypalOrderId?: string | null;
    paypalCaptureId?: string | null;
  };
  paymentHistory?: Array<{
    id: string;
    status: string;
    eventType: string;
    eventNote: string;
    providerEventId?: string | null;
    amount?: number | null;
    currency?: string | null;
    createdAt: string;
  }>;
  messages: Array<{
    id: string;
    authorRole: "owner" | "user";
    body: string;
    createdAt: string;
  }>;
  attachments?: Array<{
    id: string;
    fileName: string;
    filePath: string;
    mimeType: string;
    sizeBytes: number;
    kind: string;
    createdAt: string;
  }>;
};

const STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted",
  proposal_sent: "Proposal Sent",
  negotiation_requested: "Negotiation Requested",
  proposal_updated: "Proposal Updated",
  accepted_pending_payment: "Accepted - Awaiting Payment",
  paid: "Paid",
  rejected: "Rejected",
};

const STATUS_STEPS = [
  { key: "submitted", label: "Submitted" },
  { key: "proposal_sent", label: "Proposal Sent" },
  { key: "proposal_updated", label: "Proposal Updated" },
  { key: "accepted_pending_payment", label: "Accepted" },
  { key: "paid", label: "Paid" },
] as const;

function resolveStatusStepIndex(status: string) {
  if (status === "negotiation_requested") {
    return 2;
  }
  const index = STATUS_STEPS.findIndex((step) => step.key === status);
  return index >= 0 ? index : 0;
}

function formatDate(value: string | undefined) {
  if (!value) {
    return "";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString();
}

function formatAmount(amount: number | null | undefined, currency: string | null | undefined) {
  if (!Number.isFinite(amount)) {
    return "—";
  }
  const safeCurrency = String(currency || "USD").toUpperCase();
  return `${safeCurrency} ${Number(amount).toLocaleString()}`;
}

export function RequestPortal() {
  const { token } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [requestData, setRequestData] = useState<PublicRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [negotiationMessage, setNegotiationMessage] = useState("");
  const [paymentBanner, setPaymentBanner] = useState<null | {
    tone: "success" | "warning" | "error";
    title: string;
    message: string;
  }>(null);

  const loadRequest = async () => {
    if (!token) {
      setError("Missing request token.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await fetch(`/api/requests/${token}`);
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to load request");
      }
      setRequestData(payload.request);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load request");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!token || !requestData?.id) {
      return;
    }

    const params = new URLSearchParams(location.search);
    const paypalStatus = params.get("paypal");
    const paypalOrderId = params.get("token");
    if (!paypalStatus) {
      return;
    }

    if (paypalStatus === "cancel") {
      setPaymentBanner({
        tone: "warning",
        title: "Payment cancelled",
        message: "You canceled PayPal checkout. Your request is still waiting for payment.",
      });
      navigate(`/request/${token}`, { replace: true });
      return;
    }

    if (paypalStatus !== "success" || !paypalOrderId) {
      setPaymentBanner({
        tone: "error",
        title: "Payment not completed",
        message: "PayPal did not return a valid payment token. Please try again.",
      });
      navigate(`/request/${token}`, { replace: true });
      return;
    }

    const captureOrder = async () => {
      try {
        setBusy(true);
        setError("");
        const response = await fetch(`/api/payments/${requestData.id}/paypal/capture-order`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accessToken: token,
            paypalOrderId,
          }),
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || "Unable to capture PayPal payment");
        }
        setRequestData(payload.request);
        setPaymentBanner({
          tone: "success",
          title: "Payment completed",
          message: "Your PayPal payment was captured successfully.",
        });
        navigate(`/request/${token}`, { replace: true });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unable to capture PayPal payment";
        setError(message);
        setPaymentBanner({
          tone: "error",
          title: "Payment failed",
          message,
        });
      } finally {
        setBusy(false);
      }
    };

    captureOrder();
  }, [location.search, navigate, requestData?.id, token]);

  const sendAction = async (action: "accept" | "reject" | "negotiate") => {
    if (!token) {
      return;
    }

    if (action === "negotiate" && !negotiationMessage.trim()) {
      setError("Please enter a negotiation message.");
      return;
    }

    try {
      setBusy(true);
      setError("");
      const response = await fetch(`/api/requests/${token}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          message: action === "negotiate" ? negotiationMessage.trim() : undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to update request");
      }
      setRequestData(payload.request);
      setNegotiationMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update request");
    } finally {
      setBusy(false);
    }
  };

  const payNow = async () => {
    if (!token || !requestData?.id) {
      return;
    }

    try {
      setBusy(true);
      setError("");
      const response = await fetch(`/api/payments/${requestData.id}/paypal/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: token,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to start PayPal payment");
      }
      if (!payload.approveUrl) {
        throw new Error("PayPal approval URL is missing.");
      }
      setRequestData(payload.request);
      setPaymentBanner({
        tone: "warning",
        title: "Redirecting to PayPal",
        message: "Complete your payment in the PayPal window, then you will return here automatically.",
      });
      window.location.assign(payload.approveUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start PayPal payment");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white min-h-[75vh] flex items-center justify-center">
        <p className="text-gray-500">Loading request...</p>
      </div>
    );
  }

  if (!requestData) {
    return (
      <div className="bg-white min-h-[75vh] flex items-center justify-center px-6">
        <p className="text-red-600">{error || "Request not found."}</p>
      </div>
    );
  }

  const canRespond = ["proposal_sent", "proposal_updated"].includes(requestData.status);
  const canPay =
    Boolean(requestData.proposal) &&
    requestData.status !== "rejected" &&
    requestData.payment.status !== "captured" &&
    requestData.status === "accepted_pending_payment";

  const paymentState = (() => {
    if (!requestData.proposal) {
      return "waiting for price";
    }
    if (requestData.payment.status === "captured" || requestData.status === "paid") {
      return "payment completed";
    }
    if (requestData.payment.status === "failed") {
      return "failed payment";
    }
    if (requestData.payment.status === "approved" || requestData.status === "accepted_pending_payment") {
      return "payment pending";
    }
    return "price proposed";
  })();
  const currentStepIndex = resolveStatusStepIndex(requestData.status);
  const isRejected = requestData.status === "rejected";
  const showNegotiationBox = canRespond || requestData.status === "negotiation_requested";

  return (
    <div className="bg-[#f8f9fb]">
      <section className="bg-[#111a34] text-white">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <p className="text-blue-300 text-sm font-medium uppercase tracking-wide mb-3">Request Portal</p>
          <h1 className="text-3xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            {requestData.request.topic}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-sm">
              Status: {STATUS_LABELS[requestData.status] || requestData.status}
            </span>
            <span className="inline-flex rounded-full bg-[#d4af37]/20 px-3 py-1 text-sm text-[#f8e7ac]">
              Payment: {paymentState}
            </span>
            {requestData.updatedAt ? (
              <span className="inline-flex rounded-full border border-white/20 px-3 py-1 text-xs text-white/75">
                Last update: {formatDate(requestData.updatedAt)}
              </span>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        {paymentBanner ? (
          <div
            className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
              paymentBanner.tone === "success"
                ? "border-green-200 bg-green-50 text-green-800"
                : paymentBanner.tone === "warning"
                  ? "border-amber-200 bg-amber-50 text-amber-800"
                  : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            <p className="font-semibold">{paymentBanner.title}</p>
            <p className="mt-1">{paymentBanner.message}</p>
          </div>
        ) : null}

        {error ? (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#1a2740]">Progress</h2>
          {isRejected ? (
            <div className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              <XCircle className="h-4 w-4" />
              This request was rejected.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-5">
              {STATUS_STEPS.map((step, index) => {
                const completed = index <= currentStepIndex;
                return (
                  <div key={step.key} className="flex items-center gap-2">
                    <span
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                        completed ? "bg-[#111a34] text-white" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <p className={`text-xs font-medium ${completed ? "text-[#1a2740]" : "text-gray-500"}`}>{step.label}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.3fr_1fr]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-[#1a2740]">Request Summary</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700"><strong>Name:</strong> {requestData.request.name}</p>
                <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700"><strong>Email:</strong> {requestData.request.email}</p>
                <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700"><strong>Service:</strong> {requestData.request.service}</p>
                <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700"><strong>Region:</strong> {requestData.request.region}</p>
                <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700"><strong>Timeline:</strong> {requestData.request.urgency || "Not specified"}</p>
                <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700"><strong>Budget:</strong> {requestData.request.budget || "Not specified"}</p>
              </div>
              <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Description</p>
                <p className="whitespace-pre-wrap text-sm text-gray-700">{requestData.request.description}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#1a2740]">
                <MessageSquare className="h-5 w-5" />
                Conversation
              </h2>
              {requestData.messages.length === 0 ? (
                <p className="text-sm text-gray-500">No messages yet.</p>
              ) : (
                <div className="space-y-3">
                  {requestData.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`rounded-xl border px-4 py-3 text-sm ${
                        message.authorRole === "owner"
                          ? "border-blue-100 bg-blue-50/60"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          {message.authorRole === "owner" ? "Site Owner" : "You"}
                        </p>
                        <p className="text-[11px] text-gray-400">{formatDate(message.createdAt)}</p>
                      </div>
                      <p className="whitespace-pre-wrap text-gray-700">{message.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-[#1a2740]">Proposal & Actions</h2>
              {requestData.proposal ? (
                <div className="space-y-3">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Proposed Price</p>
                    <p className="mt-1 text-xl font-semibold text-[#111a34]">
                      {requestData.proposal.currency} {requestData.proposal.price.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                    <p><strong>Timeline:</strong> {requestData.proposal.timeline || "TBD"}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <p className="mb-1 text-xs uppercase tracking-wide text-gray-500">Notes</p>
                    <p className="whitespace-pre-wrap text-sm text-gray-700">
                      {requestData.proposal.notes || "No notes provided."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  <div className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4" />
                    Waiting for proposal from site owner.
                  </div>
                </div>
              )}

              {canRespond ? (
                <div className="mt-5 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => sendAction("accept")}
                      className="rounded-lg bg-[#111a34] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1a2b52] disabled:opacity-60"
                    >
                      Accept Proposal
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => sendAction("reject")}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ) : null}

              {showNegotiationBox ? (
                <div className="mt-4">
                  <textarea
                    value={negotiationMessage}
                    onChange={(e) => setNegotiationMessage(e.target.value)}
                    rows={3}
                    placeholder="Request changes or negotiate the proposal..."
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => sendAction("negotiate")}
                    className="mt-2 rounded-lg border border-[#111a34] px-4 py-2 text-sm font-semibold text-[#111a34] hover:bg-[#111a34] hover:text-white disabled:opacity-60"
                  >
                    Send Negotiation
                  </button>
                </div>
              ) : null}

              {canPay ? (
                <div className="mt-5 rounded-lg border border-[#d4af37]/30 bg-[#d4af37]/10 p-3">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={payNow}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#d4af37] px-4 py-2 text-sm font-semibold text-[#111a34] hover:bg-[#e4c254] disabled:opacity-60"
                  >
                    <Wallet className="h-4 w-4" />
                    Pay with PayPal
                  </button>
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-[#1a2740]">Payment State</h2>
              <div
                className={`rounded-lg border px-3 py-2 text-sm ${
                  paymentState === "payment completed"
                    ? "border-green-200 bg-green-50 text-green-700"
                    : paymentState === "failed payment"
                      ? "border-red-200 bg-red-50 text-red-700"
                      : "border-gray-200 bg-gray-50 text-gray-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  {paymentState === "payment completed" ? <CheckCircle2 className="h-4 w-4" /> : null}
                  {paymentState === "failed payment" ? <AlertCircle className="h-4 w-4" /> : null}
                  {paymentState === "payment pending" ? <Clock3 className="h-4 w-4" /> : null}
                  {paymentState === "waiting for price" ? <Clock3 className="h-4 w-4" /> : null}
                  {paymentState === "price proposed" ? <FileText className="h-4 w-4" /> : null}
                  <span className="font-medium capitalize">{paymentState}</span>
                </div>
              </div>
              <div className="mt-3 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600">
                {paymentState === "waiting for price"
                  ? "Owner has not sent a price proposal yet."
                  : paymentState === "price proposed"
                    ? "A proposal is ready. Accept it to continue to payment."
                    : paymentState === "payment pending"
                      ? "Payment is not captured yet. You can complete checkout with PayPal."
                      : paymentState === "failed payment"
                        ? "Previous payment attempt failed. You can retry safely."
                        : "Payment confirmed. No further action required."}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-[#1a2740]">Payment History</h2>
              {!requestData.paymentHistory || requestData.paymentHistory.length === 0 ? (
                <p className="text-sm text-gray-500">No payment events yet.</p>
              ) : (
                <div className="space-y-3">
                  {requestData.paymentHistory.map((event) => (
                    <div key={event.id} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#1a2740]">
                          {event.eventType.replace(/_/g, " ")}
                        </p>
                        <p className="text-[11px] text-gray-500">{formatDate(event.createdAt)}</p>
                      </div>
                      <p className="mt-1 text-xs text-gray-700">{event.eventNote || "Status updated."}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-gray-500">
                        <span>Status: {event.status}</span>
                        <span>Amount: {formatAmount(event.amount, event.currency)}</span>
                        {event.providerEventId ? <span>Ref: {event.providerEventId}</span> : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#1a2740]">
                <FileText className="h-5 w-5" />
                Delivered Files
              </h2>
              {!requestData.attachments || requestData.attachments.length === 0 ? (
                <p className="text-sm text-gray-500">No delivered attachments yet.</p>
              ) : (
                <div className="space-y-2">
                  {requestData.attachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={attachment.filePath}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-[#1a2740] hover:bg-gray-100"
                    >
                      <span>{attachment.fileName}</span>
                      <span className="text-xs font-medium text-blue-700">Open</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
