import { randomUUID } from "node:crypto";
import { nowIso } from "../utils/datetime.mjs";
import { listMediaFiles, upsertMediaFile } from "../repositories/mediaFilesRepository.mjs";

export async function getMediaFiles(limit = 100) {
  return listMediaFiles(limit);
}

export async function registerMediaFile(fileInput, adminUserId = null) {
  const timestamp = nowIso();
  const file = {
    id: fileInput.id || randomUUID(),
    fileName: String(fileInput.fileName || "file").trim(),
    originalUrl: String(fileInput.originalUrl || "").trim(),
    mimeType: fileInput.mimeType ? String(fileInput.mimeType).trim() : null,
    sizeBytes: Number.isFinite(fileInput.sizeBytes) ? Number(fileInput.sizeBytes) : null,
    altText: fileInput.altText ? String(fileInput.altText).trim() : null,
    createdByUserId: adminUserId,
    createdAt: fileInput.createdAt || timestamp,
    updatedAt: timestamp,
  };

  await upsertMediaFile(file);
  return file;
}
