import path from "node:path";
import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { access, mkdir } from "node:fs/promises";
import multer from "multer";
import { ValidationError } from "./errors.mjs";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const MAX_UPLOAD_SIZE_MB = Number(process.env.UPLOAD_MAX_SIZE_MB || 10);
const MAX_UPLOAD_SIZE_BYTES = Math.max(1, Number.isFinite(MAX_UPLOAD_SIZE_MB) ? MAX_UPLOAD_SIZE_MB : 10) * 1024 * 1024;

const MIME_BY_EXTENSION = {
  ".jpg": new Set(["image/jpeg"]),
  ".jpeg": new Set(["image/jpeg"]),
  ".png": new Set(["image/png"]),
  ".webp": new Set(["image/webp"]),
  ".pdf": new Set(["application/pdf"]),
};

const CONTENT_TYPE_BY_EXTENSION = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
};

function normalizeExtension(fileName) {
  return path.extname(String(fileName || "")).toLowerCase();
}

function isAllowedByMimeAndExtension(file) {
  const ext = normalizeExtension(file.originalname);
  const allowedMimes = MIME_BY_EXTENSION[ext];
  if (!allowedMimes) {
    return false;
  }
  const mime = String(file.mimetype || "").toLowerCase();
  return allowedMimes.has(mime);
}

function imageOnlyExtension(ext) {
  return [".jpg", ".jpeg", ".png", ".webp"].includes(ext);
}

export function getUploadsDir() {
  return UPLOADS_DIR;
}

export async function ensureUploadsDir() {
  await mkdir(UPLOADS_DIR, { recursive: true });
}

function createStorage() {
  return multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, UPLOADS_DIR);
    },
    filename: (_req, file, cb) => {
      const ext = normalizeExtension(file.originalname);
      const safeExt = MIME_BY_EXTENSION[ext] ? ext : "";
      const uniqueName = `${Date.now()}-${randomUUID()}${safeExt}`;
      cb(null, uniqueName);
    },
  });
}

function createUploadMiddleware({ imageOnly = false } = {}) {
  return multer({
    storage: createStorage(),
    limits: {
      fileSize: MAX_UPLOAD_SIZE_BYTES,
      files: 1,
      parts: 15,
      fieldSize: 64 * 1024,
      fields: 10,
    },
    fileFilter: (_req, file, cb) => {
      if (!isAllowedByMimeAndExtension(file)) {
        cb(new ValidationError("Invalid file type. Allowed: jpg, jpeg, png, webp, pdf."));
        return;
      }
      const ext = normalizeExtension(file.originalname);
      if (imageOnly && !imageOnlyExtension(ext)) {
        cb(new ValidationError("Only image files are allowed for this upload (jpg, jpeg, png, webp)."));
        return;
      }
      cb(null, true);
    },
  });
}

const imageUpload = createUploadMiddleware({ imageOnly: true });
const documentOrImageUpload = createUploadMiddleware({ imageOnly: false });

function mapMulterError(error) {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return new ValidationError(`File is too large. Max allowed size is ${MAX_UPLOAD_SIZE_MB}MB.`);
    }
    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return new ValidationError("Unexpected upload field. Please upload using field name 'file'.");
    }
    return new ValidationError(`Upload error: ${error.message}`);
  }
  if (error instanceof ValidationError) {
    return error;
  }
  return new ValidationError("File upload failed.");
}

async function runUpload(middleware, req, res) {
  await ensureUploadsDir();
  return new Promise((resolve, reject) => {
    middleware.single("file")(req, res, (error) => {
      if (error) {
        reject(mapMulterError(error));
        return;
      }
      if (!req.file) {
        reject(new ValidationError("No file uploaded."));
        return;
      }
      resolve(req.file);
    });
  });
}

export async function runImageUpload(req, res) {
  return runUpload(imageUpload, req, res);
}

export async function runDocumentOrImageUpload(req, res) {
  return runUpload(documentOrImageUpload, req, res);
}

export function toPublicUploadPath(fileName) {
  return `/uploads/${String(fileName || "").trim()}`;
}

export async function serveUploadFile(req, res, pathname) {
  if (!pathname.startsWith("/uploads/")) {
    return false;
  }
  const relativePath = pathname.slice("/uploads/".length);
  const normalized = path.posix.normalize(relativePath);
  if (!normalized || normalized.startsWith("../") || normalized.includes("/../") || normalized.startsWith("/")) {
    res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: "Invalid file path" }));
    return true;
  }

  const filePath = path.join(UPLOADS_DIR, normalized);
  try {
    await access(filePath);
  } catch {
    res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: "File not found" }));
    return true;
  }

  const ext = normalizeExtension(filePath);
  const contentType = CONTENT_TYPE_BY_EXTENSION[ext] || "application/octet-stream";
  res.writeHead(200, {
    "Content-Type": contentType,
    "Cache-Control": "public, max-age=3600",
    "X-Content-Type-Options": "nosniff",
  });
  const stream = createReadStream(filePath);
  stream.on("error", () => {
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ error: "Unable to read file" }));
    } else {
      res.end();
    }
  });
  stream.pipe(res);
  return true;
}
