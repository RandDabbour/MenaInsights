import mysql from "mysql2/promise";

let pool;

function getEnvConfig() {
  return {
    host: String(process.env.DB_HOST || "").trim(),
    port: Number(process.env.DB_PORT || 3306),
    user: String(process.env.DB_USER || "").trim(),
    password: String(process.env.DB_PASSWORD || ""),
    database: String(process.env.DB_NAME || "").trim(),
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  };
}

function getConfigErrors(config) {
  const errors = [];
  if (!config.host) {
    errors.push("DB_HOST");
  }
  if (!config.user) {
    errors.push("DB_USER");
  }
  if (!config.database) {
    errors.push("DB_NAME");
  }
  if (!Number.isInteger(config.port) || config.port <= 0) {
    errors.push("DB_PORT");
  }
  if (!Number.isInteger(config.connectionLimit) || config.connectionLimit <= 0) {
    errors.push("DB_CONNECTION_LIMIT");
  }
  return errors;
}

export function getDbPool() {
  if (pool) {
    return pool;
  }

  const config = getEnvConfig();
  const errors = getConfigErrors(config);
  if (errors.length > 0) {
    throw new Error(
      `Missing or invalid MySQL config: ${errors.join(", ")}. ` +
        "Set DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME in .env.",
    );
  }

  pool = mysql.createPool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    waitForConnections: true,
    connectionLimit: config.connectionLimit,
    queueLimit: 0,
    charset: "utf8mb4",
    dateStrings: ["DATE", "DATETIME", "TIMESTAMP"],
  });

  return pool;
}

export async function query(sql, params = []) {
  const [rows] = await getDbPool().query(sql, params);
  return rows;
}

export async function execute(sql, params = []) {
  const [result] = await getDbPool().execute(sql, params);
  return result;
}

export async function withTransaction(work) {
  const connection = await getDbPool().getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function closeDbPool() {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}
