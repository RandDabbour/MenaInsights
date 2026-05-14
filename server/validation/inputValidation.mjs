import { ValidationError } from "../lib/errors.mjs";

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function normalizeCurrencyCode(currency) {
  const next = String(currency || "USD").trim().toUpperCase();
  return /^[A-Z]{3}$/.test(next) ? next : "USD";
}

export function isValidEmail(email) {
  return EMAIL_REGEX.test(normalizeEmail(email));
}

export function assertValidEmail(email, fieldName = "email") {
  if (!isValidEmail(email)) {
    throw new ValidationError(`A valid ${fieldName} is required`);
  }
}

export function assertPasswordStrength(password) {
  if (String(password || "").length < 10) {
    throw new ValidationError("New password must be at least 10 characters");
  }
}

export function isValidHeroImageInput(value) {
  const next = String(value || "").trim();
  if (!next) {
    return true;
  }
  if (next.startsWith("/")) {
    return true;
  }
  try {
    const parsed = new URL(next);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function normalizeSiteContentInput(value, depth = 0) {
  if (depth > 20) {
    return {};
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean" || value === null) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.slice(0, 200).map((entry) => normalizeSiteContentInput(entry, depth + 1));
  }

  if (!isPlainObject(value)) {
    return {};
  }

  const normalized = {};
  for (const [key, entryValue] of Object.entries(value)) {
    if (!/^[a-zA-Z0-9._-]{1,120}$/.test(key)) {
      continue;
    }
    normalized[key] = normalizeSiteContentInput(entryValue, depth + 1);
  }
  return normalized;
}

function requiredText(value, fieldName, maxLen = 5000) {
  const next = String(value || "").trim();
  if (!next) {
    throw new ValidationError(`${fieldName} is required`);
  }
  return next.slice(0, maxLen);
}

function optionalText(value, maxLen = 5000) {
  return String(value || "").trim().slice(0, maxLen);
}

export function validateRequestSubmissionInput(body) {
  const payload = body || {};
  const name = requiredText(payload.name, "name", 120);
  const email = normalizeEmail(payload.email);
  const service = requiredText(payload.service, "service", 160);
  const region = requiredText(payload.region, "region", 160);
  const topic = requiredText(payload.topic, "topic", 240);
  const description = requiredText(payload.description, "description", 10_000);
  assertValidEmail(email, "email");

  return {
    name,
    email,
    organization: optionalText(payload.organization, 200),
    service,
    region,
    topic,
    urgency: optionalText(payload.urgency, 120),
    description,
    budget: optionalText(payload.budget, 120),
  };
}

export function validatePublicActionInput(body) {
  const payload = body || {};
  const action = String(payload.action || "").trim();
  if (!["accept", "reject", "negotiate"].includes(action)) {
    throw new ValidationError("Invalid action");
  }
  const message = optionalText(payload.message, 4000);
  if (action === "negotiate" && !message) {
    throw new ValidationError("Negotiation message is required");
  }
  return { action, message };
}

export function validateProposalInput(body) {
  const payload = body || {};
  const price = Number(payload.price);
  if (!Number.isFinite(price) || price <= 0) {
    throw new ValidationError("Valid numeric price is required");
  }

  return {
    price,
    currency: normalizeCurrencyCode(payload.currency || "USD"),
    timeline: optionalText(payload.timeline, 255),
    notes: optionalText(payload.notes, 4000),
  };
}

export function validateOwnerMessageInput(body) {
  const message = String(body?.message || "").trim().slice(0, 4000);
  if (!message) {
    throw new ValidationError("Message is required");
  }
  return { message };
}

export function validateStatusUpdateInput(body, allowedStatuses) {
  const nextStatus = String(body?.status || "").trim();
  if (!allowedStatuses.has(nextStatus)) {
    throw new ValidationError("Invalid status");
  }
  return { nextStatus };
}

export function validateAdminSettingsInput(body) {
  const payload = body || {};
  const currentPassword = String(payload.currentPassword || "");
  if (!currentPassword) {
    throw new ValidationError("Current password is required");
  }

  const nextEmail = normalizeEmail(payload.email || "");
  assertValidEmail(nextEmail, "email");
  const newPassword = String(payload.newPassword || "");
  if (newPassword) {
    assertPasswordStrength(newPassword);
  }

  return {
    currentPassword,
    email: nextEmail,
    newPassword,
  };
}

export function validateContentUpdateInput(body, currentContent) {
  const heroImage = String((body?.homepage?.heroImage ?? currentContent.homepage.heroImage) || "").trim();
  const heroAlt = String((body?.homepage?.heroAlt ?? currentContent.homepage.heroAlt) || "").trim().slice(0, 280);

  if (!isValidHeroImageInput(heroImage)) {
    throw new ValidationError("heroImage must be an absolute http(s) URL or a local path starting with /");
  }

  const incomingSiteContent = Object.prototype.hasOwnProperty.call(body || {}, "siteContent")
    ? body.siteContent
    : currentContent.siteContent;
  const siteContent = normalizeSiteContentInput(incomingSiteContent || {});
  const serialized = JSON.stringify(siteContent);
  if (serialized.length > 1_000_000) {
    throw new ValidationError("siteContent payload is too large");
  }

  return {
    homepage: {
      heroImage,
      heroAlt,
    },
    siteContent,
  };
}
