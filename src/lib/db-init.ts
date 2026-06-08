import { execSync } from "child_process";
import { copyFileSync, existsSync } from "fs";
import { join } from "path";
import {
  BUNDLED_DATABASE_PATH,
  ensureDatabaseUrl,
  isVercelSqlite,
} from "@/lib/env";

let initialized = false;

const bundledDbCandidates = [
  BUNDLED_DATABASE_PATH,
  "prisma/build.db",
  "prisma/prisma/build.db",
  "dev.db",
  "prisma/dev.db",
];

function getBundledDatabasePath(): string | null {
  for (const relativePath of bundledDbCandidates) {
    const absolutePath = join(process.cwd(), relativePath);
    if (existsSync(absolutePath)) {
      return absolutePath;
    }
  }
  return null;
}

function getRuntimeDatabasePath(): string | null {
  const url = ensureDatabaseUrl();
  if (!url.startsWith("file:")) return null;
  return url.replace(/^file:/, "");
}

/** Prepare a writable SQLite database on Vercel before Prisma queries run. */
export function ensureDatabaseReady(): void {
  if (initialized) return;
  initialized = true;

  if (!isVercelSqlite()) return;

  const runtimePath = getRuntimeDatabasePath();
  if (!runtimePath) return;

  if (existsSync(runtimePath)) return;

  const bundledPath = getBundledDatabasePath();
  if (bundledPath) {
    copyFileSync(bundledPath, runtimePath);
    return;
  }

  execSync("npx prisma db push --skip-generate", {
    env: process.env,
    stdio: "pipe",
  });
}
