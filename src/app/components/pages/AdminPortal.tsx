import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Image as ImageIcon, Link2, Mail, Type as TypeIcon } from "lucide-react";
import { DEFAULT_SITE_CONTENT, mergeSiteContent, type SiteContent } from "../../content/siteContent";

type RequestSummary = {
  id: string;
  name: string;
  email: string;
  topic: string;
  service: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  proposalPrice: number | null;
};

type RequestDetails = {
  id: string;
  status: string;
  name: string;
  email: string;
  organization: string;
  service: string;
  region: string;
  topic: string;
  urgency: string;
  description: string;
  budget: string;
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
  accessLink: string;
};

type ContentState = {
  homepage: {
    heroImage: string;
    heroAlt: string;
  };
  siteContent: SiteContent;
  updatedAt?: string;
};

type SelectOption = {
  label: string;
  value: string;
};

type VisibleLinkItem = {
  label: string;
  href: string;
  visible: boolean;
};

type VisibleNavItem = {
  name: string;
  href: string;
  visible: boolean;
};

type TitleDescItem = {
  title: string;
  desc: string;
};

type LabelValueItem = {
  label: string;
  value: string;
};

type ContactChannelItem = {
  label: string;
  value: string;
  href: string;
  type: string;
  visible: boolean;
};

type FlatField = {
  path: string;
  value: string;
  isImageLike: boolean;
};

type FieldKind = "text" | "image" | "link" | "email";

type SectionField = FlatField & {
  label: string;
  kind: FieldKind;
};

type ContentSectionDefinition = {
  key: string;
  title: string;
  description: string;
  prefixes: string[];
};

type QuickEditField = {
  path: string;
  label: string;
  description: string;
  kind: "text" | "textarea" | "image" | "link" | "email";
};

const CONTENT_SECTIONS: ContentSectionDefinition[] = [
  {
    key: "header",
    title: "Header",
    description: "Brand name, navigation labels, and top CTA.",
    prefixes: ["siteContent.header."],
  },
  {
    key: "footer",
    title: "Footer",
    description: "Footer links, social links, and contact details.",
    prefixes: ["siteContent.footer."],
  },
  {
    key: "homepage",
    title: "Homepage",
    description: "Hero image/text and homepage sections.",
    prefixes: ["homepage.", "siteContent.pages.homepage."],
  },
  {
    key: "about",
    title: "About",
    description: "About page titles, paragraphs, and call-to-actions.",
    prefixes: ["siteContent.pages.about."],
  },
  {
    key: "insights",
    title: "Insights",
    description: "Insights page labels, filters, and article blocks.",
    prefixes: ["siteContent.pages.insights."],
  },
  {
    key: "media-landscapes",
    title: "Media Landscapes",
    description: "Region cards, report details, and request CTA.",
    prefixes: ["siteContent.pages.mediaLandscapes."],
  },
  {
    key: "profiles",
    title: "Profiles",
    description: "Profile types, sample work, and profile CTAs.",
    prefixes: ["siteContent.pages.profiles."],
  },
  {
    key: "services",
    title: "Services",
    description: "Service card content, process copy, and CTA.",
    prefixes: ["siteContent.pages.services."],
  },
  {
    key: "strategic-briefs",
    title: "Strategic Briefs",
    description: "Brief types, sample briefs, and strategic CTA.",
    prefixes: ["siteContent.pages.strategicBriefs."],
  },
  {
    key: "contact",
    title: "Contact",
    description: "Contact page labels, form copy, and support text.",
    prefixes: ["siteContent.pages.contact."],
  },
  {
    key: "request-analysis",
    title: "Request Analysis",
    description: "Request form labels, dropdown options, and submit copy.",
    prefixes: ["siteContent.pages.requestAnalysis."],
  },
  {
    key: "privacy",
    title: "Privacy",
    description: "Privacy page sections and legal copy.",
    prefixes: ["siteContent.pages.privacy."],
  },
  {
    key: "terms",
    title: "Terms",
    description: "Terms page sections and legal copy.",
    prefixes: ["siteContent.pages.terms."],
  },
  {
    key: "other",
    title: "Other",
    description: "Any additional strings not mapped to a main section.",
    prefixes: [],
  },
];

const QUICK_EDIT_FIELDS: QuickEditField[] = [
  {
    path: "siteContent.header.brandLines[0]",
    label: "Header Brand Line 1",
    description: "Top small brand text in the header.",
    kind: "text",
  },
  {
    path: "siteContent.header.brandLines[1]",
    label: "Header Brand Line 2",
    description: "Main highlighted middle brand word.",
    kind: "text",
  },
  {
    path: "siteContent.header.brandLines[2]",
    label: "Header Brand Line 3",
    description: "Bottom brand word in the header.",
    kind: "text",
  },
  {
    path: "siteContent.header.ctaText",
    label: "Header Button Text",
    description: "Top-right CTA button label.",
    kind: "text",
  },
  {
    path: "homepage.heroImage",
    label: "Homepage Hero Image",
    description: "Main hero image URL/path.",
    kind: "image",
  },
  {
    path: "homepage.heroAlt",
    label: "Homepage Hero Image Alt Text",
    description: "Accessibility description for hero image.",
    kind: "text",
  },
  {
    path: "siteContent.pages.homepage.cta.title",
    label: "Homepage CTA Title",
    description: "Main call-to-action title near the bottom of homepage.",
    kind: "text",
  },
  {
    path: "siteContent.pages.homepage.cta.description",
    label: "Homepage CTA Description",
    description: "Supporting text under the CTA title.",
    kind: "textarea",
  },
  {
    path: "siteContent.footer.social.email",
    label: "Footer Contact Email",
    description: "Public contact email shown in footer.",
    kind: "email",
  },
  {
    path: "siteContent.footer.social.linkedinUrl",
    label: "Footer LinkedIn URL",
    description: "LinkedIn profile/page link.",
    kind: "link",
  },
  {
    path: "siteContent.footer.social.twitterUrl",
    label: "Footer X/Twitter URL",
    description: "X (Twitter) profile/page link.",
    kind: "link",
  },
  {
    path: "siteContent.footer.copyright",
    label: "Footer Copyright Text",
    description: "Copyright line at the bottom of the site.",
    kind: "text",
  },
];

const CONTENT_HIDDEN_PATHS = new Set(["updatedAt", "siteContent.pages.homepage.heroImage", "siteContent.pages.homepage.heroAlt"]);

function isVisibleContentField(path: string): boolean {
  return !CONTENT_HIDDEN_PATHS.has(path);
}

function toLabelCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function resolveFieldSection(path: string): { section: ContentSectionDefinition; prefix: string } {
  for (const section of CONTENT_SECTIONS) {
    if (section.key === "other") {
      continue;
    }
    for (const prefix of section.prefixes) {
      if (path.startsWith(prefix)) {
        return { section, prefix };
      }
    }
  }
  return { section: CONTENT_SECTIONS[CONTENT_SECTIONS.length - 1], prefix: "" };
}

function toFieldLabel(path: string, prefix: string): string {
  const relative = prefix && path.startsWith(prefix) ? path.slice(prefix.length) : path;
  const parts = parsePath(relative);
  if (!parts.length) {
    return toLabelCase(path);
  }
  return parts
    .map((part) => (typeof part === "number" ? `Item ${part + 1}` : toLabelCase(part)))
    .join(" / ");
}

function isLikelyImagePath(path: string): boolean {
  return /image|img|photo|hero|banner|cover|logo|avatar|icon/i.test(path);
}

function canRenderImagePreview(path: string, value: string): boolean {
  if (!value || !isLikelyImagePath(path)) {
    return false;
  }
  return value.startsWith("/") || value.startsWith("http://") || value.startsWith("https://");
}

function isLikelyUrl(value: string): boolean {
  if (!value) {
    return false;
  }
  if (value.startsWith("/")) {
    return true;
  }
  return value.startsWith("http://") || value.startsWith("https://");
}

function isLikelyEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isLikelyLinkPath(path: string): boolean {
  return /url|href|link|website|linkedin|twitter|instagram|facebook|youtube|xUrl|social/i.test(path);
}

function resolveFieldKind(path: string, value: string, isImageLike: boolean): FieldKind {
  if (canRenderImagePreview(path, value) || isImageLike) {
    return "image";
  }
  if (isLikelyEmail(value)) {
    return "email";
  }
  if (isLikelyUrl(value) || isLikelyLinkPath(path)) {
    return "link";
  }
  return "text";
}

function cloneDeep<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function parsePath(path: string): Array<string | number> {
  return path
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .filter(Boolean)
    .map((part) => (/^\d+$/.test(part) ? Number(part) : part));
}

function getByPath(obj: unknown, path: string): unknown {
  const segments = parsePath(path);
  let cursor: unknown = obj;

  for (const segment of segments) {
    if (cursor == null) {
      return undefined;
    }
    if (typeof segment === "number") {
      if (!Array.isArray(cursor)) {
        return undefined;
      }
      cursor = cursor[segment];
      continue;
    }
    if (typeof cursor !== "object") {
      return undefined;
    }
    cursor = (cursor as Record<string, unknown>)[segment];
  }

  return cursor;
}

function setByPath<T>(obj: T, path: string, value: unknown): T {
  const next = cloneDeep(obj);
  const segments = parsePath(path);
  if (!segments.length) {
    return next;
  }

  let cursor: unknown = next;
  for (let i = 0; i < segments.length - 1; i += 1) {
    const key = segments[i];
    const nextKey = segments[i + 1];
    if (typeof key === "number") {
      if (!Array.isArray(cursor)) {
        return next;
      }
      if (cursor[key] == null) {
        cursor[key] = typeof nextKey === "number" ? [] : {};
      }
      cursor = cursor[key];
    } else {
      if (!cursor || typeof cursor !== "object") {
        return next;
      }
      const objectCursor = cursor as Record<string, unknown>;
      if (objectCursor[key] == null) {
        objectCursor[key] = typeof nextKey === "number" ? [] : {};
      }
      cursor = objectCursor[key];
    }
  }

  const finalKey = segments[segments.length - 1];
  if (typeof finalKey === "number") {
    if (!Array.isArray(cursor)) {
      return next;
    }
    cursor[finalKey] = value;
  } else {
    if (!cursor || typeof cursor !== "object") {
      return next;
    }
    (cursor as Record<string, unknown>)[finalKey] = value;
  }

  return next;
}

function normalizeSelectOption(value: unknown): SelectOption {
  if (!value || typeof value !== "object") {
    return { label: "", value: "" };
  }

  const option = value as { label?: unknown; value?: unknown };
  return {
    label: String(option.label ?? "").slice(0, 120),
    value: String(option.value ?? "").slice(0, 120),
  };
}

function normalizeVisibleLinkItem(value: unknown): VisibleLinkItem {
  if (!value || typeof value !== "object") {
    return { label: "", href: "", visible: true };
  }
  const item = value as { label?: unknown; href?: unknown; visible?: unknown };
  return {
    label: String(item.label ?? "").slice(0, 120),
    href: String(item.href ?? "").slice(0, 320),
    visible: item.visible !== false,
  };
}

function normalizeVisibleNavItem(value: unknown): VisibleNavItem {
  if (!value || typeof value !== "object") {
    return { name: "", href: "", visible: true };
  }
  const item = value as { name?: unknown; href?: unknown; visible?: unknown };
  return {
    name: String(item.name ?? "").slice(0, 120),
    href: String(item.href ?? "").slice(0, 320),
    visible: item.visible !== false,
  };
}

function normalizeTitleDescItem(value: unknown): TitleDescItem {
  if (!value || typeof value !== "object") {
    return { title: "", desc: "" };
  }
  const item = value as { title?: unknown; desc?: unknown };
  return {
    title: String(item.title ?? "").slice(0, 160),
    desc: String(item.desc ?? "").slice(0, 600),
  };
}

function normalizeLabelValueItem(value: unknown): LabelValueItem {
  if (!value || typeof value !== "object") {
    return { label: "", value: "" };
  }
  const item = value as { label?: unknown; value?: unknown };
  return {
    label: String(item.label ?? "").slice(0, 160),
    value: String(item.value ?? "").slice(0, 320),
  };
}

function normalizeContactChannelItem(value: unknown): ContactChannelItem {
  if (!value || typeof value !== "object") {
    return { label: "", value: "", href: "", type: "other", visible: true };
  }
  const item = value as { label?: unknown; value?: unknown; href?: unknown; type?: unknown; visible?: unknown };
  return {
    label: String(item.label ?? "").slice(0, 120),
    value: String(item.value ?? "").slice(0, 200),
    href: String(item.href ?? "").slice(0, 320),
    type: String(item.type ?? "other").slice(0, 40) || "other",
    visible: item.visible !== false,
  };
}

function flattenStringFields(value: unknown, prefix = ""): FlatField[] {
  const fields: FlatField[] = [];

  if (typeof value === "string") {
    fields.push({
      path: prefix,
      value,
      isImageLike: /image|img|url|src|logo|avatar|icon|href|email/i.test(prefix),
    });
    return fields;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      const nextPrefix = `${prefix}[${index}]`;
      fields.push(...flattenStringFields(item, nextPrefix));
    });
    return fields;
  }

  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      const nextPrefix = prefix ? `${prefix}.${key}` : key;
      fields.push(...flattenStringFields(item, nextPrefix));
    }
  }

  return fields;
}

function buildContentStateFromApi(payloadContent: unknown): ContentState {
  const content = payloadContent as Partial<ContentState> & {
    siteContent?: unknown;
    homepage?: { heroImage?: string; heroAlt?: string };
    updatedAt?: string;
  };

  const mergedSiteContent = mergeSiteContent(content?.siteContent || {});
  const heroImage = String(content?.homepage?.heroImage || "").trim() || mergedSiteContent.pages.homepage.heroImage;
  const heroAlt = String(content?.homepage?.heroAlt || "").trim() || mergedSiteContent.pages.homepage.heroAlt;

  return {
    homepage: {
      heroImage,
      heroAlt,
    },
    siteContent: {
      ...mergedSiteContent,
      pages: {
        ...mergedSiteContent.pages,
        homepage: {
          ...mergedSiteContent.pages.homepage,
          heroImage,
          heroAlt,
        },
      },
    },
    updatedAt: String(content?.updatedAt || ""),
  };
}

export function AdminPortal() {
  const [token, setToken] = useState(() => localStorage.getItem("memi_admin_token") || "");
  const [tab, setTab] = useState<"requests" | "content" | "settings">("requests");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const [requests, setRequests] = useState<RequestSummary[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<RequestDetails | null>(null);
  const [proposalPrice, setProposalPrice] = useState("");
  const [proposalCurrency, setProposalCurrency] = useState("USD");
  const [proposalTimeline, setProposalTimeline] = useState("");
  const [proposalNotes, setProposalNotes] = useState("");
  const [ownerMessage, setOwnerMessage] = useState("");
  const [uploadNotice, setUploadNotice] = useState("");

  const [contentState, setContentState] = useState<ContentState>({
    homepage: { heroImage: "", heroAlt: "" },
    siteContent: DEFAULT_SITE_CONTENT,
    updatedAt: "",
  });
  const [contentDraft, setContentDraft] = useState<ContentState>({
    homepage: { heroImage: "", heroAlt: "" },
    siteContent: DEFAULT_SITE_CONTENT,
    updatedAt: "",
  });
  const [contentMode, setContentMode] = useState<"edit" | "preview">("edit");
  const [contentFilter, setContentFilter] = useState("");
  const [contentSaved, setContentSaved] = useState("");
  const [activeContentSection, setActiveContentSection] = useState("header");
  const [activeFieldKind, setActiveFieldKind] = useState<"all" | FieldKind>("all");

  const [settingsEmail, setSettingsEmail] = useState("");
  const [settingsCurrentPassword, setSettingsCurrentPassword] = useState("");
  const [settingsNewPassword, setSettingsNewPassword] = useState("");
  const [settingsMessage, setSettingsMessage] = useState("");

  const authHeaders = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }),
    [token],
  );

  const loadRequests = async () => {
    const response = await fetch("/api/admin/requests", { headers: authHeaders });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Failed to load requests");
    }
    setRequests(payload.requests || []);
    if (!selectedId && payload.requests?.length) {
      setSelectedId(payload.requests[0].id);
    }
  };

  const loadSelectedRequest = async (requestId: string) => {
    if (!requestId) {
      setSelectedRequest(null);
      return;
    }
    const response = await fetch(`/api/admin/requests/${requestId}`, { headers: authHeaders });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Failed to load request details");
    }
    setSelectedRequest(payload.request);
    setProposalPrice(payload.request?.proposal?.price?.toString() || "");
    setProposalCurrency(payload.request?.proposal?.currency || "USD");
    setProposalTimeline(payload.request?.proposal?.timeline || "");
    setProposalNotes(payload.request?.proposal?.notes || "");
  };

  const loadContent = async () => {
    const response = await fetch("/api/admin/content", { headers: authHeaders });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Failed to load content");
    }
    const nextContent = buildContentStateFromApi(payload.content);
    setContentState(nextContent);
    setContentDraft(nextContent);
    setContentMode("edit");
  };

  const loadSettings = async () => {
    const response = await fetch("/api/admin/settings", { headers: authHeaders });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Failed to load settings");
    }
    setSettingsEmail(payload.admin?.email || "");
  };

  useEffect(() => {
    if (!token) {
      return;
    }

    const boot = async () => {
      try {
        setLoading(true);
        setApiError("");
        await Promise.all([loadRequests(), loadContent(), loadSettings()]);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load admin data";
        setApiError(message);
      } finally {
        setLoading(false);
      }
    };

    boot();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!token || !selectedId) {
      return;
    }

    const fetchSelected = async () => {
      try {
        setApiError("");
        await loadSelectedRequest(selectedId);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load request";
        setApiError(message);
      }
    };

    fetchSelected();
  }, [selectedId, token]); // eslint-disable-line react-hooks/exhaustive-deps

  const login = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoginError("");
    try {
      setLoading(true);
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Invalid credentials");
      }
      localStorage.setItem("memi_admin_token", payload.token);
      setToken(payload.token);
      setLoginPassword("");
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Unable to login");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (token) {
      try {
        await fetch("/api/admin/logout", {
          method: "POST",
          headers: authHeaders,
        });
      } catch {
        // Best effort only.
      }
    }

    localStorage.removeItem("memi_admin_token");
    setToken("");
    setRequests([]);
    setSelectedId("");
    setSelectedRequest(null);
    setApiError("");
  };

  const sendProposal = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedRequest) {
      return;
    }
    try {
      setApiError("");
      const response = await fetch(`/api/admin/requests/${selectedRequest.id}/proposal`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          price: Number(proposalPrice),
          currency: proposalCurrency,
          timeline: proposalTimeline,
          notes: proposalNotes,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to send proposal");
      }
      setSelectedRequest(payload.request);
      await loadRequests();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Unable to send proposal");
    }
  };

  const sendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedRequest || !ownerMessage.trim()) {
      return;
    }
    try {
      setApiError("");
      const response = await fetch(`/api/admin/requests/${selectedRequest.id}/message`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ message: ownerMessage.trim() }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to send message");
      }
      setSelectedRequest(payload.request);
      setOwnerMessage("");
      await loadRequests();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Unable to send message");
    }
  };

  const updateStatus = async (status: string) => {
    if (!selectedRequest) {
      return;
    }
    try {
      setApiError("");
      const response = await fetch(`/api/admin/requests/${selectedRequest.id}/status`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ status }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to update status");
      }
      setSelectedRequest(payload.request);
      await loadRequests();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Unable to update status");
    }
  };

  const uploadImageFile = async (
    file: File,
    endpoint: "/api/admin/uploads/site-image" | "/api/admin/uploads/article-image",
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Upload failed");
    }
    return payload.file?.path || "";
  };

  const handleSiteImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    try {
      setApiError("");
      const path = await uploadImageFile(file, "/api/admin/uploads/site-image");
      if (path) {
        updateDraftField("homepage.heroImage", path);
        setUploadNotice(`Site image uploaded: ${path}`);
      }
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Unable to upload site image");
    } finally {
      event.target.value = "";
    }
  };

  const handleArticleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    try {
      setApiError("");
      const path = await uploadImageFile(file, "/api/admin/uploads/article-image");
      setUploadNotice(`Article image uploaded: ${path}`);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Unable to upload article image");
    } finally {
      event.target.value = "";
    }
  };

  const handleAttachmentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedRequest) {
      return;
    }
    try {
      setApiError("");
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`/api/admin/requests/${selectedRequest.id}/attachments/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to upload attachment");
      }
      setSelectedRequest(payload.request);
      setUploadNotice(`Attachment uploaded: ${file.name}`);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Unable to upload attachment");
    } finally {
      event.target.value = "";
    }
  };

  const allDraftFields = useMemo(() => {
    const fields = flattenStringFields(contentDraft).filter((entry) => isVisibleContentField(entry.path));
    const normalizedFilter = contentFilter.trim().toLowerCase();
    if (!normalizedFilter) {
      return fields;
    }
    return fields.filter((entry) => {
      return (
        entry.path.toLowerCase().includes(normalizedFilter) ||
        entry.value.toLowerCase().includes(normalizedFilter)
      );
    });
  }, [contentDraft, contentFilter]);

  const sectionedDraftFields = useMemo(() => {
    const grouped: Record<string, SectionField[]> = {};
    for (const section of CONTENT_SECTIONS) {
      grouped[section.key] = [];
    }

    for (const field of allDraftFields) {
      const { section, prefix } = resolveFieldSection(field.path);
      grouped[section.key].push({
        ...field,
        label: toFieldLabel(field.path, prefix),
        kind: resolveFieldKind(field.path, field.value, field.isImageLike),
      });
    }

    for (const section of CONTENT_SECTIONS) {
      grouped[section.key].sort((left, right) => left.path.localeCompare(right.path));
    }

    return grouped;
  }, [allDraftFields]);

  const fieldMetaByPath = useMemo(() => {
    const map = new Map<string, SectionField>();
    for (const section of CONTENT_SECTIONS) {
      for (const field of sectionedDraftFields[section.key] || []) {
        map.set(field.path, field);
      }
    }
    return map;
  }, [sectionedDraftFields]);

  const sectionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const section of CONTENT_SECTIONS) {
      counts[section.key] = sectionedDraftFields[section.key]?.length || 0;
    }
    return counts;
  }, [sectionedDraftFields]);

  const activeSectionDefinition = useMemo(
    () => CONTENT_SECTIONS.find((section) => section.key === activeContentSection) || CONTENT_SECTIONS[0],
    [activeContentSection],
  );

  const activeSectionFields = useMemo(() => sectionedDraftFields[activeContentSection] || [], [activeContentSection, sectionedDraftFields]);

  const changedFields = useMemo(() => {
    const baseline = new Map(
      flattenStringFields(contentState)
        .filter((entry) => isVisibleContentField(entry.path))
        .map((entry) => [entry.path, entry.value]),
    );
    const draft = flattenStringFields(contentDraft).filter((entry) => isVisibleContentField(entry.path));
    return draft
      .filter((entry) => baseline.get(entry.path) !== entry.value)
      .map((entry) => ({ ...entry, previousValue: baseline.get(entry.path) || "" }));
  }, [contentDraft, contentState]);

  const changedPathSet = useMemo(() => new Set(changedFields.map((field) => field.path)), [changedFields]);
  const hasNonStringDraftChanges = useMemo(
    () => JSON.stringify(contentDraft) !== JSON.stringify(contentState),
    [contentDraft, contentState],
  );

  const activeKindCounts = useMemo(() => {
    const counts: Record<"all" | FieldKind, number> = {
      all: activeSectionFields.length,
      text: 0,
      image: 0,
      link: 0,
      email: 0,
    };

    for (const field of activeSectionFields) {
      counts[field.kind] += 1;
    }

    return counts;
  }, [activeSectionFields]);

  const filteredActiveSectionFields = useMemo(() => {
    if (activeFieldKind === "all") {
      return activeSectionFields;
    }
    return activeSectionFields.filter((field) => field.kind === activeFieldKind);
  }, [activeFieldKind, activeSectionFields]);

  const requestFormServiceOptions = useMemo(() => {
    const raw = getByPath(contentDraft, "siteContent.pages.requestAnalysis.serviceOptions");
    if (!Array.isArray(raw)) {
      return [] as SelectOption[];
    }
    return raw.map((entry) => normalizeSelectOption(entry));
  }, [contentDraft]);

  const requestFormTimelineOptions = useMemo(() => {
    const raw = getByPath(contentDraft, "siteContent.pages.requestAnalysis.urgencyOptions");
    if (!Array.isArray(raw)) {
      return [] as SelectOption[];
    }
    return raw.map((entry) => normalizeSelectOption(entry));
  }, [contentDraft]);

  const requestFormBudgetOptions = useMemo(() => {
    const raw = getByPath(contentDraft, "siteContent.pages.requestAnalysis.budgetOptions");
    if (!Array.isArray(raw)) {
      return [] as SelectOption[];
    }
    return raw.map((entry) => normalizeSelectOption(entry));
  }, [contentDraft]);

  const showHomepageReportPrices = Boolean(getByPath(contentDraft, "siteContent.pages.homepage.reportsIntro.showPrices"));
  const showServicesPricing = Boolean(getByPath(contentDraft, "siteContent.pages.services.showPricing"));
  const showStrategicBriefsPricing = Boolean(getByPath(contentDraft, "siteContent.pages.strategicBriefs.showPricing"));
  const showBudgetField = Boolean(getByPath(contentDraft, "siteContent.pages.requestAnalysis.showBudgetField"));
  const requestFormOptionEditors = [
    {
      title: "Service Types",
      description: "Shown in the request form service dropdown.",
      path: "siteContent.pages.requestAnalysis.serviceOptions",
      options: requestFormServiceOptions,
    },
    {
      title: "Durations / Timeline Options",
      description: "Shown in the request form timeline dropdown.",
      path: "siteContent.pages.requestAnalysis.urgencyOptions",
      options: requestFormTimelineOptions,
    },
    {
      title: "Budget Range Options",
      description: "Shown only when budget field is enabled.",
      path: "siteContent.pages.requestAnalysis.budgetOptions",
      options: requestFormBudgetOptions,
    },
  ] as const;

  const headerNavigationItems = useMemo(() => {
    const raw = getByPath(contentDraft, "siteContent.header.navigation");
    if (!Array.isArray(raw)) {
      return [] as VisibleNavItem[];
    }
    return raw.map((entry) => normalizeVisibleNavItem(entry));
  }, [contentDraft]);

  const footerServicesLinks = useMemo(() => {
    const raw = getByPath(contentDraft, "siteContent.footer.servicesLinks");
    if (!Array.isArray(raw)) {
      return [] as VisibleLinkItem[];
    }
    return raw.map((entry) => normalizeVisibleLinkItem(entry));
  }, [contentDraft]);

  const footerResourcesLinks = useMemo(() => {
    const raw = getByPath(contentDraft, "siteContent.footer.resourcesLinks");
    if (!Array.isArray(raw)) {
      return [] as VisibleLinkItem[];
    }
    return raw.map((entry) => normalizeVisibleLinkItem(entry));
  }, [contentDraft]);

  const footerConnectLinks = useMemo(() => {
    const raw = getByPath(contentDraft, "siteContent.footer.connectLinks");
    if (!Array.isArray(raw)) {
      return [] as VisibleLinkItem[];
    }
    return raw.map((entry) => normalizeVisibleLinkItem(entry));
  }, [contentDraft]);

  const insightsCategories = useMemo(() => {
    const raw = getByPath(contentDraft, "siteContent.pages.insights.categories");
    if (!Array.isArray(raw)) {
      return [] as string[];
    }
    return raw.map((entry) => String(entry ?? "").slice(0, 100));
  }, [contentDraft]);

  const mediaLandscapeReportItems = useMemo(() => {
    const raw = getByPath(contentDraft, "siteContent.pages.mediaLandscapes.reportContents.items");
    if (!Array.isArray(raw)) {
      return [] as TitleDescItem[];
    }
    return raw.map((entry) => normalizeTitleDescItem(entry));
  }, [contentDraft]);

  const mediaLandscapeRequestRows = useMemo(() => {
    const raw = getByPath(contentDraft, "siteContent.pages.mediaLandscapes.requestCard.pricingRows");
    if (!Array.isArray(raw)) {
      return [] as LabelValueItem[];
    }
    return raw.map((entry) => normalizeLabelValueItem(entry));
  }, [contentDraft]);

  const profileCtaRows = useMemo(() => {
    const raw = getByPath(contentDraft, "siteContent.pages.profiles.cta.pricingRows");
    if (!Array.isArray(raw)) {
      return [] as LabelValueItem[];
    }
    return raw.map((entry) => normalizeLabelValueItem(entry));
  }, [contentDraft]);

  const contactChannels = useMemo(() => {
    const raw = getByPath(contentDraft, "siteContent.pages.contact.channels");
    if (!Array.isArray(raw)) {
      return [] as ContactChannelItem[];
    }
    return raw.map((entry) => normalizeContactChannelItem(entry));
  }, [contentDraft]);

  const footerLinkEditors = [
    {
      title: "Footer Services Links",
      path: "siteContent.footer.servicesLinks",
      items: footerServicesLinks,
    },
    {
      title: "Footer Resources Links",
      path: "siteContent.footer.resourcesLinks",
      items: footerResourcesLinks,
    },
    {
      title: "Footer Connect Links",
      path: "siteContent.footer.connectLinks",
      items: footerConnectLinks,
    },
  ] as const;

  useEffect(() => {
    if ((sectionedDraftFields[activeContentSection] || []).length > 0) {
      return;
    }

    const firstWithFields = CONTENT_SECTIONS.find((section) => (sectionedDraftFields[section.key] || []).length > 0);
    if (firstWithFields) {
      setActiveContentSection(firstWithFields.key);
    }
  }, [activeContentSection, sectionedDraftFields]);

  useEffect(() => {
    if (activeFieldKind === "all") {
      return;
    }
    if (activeKindCounts[activeFieldKind] === 0) {
      setActiveFieldKind("all");
    }
  }, [activeFieldKind, activeKindCounts]);

  const resetContentDraft = () => {
    setContentDraft(contentState);
    setContentMode("edit");
    setContentSaved("");
    setApiError("");
  };

  const previewContentDraft = () => {
    setApiError("");
    setContentSaved("");
    setContentMode("preview");
  };

  const confirmSaveContent = async () => {
    try {
      setApiError("");
      setContentSaved("");
      const response = await fetch("/api/admin/content", {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify(contentDraft),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to save content");
      }
      const nextContent = buildContentStateFromApi(payload.content);
      setContentState(nextContent);
      setContentDraft(nextContent);
      setContentMode("edit");
      setContentSaved("Content changes were saved.");
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Unable to save content");
    }
  };

  const updateDraftValue = (path: string, value: unknown) => {
    setContentDraft((previous) => {
      const nextDraft = setByPath(previous, path, value);
      if (typeof value === "string" && (path === "homepage.heroImage" || path === "siteContent.pages.homepage.heroImage")) {
        const withLegacy = setByPath(nextDraft, "homepage.heroImage", value);
        return setByPath(withLegacy, "siteContent.pages.homepage.heroImage", value);
      }
      if (typeof value === "string" && (path === "homepage.heroAlt" || path === "siteContent.pages.homepage.heroAlt")) {
        const withLegacy = setByPath(nextDraft, "homepage.heroAlt", value);
        return setByPath(withLegacy, "siteContent.pages.homepage.heroAlt", value);
      }
      return nextDraft;
    });
  };

  const updateDraftField = (path: string, value: string) => {
    updateDraftValue(path, value);
  };

  const updateOptionList = (path: string, updater: (options: SelectOption[]) => SelectOption[]) => {
    setContentDraft((previous) => {
      const currentRaw = getByPath(previous, path);
      const currentOptions = Array.isArray(currentRaw) ? currentRaw.map((entry) => normalizeSelectOption(entry)) : [];
      const nextOptions = updater(currentOptions);
      return setByPath(previous, path, nextOptions);
    });
  };

  const setOptionFieldValue = (path: string, index: number, key: "label" | "value", value: string) => {
    updateOptionList(path, (options) =>
      options.map((option, optionIndex) => (optionIndex === index ? { ...option, [key]: value.slice(0, 120) } : option)),
    );
  };

  const addOptionToList = (path: string) => {
    updateOptionList(path, (options) => [...options, { label: "New option", value: "" }]);
  };

  const removeOptionFromList = (path: string, index: number) => {
    updateOptionList(path, (options) => {
      if (options.length <= 1) {
        return options;
      }
      return options.filter((_, optionIndex) => optionIndex !== index);
    });
  };

  const updateNavList = (path: string, updater: (items: VisibleNavItem[]) => VisibleNavItem[]) => {
    setContentDraft((previous) => {
      const currentRaw = getByPath(previous, path);
      const currentItems = Array.isArray(currentRaw) ? currentRaw.map((entry) => normalizeVisibleNavItem(entry)) : [];
      const nextItems = updater(currentItems);
      return setByPath(previous, path, nextItems);
    });
  };

  const updateLinkList = (path: string, updater: (items: VisibleLinkItem[]) => VisibleLinkItem[]) => {
    setContentDraft((previous) => {
      const currentRaw = getByPath(previous, path);
      const currentItems = Array.isArray(currentRaw) ? currentRaw.map((entry) => normalizeVisibleLinkItem(entry)) : [];
      const nextItems = updater(currentItems);
      return setByPath(previous, path, nextItems);
    });
  };

  const updateStringList = (path: string, updater: (items: string[]) => string[]) => {
    setContentDraft((previous) => {
      const currentRaw = getByPath(previous, path);
      const currentItems = Array.isArray(currentRaw) ? currentRaw.map((entry) => String(entry ?? "").slice(0, 100)) : [];
      const nextItems = updater(currentItems);
      return setByPath(previous, path, nextItems);
    });
  };

  const updateTitleDescList = (path: string, updater: (items: TitleDescItem[]) => TitleDescItem[]) => {
    setContentDraft((previous) => {
      const currentRaw = getByPath(previous, path);
      const currentItems = Array.isArray(currentRaw) ? currentRaw.map((entry) => normalizeTitleDescItem(entry)) : [];
      const nextItems = updater(currentItems);
      return setByPath(previous, path, nextItems);
    });
  };

  const updateLabelValueList = (path: string, updater: (items: LabelValueItem[]) => LabelValueItem[]) => {
    setContentDraft((previous) => {
      const currentRaw = getByPath(previous, path);
      const currentItems = Array.isArray(currentRaw) ? currentRaw.map((entry) => normalizeLabelValueItem(entry)) : [];
      const nextItems = updater(currentItems);
      return setByPath(previous, path, nextItems);
    });
  };

  const updateContactChannelsList = (path: string, updater: (items: ContactChannelItem[]) => ContactChannelItem[]) => {
    setContentDraft((previous) => {
      const currentRaw = getByPath(previous, path);
      const currentItems = Array.isArray(currentRaw) ? currentRaw.map((entry) => normalizeContactChannelItem(entry)) : [];
      const nextItems = updater(currentItems);
      return setByPath(previous, path, nextItems);
    });
  };

  const saveSettings = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setApiError("");
      setSettingsMessage("");
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({
          email: settingsEmail,
          currentPassword: settingsCurrentPassword,
          newPassword: settingsNewPassword,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to update settings");
      }
      setSettingsEmail(payload.admin?.email || settingsEmail);
      setSettingsCurrentPassword("");
      setSettingsNewPassword("");
      setSettingsMessage(payload.passwordChanged ? "Account updated. Password changed successfully." : "Account updated.");
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Unable to update settings");
    }
  };

  if (!token) {
    return (
      <div className="bg-white min-h-[80vh] flex items-center justify-center px-6">
        <form onSubmit={login} className="w-full max-w-md rounded-xl border border-gray-200 p-8">
          <h1 className="text-2xl font-bold text-[#1a2740] mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
            Owner Portal
          </h1>
          {loginError ? <p className="mb-4 text-sm text-red-600">{loginError}</p> : null}
          <div className="space-y-4">
            <input
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="Admin email"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#111a34] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1a2b52] disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-[85vh]">
      <section className="border-b border-gray-200 bg-[#111a34] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/60">Admin Portal</p>
            <h1 className="text-xl font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>Site Owner Dashboard</h1>
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-lg border border-white/20 px-3 py-2 text-sm hover:bg-white/10"
          >
            Logout
          </button>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="mb-6 flex gap-2">
          <button
            type="button"
            onClick={() => setTab("requests")}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              tab === "requests" ? "bg-[#111a34] text-white" : "bg-gray-100 text-gray-700"
            }`}
          >
            Requests
          </button>
          <button
            type="button"
            onClick={() => setTab("content")}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              tab === "content" ? "bg-[#111a34] text-white" : "bg-gray-100 text-gray-700"
            }`}
          >
            Content Review
          </button>
          <button
            type="button"
            onClick={() => setTab("settings")}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              tab === "settings" ? "bg-[#111a34] text-white" : "bg-gray-100 text-gray-700"
            }`}
          >
            Account Settings
          </button>
        </div>

        {apiError ? <p className="mb-4 text-sm text-red-600">{apiError}</p> : null}
        {contentSaved ? <p className="mb-4 text-sm text-green-600">{contentSaved}</p> : null}
        {uploadNotice ? <p className="mb-4 text-sm text-green-600">{uploadNotice}</p> : null}

        {tab === "requests" ? (
          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <div className="rounded-xl border border-gray-200 p-4">
              <h2 className="mb-3 text-sm font-semibold text-[#1a2740]">Incoming Requests</h2>
              <div className="space-y-2">
                {requests.map((requestItem) => (
                  <button
                    type="button"
                    key={requestItem.id}
                    onClick={() => setSelectedId(requestItem.id)}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                      selectedId === requestItem.id
                        ? "border-[#111a34] bg-[#111a34]/5"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <p className="font-semibold text-[#1a2740]">{requestItem.name}</p>
                    <p className="text-xs text-gray-500">{requestItem.topic}</p>
                    <p className="text-xs text-gray-500">Status: {requestItem.status}</p>
                  </button>
                ))}
                {!requests.length ? <p className="text-sm text-gray-500">No requests yet.</p> : null}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-6">
              {!selectedRequest ? (
                <p className="text-sm text-gray-500">Select a request to view details.</p>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-[#1a2740] mb-2">{selectedRequest.topic}</h2>
                    <p className="text-sm text-gray-600">
                      {selectedRequest.name} ({selectedRequest.email})
                    </p>
                    <p className="text-sm text-gray-600">Status: {selectedRequest.status}</p>
                    <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{selectedRequest.description}</p>
                    <a
                      href={selectedRequest.accessLink}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-block text-sm text-blue-700 underline"
                    >
                      Open public request link
                    </a>
                    <div className="mt-4 rounded-lg border border-gray-200 p-3">
                      <p className="mb-2 text-sm font-semibold text-[#1a2740]">Delivered Attachments</p>
                      <label className="inline-flex cursor-pointer rounded-lg border border-[#111a34] px-3 py-1.5 text-xs font-semibold text-[#111a34] hover:bg-[#111a34] hover:text-white">
                        Upload Report / Insight
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp,.pdf"
                          onChange={handleAttachmentUpload}
                          className="hidden"
                        />
                      </label>
                      {selectedRequest.attachments?.length ? (
                        <div className="mt-3 space-y-2">
                          {selectedRequest.attachments.map((attachment) => (
                            <a
                              key={attachment.id}
                              href={attachment.filePath}
                              target="_blank"
                              rel="noreferrer"
                              className="block rounded-md bg-gray-50 px-3 py-2 text-xs text-[#1a2740] hover:bg-gray-100"
                            >
                              {attachment.fileName}
                            </a>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-gray-500">No attachments uploaded yet.</p>
                      )}
                    </div>
                  </div>

                  <form onSubmit={sendProposal} className="rounded-lg border border-gray-200 p-4">
                    <h3 className="mb-3 text-sm font-semibold text-[#1a2740]">Send Price Proposal</h3>
                    <div className="grid gap-3 md:grid-cols-2">
                      <input
                        type="number"
                        min="1"
                        value={proposalPrice}
                        onChange={(e) => setProposalPrice(e.target.value)}
                        placeholder="Price"
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        required
                      />
                      <input
                        type="text"
                        value={proposalCurrency}
                        onChange={(e) => setProposalCurrency(e.target.value)}
                        placeholder="Currency"
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                      />
                      <input
                        type="text"
                        value={proposalTimeline}
                        onChange={(e) => setProposalTimeline(e.target.value)}
                        placeholder="Timeline"
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm md:col-span-2"
                      />
                      <textarea
                        rows={3}
                        value={proposalNotes}
                        onChange={(e) => setProposalNotes(e.target.value)}
                        placeholder="Notes shown to the client"
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm md:col-span-2"
                      />
                    </div>
                    <button
                      type="submit"
                      className="mt-3 rounded-lg bg-[#111a34] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1a2b52]"
                    >
                      Send Proposal
                    </button>
                  </form>

                  <form onSubmit={sendMessage} className="rounded-lg border border-gray-200 p-4">
                    <h3 className="mb-3 text-sm font-semibold text-[#1a2740]">Reply to Client</h3>
                    <textarea
                      rows={3}
                      value={ownerMessage}
                      onChange={(e) => setOwnerMessage(e.target.value)}
                      placeholder="Write a message..."
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                    <button
                      type="submit"
                      className="mt-3 rounded-lg border border-[#111a34] px-4 py-2 text-sm font-semibold text-[#111a34] hover:bg-[#111a34] hover:text-white"
                    >
                      Send Message
                    </button>
                  </form>

                  <div className="rounded-lg border border-gray-200 p-4">
                    <h3 className="mb-3 text-sm font-semibold text-[#1a2740]">Quick Status</h3>
                    <div className="flex flex-wrap gap-2">
                      {["proposal_sent", "proposal_updated", "accepted_pending_payment", "paid", "rejected"].map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => updateStatus(status)}
                          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {tab === "content" ? (
          <div className="rounded-xl border border-gray-200 p-6">
            <div className="mb-5 flex flex-wrap items-center gap-3 justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#1a2740]">Content Editor</h2>
                <p className="text-sm text-gray-500">Simple editing for text, photos, and links. No technical setup needed.</p>
              </div>
              <div className="flex gap-2">
                {contentMode === "edit" ? (
                  <button
                    type="button"
                    onClick={previewContentDraft}
                    className="rounded-lg bg-[#111a34] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1a2b52]"
                  >
                    Preview Changes
                  </button>
                ) : null}

                {contentMode === "preview" ? (
                  <>
                    <button
                      type="button"
                      onClick={confirmSaveContent}
                      className="rounded-lg bg-[#111a34] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1a2b52]"
                    >
                      Publish Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => setContentMode("edit")}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Back to Editing
                    </button>
                  </>
                ) : null}

                <button
                  type="button"
                  onClick={resetContentDraft}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Discard Draft
                </button>
              </div>
            </div>

            <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-[#1a2740]">Quick guide</h3>
                  <p className="mt-1 text-xs text-gray-600">
                    1. Edit values directly. 2. Check preview. 3. Click <strong>Publish Changes</strong>.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#1a2740]">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                  {hasNonStringDraftChanges
                    ? `${changedFields.length > 0 ? changedFields.length : "Some"} unsaved change${changedFields.length === 1 ? "" : "s"}`
                    : "No unsaved changes"}
                </span>
              </div>
            </div>

            <div className="mb-6 rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-[#1a2740]">Media Uploads</h3>
              <p className="mt-1 text-xs text-gray-500">Upload approved files and paste/use their generated paths.</p>
              <div className="mt-3 flex flex-wrap gap-3">
                <label className="inline-flex cursor-pointer rounded-lg border border-[#111a34] px-3 py-2 text-xs font-semibold text-[#111a34] hover:bg-[#111a34] hover:text-white">
                  Upload Site Image
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={handleSiteImageUpload}
                    className="hidden"
                  />
                </label>
                <label className="inline-flex cursor-pointer rounded-lg border border-[#111a34] px-3 py-2 text-xs font-semibold text-[#111a34] hover:bg-[#111a34] hover:text-white">
                  Upload Article Image
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={handleArticleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="mt-2 text-xs text-gray-500">Allowed: jpg, jpeg, png, webp. Max size enforced by backend.</p>
            </div>

            <div className="mb-6 rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-[#1a2740]">Current Layout Preview</h3>
              <p className="mt-1 text-xs text-gray-500">Header, homepage hero, and footer snapshot from current content draft.</p>

              <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
                <div className="bg-[#111a34] px-4 py-4 text-white">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="leading-none" style={{ fontFamily: "'Playfair Display', serif" }}>
                      <span className="block text-[11px] uppercase tracking-[0.2em] text-white/70">
                        {contentDraft.siteContent.header.brandLines[0] || ""}
                      </span>
                      <span className="block text-xl font-semibold leading-[0.9] text-[#d4af37]">
                        {contentDraft.siteContent.header.brandLines[1] || ""}
                      </span>
                      <span className="block text-lg font-semibold text-[#dbe5f5]">
                        {contentDraft.siteContent.header.brandLines[2] || ""}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/80">
                      {contentDraft.siteContent.header.navigation.filter((item) => item?.visible !== false).map((item) => (
                        <span key={`${item.name}-${item.href}`}>{item.name}</span>
                      ))}
                    </div>
                    <span className="rounded-md bg-[#d4af37] px-3 py-1 text-[11px] font-semibold text-[#111a34]">
                      {contentDraft.siteContent.header.ctaText}
                    </span>
                  </div>
                </div>

                <div className="bg-[#efe7df]">
                  {contentDraft.homepage.heroImage ? (
                    <img
                      src={contentDraft.homepage.heroImage}
                      alt={contentDraft.homepage.heroAlt || "Hero preview"}
                      className="h-44 w-full object-cover sm:h-56"
                    />
                  ) : (
                    <div className="flex h-44 items-center justify-center text-sm text-gray-500 sm:h-56">
                      No hero image set
                    </div>
                  )}
                </div>

                <div className="grid gap-3 bg-[#111a34] px-4 py-4 text-[11px] text-white/80 sm:grid-cols-3">
                  <div>
                    <p className="mb-1 text-white">{contentDraft.siteContent.footer.servicesTitle}</p>
                    <p>{contentDraft.siteContent.footer.servicesLinks.find((item) => item?.visible !== false)?.label || ""}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-white">{contentDraft.siteContent.footer.resourcesTitle}</p>
                    <p>{contentDraft.siteContent.footer.resourcesLinks.find((item) => item?.visible !== false)?.label || ""}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-white">{contentDraft.siteContent.footer.connectTitle}</p>
                    <p>{contentDraft.siteContent.footer.social.linkedinUrl}</p>
                  </div>
                </div>
              </div>
            </div>

            {contentMode === "preview" ? (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-[#1a2740]">Changed fields ({changedFields.length})</h3>
                {!changedFields.length ? (
                  <p className="text-sm text-gray-500">
                    {hasNonStringDraftChanges
                      ? "Non-text settings changed (toggles, visibility, or list structure). Publish to save."
                      : "No changes to save."}
                  </p>
                ) : (
                  changedFields.map((field) => (
                    <div key={field.path} className="rounded-lg border border-gray-200 p-3 text-sm">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#1a2740]">
                        {fieldMetaByPath.get(field.path)?.label || field.path}
                      </p>
                      <p className="text-gray-500 line-through whitespace-pre-wrap">{field.previousValue}</p>
                      <p className="text-[#1a2740] whitespace-pre-wrap">{field.value}</p>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="rounded-xl border border-gray-200 p-4">
                  <h3 className="text-sm font-semibold text-[#1a2740]">Quick Edit Essentials</h3>
                  <p className="mt-1 text-xs text-gray-500">Most frequently changed content fields.</p>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {QUICK_EDIT_FIELDS.map((field) => {
                      const currentValue = String(getByPath(contentDraft, field.path) ?? "");
                      const changed = changedPathSet.has(field.path);

                      return (
                        <div key={field.path} className="rounded-lg border border-gray-200 p-3">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-[#1a2740]">{field.label}</p>
                            {changed ? (
                              <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                                Edited
                              </span>
                            ) : null}
                          </div>
                          <p className="mb-2 text-xs text-gray-500">{field.description}</p>

                          {field.kind === "textarea" ? (
                            <textarea
                              value={currentValue}
                              rows={3}
                              onChange={(e) => updateDraftField(field.path, e.target.value)}
                              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-y"
                            />
                          ) : (
                            <input
                              type="text"
                              value={currentValue}
                              onChange={(e) => updateDraftField(field.path, e.target.value)}
                              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                            />
                          )}

                          {field.kind === "image" && canRenderImagePreview(field.path, currentValue) ? (
                            <img
                              src={currentValue}
                              alt={field.label}
                              className="mt-3 h-24 w-full rounded-lg border border-gray-200 object-cover"
                            />
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 p-4">
                  <h3 className="text-sm font-semibold text-[#1a2740]">Request Form & Pricing Controls</h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Control whether prices and budget fields are shown, and manage request form dropdown options.
                  </p>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3">
                      <input
                        type="checkbox"
                        checked={showHomepageReportPrices}
                        onChange={(event) => updateDraftValue("siteContent.pages.homepage.reportsIntro.showPrices", event.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#111a34] focus:ring-[#111a34]"
                      />
                      <span>
                        <span className="block text-sm font-semibold text-[#1a2740]">Show prices in Homepage reports</span>
                        <span className="block text-xs text-gray-500">Toggle visible prices in the “Available Reports” cards.</span>
                      </span>
                    </label>

                    <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3">
                      <input
                        type="checkbox"
                        checked={showServicesPricing}
                        onChange={(event) => updateDraftValue("siteContent.pages.services.showPricing", event.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#111a34] focus:ring-[#111a34]"
                      />
                      <span>
                        <span className="block text-sm font-semibold text-[#1a2740]">Show prices in Services page</span>
                        <span className="block text-xs text-gray-500">If off, visitors see a quote prompt instead of prices.</span>
                      </span>
                    </label>

                    <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3">
                      <input
                        type="checkbox"
                        checked={showStrategicBriefsPricing}
                        onChange={(event) => updateDraftValue("siteContent.pages.strategicBriefs.showPricing", event.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#111a34] focus:ring-[#111a34]"
                      />
                      <span>
                        <span className="block text-sm font-semibold text-[#1a2740]">Show prices in Strategic Briefs page</span>
                        <span className="block text-xs text-gray-500">If off, visitors see “Quoted per request” style messaging.</span>
                      </span>
                    </label>

                    <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3">
                      <input
                        type="checkbox"
                        checked={showBudgetField}
                        onChange={(event) => updateDraftValue("siteContent.pages.requestAnalysis.showBudgetField", event.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#111a34] focus:ring-[#111a34]"
                      />
                      <span>
                        <span className="block text-sm font-semibold text-[#1a2740]">Show budget field in request form</span>
                        <span className="block text-xs text-gray-500">Turn off to collect requests first, then send custom offers.</span>
                      </span>
                    </label>
                  </div>

                  <div className="mt-5 space-y-4">
                    {requestFormOptionEditors.map((editor) => (
                      <div key={editor.path} className="rounded-lg border border-gray-200 p-3">
                        <div className="mb-3">
                          <h4 className="text-sm font-semibold text-[#1a2740]">{editor.title}</h4>
                          <p className="text-xs text-gray-500">{editor.description}</p>
                        </div>

                        <div className="space-y-2">
                          {editor.options.map((option, index) => (
                            <div key={`${editor.path}-${index}`} className="grid gap-2 rounded-md border border-gray-100 bg-gray-50 p-2 md:grid-cols-[1fr_1fr_auto]">
                              <input
                                type="text"
                                value={option.label}
                                onChange={(event) => setOptionFieldValue(editor.path, index, "label", event.target.value)}
                                placeholder="Option label"
                                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                              />
                              <input
                                type="text"
                                value={option.value}
                                onChange={(event) => setOptionFieldValue(editor.path, index, "value", event.target.value)}
                                placeholder="Option value"
                                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                              />
                              <button
                                type="button"
                                disabled={editor.options.length <= 1}
                                onClick={() => removeOptionFromList(editor.path, index)}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Delete
                              </button>
                            </div>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => addOptionToList(editor.path)}
                          className="mt-3 rounded-lg border border-[#111a34] px-3 py-1.5 text-xs font-semibold text-[#111a34] hover:bg-[#111a34] hover:text-white"
                        >
                          Add Option
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 p-4">
                  <h3 className="text-sm font-semibold text-[#1a2740]">Header & Footer Navigation Controls</h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Manage menu/footer links and toggle each item visible or hidden.
                  </p>

                  <div className="mt-4 rounded-lg border border-gray-200 p-3">
                    <h4 className="text-sm font-semibold text-[#1a2740]">Header Menu Items</h4>
                    <div className="mt-3 space-y-2">
                      {headerNavigationItems.map((item, index) => (
                        <div key={`header-nav-${index}`} className="grid gap-2 rounded-md border border-gray-100 bg-gray-50 p-2 md:grid-cols-[1fr_1fr_auto_auto]">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(event) =>
                              updateNavList("siteContent.header.navigation", (items) =>
                                items.map((entry, entryIndex) =>
                                  entryIndex === index ? { ...entry, name: event.target.value.slice(0, 120) } : entry,
                                ),
                              )
                            }
                            placeholder="Menu label"
                            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                          />
                          <input
                            type="text"
                            value={item.href}
                            onChange={(event) =>
                              updateNavList("siteContent.header.navigation", (items) =>
                                items.map((entry, entryIndex) =>
                                  entryIndex === index ? { ...entry, href: event.target.value.slice(0, 320) } : entry,
                                ),
                              )
                            }
                            placeholder="/route-or-url"
                            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                          />
                          <label className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700">
                            <input
                              type="checkbox"
                              checked={item.visible}
                              onChange={(event) =>
                                updateNavList("siteContent.header.navigation", (items) =>
                                  items.map((entry, entryIndex) =>
                                    entryIndex === index ? { ...entry, visible: event.target.checked } : entry,
                                  ),
                                )
                              }
                              className="h-4 w-4 rounded border-gray-300"
                            />
                            Show
                          </label>
                          <button
                            type="button"
                            disabled={headerNavigationItems.length <= 1}
                            onClick={() =>
                              updateNavList("siteContent.header.navigation", (items) =>
                                items.length <= 1 ? items : items.filter((_, entryIndex) => entryIndex !== index),
                              )
                            }
                            className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        updateNavList("siteContent.header.navigation", (items) => [
                          ...items,
                          { name: "New Item", href: "/", visible: true },
                        ])
                      }
                      className="mt-3 rounded-lg border border-[#111a34] px-3 py-1.5 text-xs font-semibold text-[#111a34] hover:bg-[#111a34] hover:text-white"
                    >
                      Add Header Item
                    </button>
                  </div>

                  <div className="mt-4 space-y-4">
                    {footerLinkEditors.map((editor) => (
                      <div key={editor.path} className="rounded-lg border border-gray-200 p-3">
                        <h4 className="text-sm font-semibold text-[#1a2740]">{editor.title}</h4>
                        <div className="mt-3 space-y-2">
                          {editor.items.map((item, index) => (
                            <div key={`${editor.path}-${index}`} className="grid gap-2 rounded-md border border-gray-100 bg-gray-50 p-2 md:grid-cols-[1fr_1fr_auto_auto]">
                              <input
                                type="text"
                                value={item.label}
                                onChange={(event) =>
                                  updateLinkList(editor.path, (items) =>
                                    items.map((entry, entryIndex) =>
                                      entryIndex === index ? { ...entry, label: event.target.value.slice(0, 120) } : entry,
                                    ),
                                  )
                                }
                                placeholder="Link label"
                                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                              />
                              <input
                                type="text"
                                value={item.href}
                                onChange={(event) =>
                                  updateLinkList(editor.path, (items) =>
                                    items.map((entry, entryIndex) =>
                                      entryIndex === index ? { ...entry, href: event.target.value.slice(0, 320) } : entry,
                                    ),
                                  )
                                }
                                placeholder="/route-or-url"
                                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                              />
                              <label className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700">
                                <input
                                  type="checkbox"
                                  checked={item.visible}
                                  onChange={(event) =>
                                    updateLinkList(editor.path, (items) =>
                                      items.map((entry, entryIndex) =>
                                        entryIndex === index ? { ...entry, visible: event.target.checked } : entry,
                                      ),
                                    )
                                  }
                                  className="h-4 w-4 rounded border-gray-300"
                                />
                                Show
                              </label>
                              <button
                                type="button"
                                disabled={editor.items.length <= 1}
                                onClick={() =>
                                  updateLinkList(editor.path, (items) =>
                                    items.length <= 1 ? items : items.filter((_, entryIndex) => entryIndex !== index),
                                  )
                                }
                                className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Delete
                              </button>
                            </div>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            updateLinkList(editor.path, (items) => [
                              ...items,
                              { label: "New Link", href: "/", visible: true },
                            ])
                          }
                          className="mt-3 rounded-lg border border-[#111a34] px-3 py-1.5 text-xs font-semibold text-[#111a34] hover:bg-[#111a34] hover:text-white"
                        >
                          Add Footer Link
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 p-4">
                  <h3 className="text-sm font-semibold text-[#1a2740]">Insights, Media, Profiles & Contact Controls</h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Configure insight categories, card lists, request rows, and communication channels.
                  </p>

                  <div className="mt-4 rounded-lg border border-gray-200 p-3">
                    <h4 className="text-sm font-semibold text-[#1a2740]">Insights Categories</h4>
                    <div className="mt-3 space-y-2">
                      {insightsCategories.map((category, index) => (
                        <div key={`insights-category-${index}`} className="grid gap-2 rounded-md border border-gray-100 bg-gray-50 p-2 md:grid-cols-[1fr_auto]">
                          <input
                            type="text"
                            value={category}
                            onChange={(event) =>
                              updateStringList("siteContent.pages.insights.categories", (items) =>
                                items.map((entry, entryIndex) =>
                                  entryIndex === index ? event.target.value.slice(0, 100) : entry,
                                ),
                              )
                            }
                            placeholder="Category name"
                            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                          />
                          <button
                            type="button"
                            disabled={insightsCategories.length <= 1}
                            onClick={() =>
                              updateStringList("siteContent.pages.insights.categories", (items) =>
                                items.length <= 1 ? items : items.filter((_, entryIndex) => entryIndex !== index),
                              )
                            }
                            className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        updateStringList("siteContent.pages.insights.categories", (items) => [...items, "New Category"])
                      }
                      className="mt-3 rounded-lg border border-[#111a34] px-3 py-1.5 text-xs font-semibold text-[#111a34] hover:bg-[#111a34] hover:text-white"
                    >
                      Add Category
                    </button>
                  </div>

                  <div className="mt-4 rounded-lg border border-gray-200 p-3">
                    <h4 className="text-sm font-semibold text-[#1a2740]">Media Landscapes: What A Report Includes</h4>
                    <div className="mt-3 space-y-2">
                      {mediaLandscapeReportItems.map((item, index) => (
                        <div key={`media-report-item-${index}`} className="grid gap-2 rounded-md border border-gray-100 bg-gray-50 p-2 md:grid-cols-[1fr_1fr_auto]">
                          <input
                            type="text"
                            value={item.title}
                            onChange={(event) =>
                              updateTitleDescList("siteContent.pages.mediaLandscapes.reportContents.items", (items) =>
                                items.map((entry, entryIndex) =>
                                  entryIndex === index ? { ...entry, title: event.target.value.slice(0, 160) } : entry,
                                ),
                              )
                            }
                            placeholder="Item title"
                            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                          />
                          <input
                            type="text"
                            value={item.desc}
                            onChange={(event) =>
                              updateTitleDescList("siteContent.pages.mediaLandscapes.reportContents.items", (items) =>
                                items.map((entry, entryIndex) =>
                                  entryIndex === index ? { ...entry, desc: event.target.value.slice(0, 600) } : entry,
                                ),
                              )
                            }
                            placeholder="Item description"
                            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                          />
                          <button
                            type="button"
                            disabled={mediaLandscapeReportItems.length <= 1}
                            onClick={() =>
                              updateTitleDescList("siteContent.pages.mediaLandscapes.reportContents.items", (items) =>
                                items.length <= 1 ? items : items.filter((_, entryIndex) => entryIndex !== index),
                              )
                            }
                            className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        updateTitleDescList("siteContent.pages.mediaLandscapes.reportContents.items", (items) => [
                          ...items,
                          { title: "New Item", desc: "Describe this item." },
                        ])
                      }
                      className="mt-3 rounded-lg border border-[#111a34] px-3 py-1.5 text-xs font-semibold text-[#111a34] hover:bg-[#111a34] hover:text-white"
                    >
                      Add Report Item
                    </button>
                  </div>

                  <div className="mt-4 rounded-lg border border-gray-200 p-3">
                    <h4 className="text-sm font-semibold text-[#1a2740]">Media Request Card Rows</h4>
                    <div className="mt-3 space-y-2">
                      {mediaLandscapeRequestRows.map((row, index) => (
                        <div key={`media-request-row-${index}`} className="grid gap-2 rounded-md border border-gray-100 bg-gray-50 p-2 md:grid-cols-[1fr_1fr_auto]">
                          <input
                            type="text"
                            value={row.label}
                            onChange={(event) =>
                              updateLabelValueList("siteContent.pages.mediaLandscapes.requestCard.pricingRows", (items) =>
                                items.map((entry, entryIndex) =>
                                  entryIndex === index ? { ...entry, label: event.target.value.slice(0, 160) } : entry,
                                ),
                              )
                            }
                            placeholder="Label"
                            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                          />
                          <input
                            type="text"
                            value={row.value}
                            onChange={(event) =>
                              updateLabelValueList("siteContent.pages.mediaLandscapes.requestCard.pricingRows", (items) =>
                                items.map((entry, entryIndex) =>
                                  entryIndex === index ? { ...entry, value: event.target.value.slice(0, 320) } : entry,
                                ),
                              )
                            }
                            placeholder="Value"
                            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                          />
                          <button
                            type="button"
                            disabled={mediaLandscapeRequestRows.length <= 1}
                            onClick={() =>
                              updateLabelValueList("siteContent.pages.mediaLandscapes.requestCard.pricingRows", (items) =>
                                items.length <= 1 ? items : items.filter((_, entryIndex) => entryIndex !== index),
                              )
                            }
                            className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        updateLabelValueList("siteContent.pages.mediaLandscapes.requestCard.pricingRows", (items) => [
                          ...items,
                          { label: "New Row", value: "" },
                        ])
                      }
                      className="mt-3 rounded-lg border border-[#111a34] px-3 py-1.5 text-xs font-semibold text-[#111a34] hover:bg-[#111a34] hover:text-white"
                    >
                      Add Request Row
                    </button>
                  </div>

                  <div className="mt-4 rounded-lg border border-gray-200 p-3">
                    <h4 className="text-sm font-semibold text-[#1a2740]">Profiles CTA Rows</h4>
                    <div className="mt-3 space-y-2">
                      {profileCtaRows.map((row, index) => (
                        <div key={`profiles-cta-row-${index}`} className="grid gap-2 rounded-md border border-gray-100 bg-gray-50 p-2 md:grid-cols-[1fr_1fr_auto]">
                          <input
                            type="text"
                            value={row.label}
                            onChange={(event) =>
                              updateLabelValueList("siteContent.pages.profiles.cta.pricingRows", (items) =>
                                items.map((entry, entryIndex) =>
                                  entryIndex === index ? { ...entry, label: event.target.value.slice(0, 160) } : entry,
                                ),
                              )
                            }
                            placeholder="Label"
                            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                          />
                          <input
                            type="text"
                            value={row.value}
                            onChange={(event) =>
                              updateLabelValueList("siteContent.pages.profiles.cta.pricingRows", (items) =>
                                items.map((entry, entryIndex) =>
                                  entryIndex === index ? { ...entry, value: event.target.value.slice(0, 320) } : entry,
                                ),
                              )
                            }
                            placeholder="Value"
                            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                          />
                          <button
                            type="button"
                            disabled={profileCtaRows.length <= 1}
                            onClick={() =>
                              updateLabelValueList("siteContent.pages.profiles.cta.pricingRows", (items) =>
                                items.length <= 1 ? items : items.filter((_, entryIndex) => entryIndex !== index),
                              )
                            }
                            className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        updateLabelValueList("siteContent.pages.profiles.cta.pricingRows", (items) => [
                          ...items,
                          { label: "New Row", value: "" },
                        ])
                      }
                      className="mt-3 rounded-lg border border-[#111a34] px-3 py-1.5 text-xs font-semibold text-[#111a34] hover:bg-[#111a34] hover:text-white"
                    >
                      Add Profile Row
                    </button>
                  </div>

                  <div className="mt-4 rounded-lg border border-gray-200 p-3">
                    <h4 className="text-sm font-semibold text-[#1a2740]">Contact Communication Channels</h4>
                    <div className="mt-3 space-y-2">
                      {contactChannels.map((channel, index) => (
                        <div key={`contact-channel-${index}`} className="grid gap-2 rounded-md border border-gray-100 bg-gray-50 p-2 md:grid-cols-[1fr_1fr_1fr_120px_auto_auto]">
                          <input
                            type="text"
                            value={channel.label}
                            onChange={(event) =>
                              updateContactChannelsList("siteContent.pages.contact.channels", (items) =>
                                items.map((entry, entryIndex) =>
                                  entryIndex === index ? { ...entry, label: event.target.value.slice(0, 120) } : entry,
                                ),
                              )
                            }
                            placeholder="Label"
                            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                          />
                          <input
                            type="text"
                            value={channel.value}
                            onChange={(event) =>
                              updateContactChannelsList("siteContent.pages.contact.channels", (items) =>
                                items.map((entry, entryIndex) =>
                                  entryIndex === index ? { ...entry, value: event.target.value.slice(0, 200) } : entry,
                                ),
                              )
                            }
                            placeholder="Displayed text"
                            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                          />
                          <input
                            type="text"
                            value={channel.href}
                            onChange={(event) =>
                              updateContactChannelsList("siteContent.pages.contact.channels", (items) =>
                                items.map((entry, entryIndex) =>
                                  entryIndex === index ? { ...entry, href: event.target.value.slice(0, 320) } : entry,
                                ),
                              )
                            }
                            placeholder="mailto: or https://"
                            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                          />
                          <select
                            value={channel.type}
                            onChange={(event) =>
                              updateContactChannelsList("siteContent.pages.contact.channels", (items) =>
                                items.map((entry, entryIndex) =>
                                  entryIndex === index ? { ...entry, type: event.target.value.slice(0, 40) } : entry,
                                ),
                              )
                            }
                            className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm"
                          >
                            {["email", "linkedin", "phone", "whatsapp", "telegram", "message", "website", "other"].map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                          <label className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700">
                            <input
                              type="checkbox"
                              checked={channel.visible}
                              onChange={(event) =>
                                updateContactChannelsList("siteContent.pages.contact.channels", (items) =>
                                  items.map((entry, entryIndex) =>
                                    entryIndex === index ? { ...entry, visible: event.target.checked } : entry,
                                  ),
                                )
                              }
                              className="h-4 w-4 rounded border-gray-300"
                            />
                            Show
                          </label>
                          <button
                            type="button"
                            disabled={contactChannels.length <= 1}
                            onClick={() =>
                              updateContactChannelsList("siteContent.pages.contact.channels", (items) =>
                                items.length <= 1 ? items : items.filter((_, entryIndex) => entryIndex !== index),
                              )
                            }
                            className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        updateContactChannelsList("siteContent.pages.contact.channels", (items) => [
                          ...items,
                          { label: "New Channel", value: "", href: "", type: "other", visible: true },
                        ])
                      }
                      className="mt-3 rounded-lg border border-[#111a34] px-3 py-1.5 text-xs font-semibold text-[#111a34] hover:bg-[#111a34] hover:text-white"
                    >
                      Add Channel
                    </button>
                  </div>
                </div>

                <details className="rounded-xl border border-gray-200 p-4">
                  <summary className="cursor-pointer text-sm font-semibold text-[#1a2740]">
                    Advanced: Edit All Content Fields
                  </summary>

                  <div className="mt-4">
                    <div className="mb-4">
                      <input
                        type="text"
                        value={contentFilter}
                        onChange={(e) => setContentFilter(e.target.value)}
                        placeholder="Search by label, text, or URL..."
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="mb-4 flex flex-wrap gap-2">
                      {CONTENT_SECTIONS.map((section) => (
                        <button
                          key={section.key}
                          type="button"
                          onClick={() => setActiveContentSection(section.key)}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                            activeContentSection === section.key
                              ? "border-[#111a34] bg-[#111a34] text-white"
                              : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {section.title} ({sectionCounts[section.key] || 0})
                        </button>
                      ))}
                    </div>
                    <p className="mb-4 text-xs text-gray-500">{activeSectionDefinition.description}</p>

                    <div className="mb-5 flex flex-wrap gap-2">
                      {[
                        { key: "all" as const, label: "All" },
                        { key: "text" as const, label: "Text" },
                        { key: "image" as const, label: "Images" },
                        { key: "link" as const, label: "Links" },
                        { key: "email" as const, label: "Emails" },
                      ].map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setActiveFieldKind(item.key)}
                          className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                            activeFieldKind === item.key
                              ? "border-[#111a34] bg-[#111a34] text-white"
                              : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {item.label} ({activeKindCounts[item.key]})
                        </button>
                      ))}
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-1">
                      {filteredActiveSectionFields.map((field) => (
                        <div key={field.path} className="rounded-lg border border-gray-200 p-3">
                          <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-[#1a2740]">{field.label}</p>
                              <div className="mt-1 flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700">
                                  {field.kind === "text" ? <TypeIcon className="h-3 w-3" /> : null}
                                  {field.kind === "image" ? <ImageIcon className="h-3 w-3" /> : null}
                                  {field.kind === "link" ? <Link2 className="h-3 w-3" /> : null}
                                  {field.kind === "email" ? <Mail className="h-3 w-3" /> : null}
                                  {field.kind}
                                </span>
                                {changedPathSet.has(field.path) ? (
                                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                                    Edited
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>

                          {field.kind === "text" ? (
                            <input
                              type="text"
                              value={field.value}
                              onChange={(e) => updateDraftField(field.path, e.target.value)}
                              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                            />
                          ) : (
                            <textarea
                              value={field.value}
                              rows={field.value.length > 90 ? 4 : 2}
                              onChange={(e) => updateDraftField(field.path, e.target.value)}
                              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-y"
                            />
                          )}

                          {canRenderImagePreview(field.path, field.value) ? (
                            <img
                              src={field.value}
                              alt={field.label}
                              className="mt-3 h-24 w-full rounded-lg border border-gray-200 object-cover"
                            />
                          ) : null}
                        </div>
                      ))}

                      {!filteredActiveSectionFields.length ? (
                        <p className="text-sm text-gray-500">No matching fields for this section/filter.</p>
                      ) : null}
                    </div>
                  </div>
                </details>
              </div>
            )}
          </div>
        ) : null}

        {tab === "settings" ? (
          <form onSubmit={saveSettings} className="max-w-2xl rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-[#1a2740]">Admin Account Settings</h2>
            <p className="text-sm text-gray-500">Change your admin email and password. Current password is required for security.</p>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Admin Email</label>
              <input
                type="email"
                value={settingsEmail}
                onChange={(e) => setSettingsEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Current Password</label>
              <input
                type="password"
                value={settingsCurrentPassword}
                onChange={(e) => setSettingsCurrentPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">New Password (optional)</label>
              <input
                type="password"
                value={settingsNewPassword}
                onChange={(e) => setSettingsNewPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                placeholder="Leave empty to keep existing password"
              />
              <p className="mt-1 text-xs text-gray-500">Minimum 10 characters if provided.</p>
            </div>

            <button
              type="submit"
              className="rounded-lg bg-[#111a34] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1a2b52]"
            >
              Save Account Settings
            </button>
            {settingsMessage ? <p className="text-sm text-green-600">{settingsMessage}</p> : null}
          </form>
        ) : null}
      </section>
    </div>
  );
}
