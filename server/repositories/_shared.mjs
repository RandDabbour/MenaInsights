import { execute, query } from "../db/connection.mjs";

export async function repoQuery(connection, sql, params = []) {
  if (connection) {
    const [rows] = await connection.query(sql, params);
    return rows;
  }
  return query(sql, params);
}

export async function repoExecute(connection, sql, params = []) {
  if (connection) {
    const [result] = await connection.execute(sql, params);
    return result;
  }
  return execute(sql, params);
}
