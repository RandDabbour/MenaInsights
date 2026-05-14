import { execute, query } from "../db/connection.mjs";
import { sqlToIso, toSqlDateTime } from "../utils/datetime.mjs";

function mapUserRow(row) {
  if (!row) {
    return null;
  }
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email).toLowerCase(),
    passwordHash: String(row.password_hash),
    role: String(row.role || "admin"),
    isActive: Boolean(row.is_active),
    createdAt: sqlToIso(row.created_at),
    updatedAt: sqlToIso(row.updated_at),
  };
}

export async function findUserById(userId) {
  const rows = await query(`SELECT * FROM users WHERE id = ? LIMIT 1`, [userId]);
  return mapUserRow(rows[0]);
}

export async function findUserByEmail(email) {
  const rows = await query(`SELECT * FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1`, [email]);
  return mapUserRow(rows[0]);
}

export async function listAdminUsers() {
  const rows = await query(
    `SELECT * FROM users WHERE role IN ('admin', 'owner', 'staff') AND is_active = 1 ORDER BY created_at ASC`,
  );
  return rows.map(mapUserRow);
}

export async function createUser(user) {
  await execute(
    `INSERT INTO users
      (id, name, email, password_hash, role, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user.id,
      user.name,
      String(user.email).toLowerCase(),
      user.passwordHash,
      user.role || "admin",
      user.isActive === false ? 0 : 1,
      toSqlDateTime(user.createdAt),
      toSqlDateTime(user.updatedAt),
    ],
  );
  return findUserById(user.id);
}

export async function updateUserCredentials({ userId, email, passwordHash }) {
  const updatedAt = toSqlDateTime(new Date().toISOString());
  if (passwordHash) {
    await execute(
      `UPDATE users
         SET email = ?, password_hash = ?, updated_at = ?
       WHERE id = ?`,
      [String(email).toLowerCase(), passwordHash, updatedAt, userId],
    );
    return;
  }

  await execute(
    `UPDATE users
       SET email = ?, updated_at = ?
     WHERE id = ?`,
    [String(email).toLowerCase(), updatedAt, userId],
  );
}
