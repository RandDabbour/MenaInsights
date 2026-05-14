import path from "node:path";
import { mkdir } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { spawn } from "node:child_process";

const DB_HOST = String(process.env.DB_HOST || "").trim();
const DB_PORT = String(process.env.DB_PORT || "3306").trim();
const DB_USER = String(process.env.DB_USER || "").trim();
const DB_PASSWORD = String(process.env.DB_PASSWORD || "");
const DB_NAME = String(process.env.DB_NAME || "").trim();
const BACKUP_DIR = String(process.env.DB_BACKUP_DIR || path.join(process.cwd(), "server", "backups")).trim();

function timestampForFile() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function validateConfig() {
  const missing = [];
  if (!DB_HOST) {
    missing.push("DB_HOST");
  }
  if (!DB_USER) {
    missing.push("DB_USER");
  }
  if (!DB_NAME) {
    missing.push("DB_NAME");
  }
  if (!DB_PORT) {
    missing.push("DB_PORT");
  }
  if (missing.length > 0) {
    throw new Error(`Missing required DB env vars for backup: ${missing.join(", ")}`);
  }
}

async function main() {
  validateConfig();
  await mkdir(BACKUP_DIR, { recursive: true });

  const outputPath = path.join(BACKUP_DIR, `${DB_NAME}-${timestampForFile()}.sql`);
  const output = createWriteStream(outputPath, { flags: "wx" });

  const args = [
    "--single-transaction",
    "--quick",
    "--skip-lock-tables",
    "-h",
    DB_HOST,
    "-P",
    DB_PORT,
    "-u",
    DB_USER,
    DB_NAME,
  ];

  const child = spawn("mysqldump", args, {
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      MYSQL_PWD: DB_PASSWORD,
    },
  });

  child.stdout.pipe(output);
  let stderr = "";
  child.stderr.on("data", (chunk) => {
    stderr += String(chunk);
  });

  await new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(stderr || `mysqldump exited with code ${code}`));
    });
  });

  // eslint-disable-next-line no-console
  console.log(`Backup written to: ${outputPath}`);
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
