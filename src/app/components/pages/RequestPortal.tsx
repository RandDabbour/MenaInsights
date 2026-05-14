import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";

type PublicRequest = {
  id: string;
  status: string;
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

export function RequestPortal() {
  const { token } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [requestData, setRequestData] = useState<PublicRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [negotiationMessage, setNegotiationMessage] = useState("");

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
    if (paypalStatus !== "success" || !paypalOrderId) {
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
        navigate(`/request/${token}`, { replace: true });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to capture PayPal payment");
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

  return (
    <div className="bg-white">
      <section className="bg-[#111a34] text-white">
        <div className="mx-auto max-w-6xl px-6 py-14 lg:px-8">
          <p className="text-blue-300 text-sm font-medium uppercase tracking-wide mb-3">Request Portal</p>
          <h1 className="text-3xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            {requestData.request.topic}
          </h1>
          <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-sm">
            Status: {STATUS_LABELS[requestData.status] || requestData.status}
          </span>
          <span className="ml-3 inline-flex rounded-full bg-[#d4af37]/20 px-3 py-1 text-sm text-[#f8e7ac]">
            Payment: {paymentState}
          </span>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
        {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-[#1a2740] mb-4">Request Details</h2>
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>Name:</strong> {requestData.request.name}</p>
              <p><strong>Email:</strong> {requestData.request.email}</p>
              <p><strong>Service:</strong> {requestData.request.service}</p>
              <p><strong>Region:</strong> {requestData.request.region}</p>
              <p><strong>Timeline:</strong> {requestData.request.urgency || "Not specified"}</p>
              <p><strong>Budget:</strong> {requestData.request.budget || "Not specified"}</p>
            </div>
            <p className="mt-4 text-sm text-gray-700 whitespace-pre-wrap">{requestData.request.description}</p>
          </div>

          <div className="rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-[#1a2740] mb-4">Proposal</h2>
            {requestData.proposal ? (
              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  <strong>Price:</strong> {requestData.proposal.currency} {requestData.proposal.price.toLocaleString()}
                </p>
                <p><strong>Timeline:</strong> {requestData.proposal.timeline || "TBD"}</p>
                <p className="whitespace-pre-wrap">{requestData.proposal.notes || "No notes provided."}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No proposal yet. You will receive an email update once ready.</p>
            )}

            {canRespond ? (
              <div className="mt-6 space-y-3">
                <div className="flex flex-wrap gap-3">
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
                <textarea
                  value={negotiationMessage}
                  onChange={(e) => setNegotiationMessage(e.target.value)}
                  rows={3}
                  placeholder="Write your negotiation request..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => sendAction("negotiate")}
                  className="rounded-lg border border-[#111a34] px-4 py-2 text-sm font-semibold text-[#111a34] hover:bg-[#111a34] hover:text-white disabled:opacity-60"
                >
                  Send Negotiation
                </button>
              </div>
            ) : null}

            {canPay ? (
              <div className="mt-6">
                <button
                  type="button"
                  disabled={busy}
                  onClick={payNow}
                  className="rounded-lg bg-[#d4af37] px-4 py-2 text-sm font-semibold text-[#111a34] hover:bg-[#e4c254] disabled:opacity-60"
                >
                  Pay with PayPal
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-[#1a2740] mb-4">Conversation</h2>
          {requestData.messages.length === 0 ? (
            <p className="text-sm text-gray-500">No messages yet.</p>
          ) : (
            <div className="space-y-3">
              {requestData.messages.map((message) => (
                <div key={message.id} className="rounded-lg bg-gray-50 p-3 text-sm">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {message.authorRole === "owner" ? "Site Owner" : "You"}
                  </p>
                  <p className="whitespace-pre-wrap text-gray-700">{message.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-[#1a2740] mb-4">Delivered Files</h2>
          {!requestData.attachments || requestData.attachments.length === 0 ? (
            <p className="text-sm text-gray-500">No delivered attachments yet.</p>
          ) : (
            <div className="space-y-3">
              {requestData.attachments.map((attachment) => (
                <a
                  key={attachment.id}
                  href={attachment.filePath}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-[#1a2740] hover:bg-gray-100"
                >
                  {attachment.fileName}
                </a>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
