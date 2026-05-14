import { createHash, randomBytes, randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import { nowIso } from "../utils/datetime.mjs";
import { UnauthorizedError, ValidationError } from "../lib/errors.mjs";
import {
  createUser,
  findUserByEmail,
  findUserById,
  listAdminUsers,
  updateUserCredentials,
} from "../repositories/usersRepository.mjs";
import {
  createSession,
  deleteExpiredSessions,
  deleteSessionByTokenHash,
  deleteSessionsForUserExceptTokenHash,
  findSessionByTokenHash,
} from "../repositories/sessionsRepository.mjs";
import { assertPasswordStrength, normalizeEmail } from "../validation/inputValidation.mjs";

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 12);

function hashToken(token) {
  return createHash("sha256").update(String(token || "")).digest("hex");
}

function randomToken(bytes = 24) {
  return randomBytes(bytes).toString("hex");
}

function isAdminRole(role) {
  return ["admin", "owner", "staff"].includes(String(role || ""));
}

export async function hashPassword(plainPassword) {
  assertPasswordStrength(plainPassword);
  return bcrypt.hash(String(plainPassword), BCRYPT_ROUNDS);
}

export async function verifyPassword(plainPassword, passwordHash) {
  if (!plainPassword || !passwordHash) {
    return false;
  }
  return bcrypt.compare(String(plainPassword), String(passwordHash));
}

export async function bootstrapAdminIfMissing() {
  const existingAdmins = await listAdminUsers();
  if (existingAdmins.length > 0) {
    return existingAdmins[0];
  }

  const defaultAdminEmail = normalizeEmail(process.env.ADMIN_EMAIL || "owner@memi.local");
  const defaultAdminPassword = String(process.env.ADMIN_PASSWORD || "ChangeMe123!");
  const now = nowIso();
  return createUser({
    id: randomUUID(),
    name: "Site Owner",
    email: defaultAdminEmail,
    passwordHash: await hashPassword(defaultAdminPassword),
    role: "admin",
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });
}

export async function getPrimaryAdminEmail() {
  const admins = await listAdminUsers();
  return admins[0]?.email || normalizeEmail(process.env.ADMIN_EMAIL || "owner@memi.local");
}

export async function authenticateAdmin(email, password) {
  const account = await findUserByEmail(normalizeEmail(email));
  if (!account || !account.isActive || !isAdminRole(account.role)) {
    throw new UnauthorizedError("Invalid credentials");
  }

  const matches = await verifyPassword(password, account.passwordHash);
  if (!matches) {
    throw new UnauthorizedError("Invalid credentials");
  }

  return account;
}

export async function createAdminSession(userId) {
  const token = randomToken(32);
  const tokenHash = hashToken(token);
  const createdAt = nowIso();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString();

  await createSession({
    id: randomUUID(),
    userId,
    tokenHash,
    createdAt,
    expiresAt,
  });

  return { token, expiresAt };
}

export async function getAdminFromBearerToken(token) {
  if (!token) {
    return null;
  }

  await deleteExpiredSessions();
  const tokenHash = hashToken(token);
  const session = await findSessionByTokenHash(tokenHash);
  if (!session) {
    return null;
  }

  const expiresAtMs = new Date(session.expiresAt).getTime();
  if (expiresAtMs <= Date.now()) {
    await deleteSessionByTokenHash(tokenHash);
    return null;
  }

  const user = await findUserById(session.userId);
  if (!user || !user.isActive || !isAdminRole(user.role)) {
    return null;
  }
  return user;
}

export async function logoutByToken(token) {
  if (!token) {
    return;
  }
  await deleteSessionByTokenHash(hashToken(token));
}

export async function updateAdminCredentials({ adminUser, currentPassword, nextEmail, newPassword, activeToken }) {
  const matches = await verifyPassword(currentPassword, adminUser.passwordHash);
  if (!matches) {
    throw new UnauthorizedError("Current password is incorrect");
  }

  const existing = await findUserByEmail(nextEmail);
  if (existing && existing.id !== adminUser.id) {
    throw new ValidationError("This email is already used by another admin account");
  }

  let nextPasswordHash = null;
  if (newPassword) {
    nextPasswordHash = await hashPassword(newPassword);
  }

  await updateUserCredentials({
    userId: adminUser.id,
    email: nextEmail,
    passwordHash: nextPasswordHash,
  });

  if (newPassword) {
    const activeTokenHash = activeToken ? hashToken(activeToken) : "";
    await deleteSessionsForUserExceptTokenHash(adminUser.id, activeTokenHash);
  }

  return findUserById(adminUser.id);
}
