import { nowIso } from "../utils/datetime.mjs";
import { getGlobalSiteContent, upsertGlobalSiteContent } from "../repositories/siteContentRepository.mjs";
import { normalizeSiteContentInput } from "../validation/inputValidation.mjs";

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeDbContent(content) {
  const current = isPlainObject(content) ? content : {};
  const homepage = isPlainObject(current.homepage) ? current.homepage : {};
  const heroImage = String(homepage.heroImage || "").trim();
  const heroAlt = String(homepage.heroAlt || "").trim();
  const siteContent = normalizeSiteContentInput(current.siteContent || {});

  return {
    homepage: {
      heroImage,
      heroAlt: heroAlt.slice(0, 280) || "Middle East Media Insights hero",
    },
    siteContent,
    updatedAt: String(current.updatedAt || ""),
  };
}

function defaultContentState() {
  return {
    homepage: {
      heroImage: "",
      heroAlt: "Middle East Media Insights hero",
    },
    siteContent: {},
    updatedAt: nowIso(),
  };
}

export async function getSiteContentState() {
  const global = await getGlobalSiteContent();
  if (!global) {
    const fallback = defaultContentState();
    await upsertGlobalSiteContent({
      data: fallback,
      updatedByUserId: null,
      updatedAt: fallback.updatedAt,
    });
    return fallback;
  }

  const normalized = normalizeDbContent(global.data);
  if (!normalized.updatedAt) {
    normalized.updatedAt = global.updatedAt || nowIso();
  }
  return normalized;
}

export async function saveSiteContentState({ content, adminUserId }) {
  const nextContent = normalizeDbContent(content);
  nextContent.updatedAt = nowIso();
  await upsertGlobalSiteContent({
    data: nextContent,
    updatedByUserId: adminUserId || null,
    updatedAt: nextContent.updatedAt,
  });
  return nextContent;
}
