import path from "node:path";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { closeDbPool, execute, query } from "./connection.mjs";
import { nowIso, toSqlDateTime } from "../utils/datetime.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MIGRATIONS_DIR = path.join(__dirname, "migrations");

async function ensureMigrationsTable() {
  await execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      version VARCHAR(120) NOT NULL UNIQUE,
      executed_at DATETIME(3) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function getExecutedVersions() {
  const rows = await query(`SELECT version FROM schema_migrations`);
  return new Set(rows.map((row) => String(row.version)));
}

async function runMigration(version, sqlText) {
  const sqlStatements = sqlText
    .split(/;\s*\n/g)
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of sqlStatements) {
    await execute(statement);
  }

  await execute(`INSERT INTO schema_migrations (version, executed_at) VALUES (?, ?)`, [
    version,
    toSqlDateTime(nowIso()),
  ]);
}

export async function runMigrations() {
  await ensureMigrationsTable();
  const executed = await getExecutedVersions();
  const files = (await readdir(MIGRATIONS_DIR))
    .filter((name) => name.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b));

  for (const file of files) {
    if (executed.has(file)) {
      continue;
    }
    const sqlText = await readFile(path.join(MIGRATIONS_DIR, file), "utf8");
    await runMigration(file, sqlText);
    // eslint-disable-next-line no-console
    console.log(`Applied migration: ${file}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then(async () => {
      // eslint-disable-next-line no-console
      console.log("Database migrations completed.");
      await closeDbPool();
    })
    .catch(async (error) => {
      // eslint-disable-next-line no-console
      console.error(error instanceof Error ? error.message : error);
      await closeDbPool();
      process.exitCode = 1;
    });
}
