import { execSync } from "child_process";
import { copyFileSync, existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import {
  BUNDLED_DATABASE_PATH,
  ensureDatabaseUrl,
  isTursoDatabase,
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

const bundledSchemaCandidates = [
  "prisma/build-schema.sql",
  "prisma/prisma/build-schema.sql",
];

function getBundledSchemaSqlPath(): string | null {
  for (const relativePath of bundledSchemaCandidates) {
    const absolutePath = join(process.cwd(), relativePath);
    if (existsSync(absolutePath)) {
      return absolutePath;
    }
  }
  return null;
}

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

function bootstrapRuntimeSchema(runtimePath: string): void {
  const schemaPath = getBundledSchemaSqlPath();
  if (!schemaPath) {
    console.error(
      "No bundled database or schema found — dashboard may fail until Turso is configured."
    );
    return;
  }

  try {
    mkdirSync(dirname(runtimePath), { recursive: true });
    const bootstrapScript = join(
      process.cwd(),
      "scripts",
      "bootstrap-sqlite.mjs"
    );
    execSync(
      `"${process.execPath}" "${bootstrapScript}" "${runtimePath}" "${schemaPath}"`,
      { stdio: "pipe" }
    );
  } catch (error) {
    console.error("Failed to bootstrap database schema:", error);
  }
}

/** Apply the current Prisma schema to the SQLite file (adds missing tables/columns). */
function syncSchema(runtimePath: string): void {
  // Build already runs db push; Vercel runtime has no npx/prisma CLI.
  if (process.env.VERCEL) return;

  mkdirSync(dirname(runtimePath), { recursive: true });
  process.env.DATABASE_URL = `file:${runtimePath}`;
  const prismaCli = join(process.cwd(), "node_modules", ".bin", "prisma");
  execSync(`"${prismaCli}" db push --skip-generate`, {
    env: process.env,
    stdio: "pipe",
  });
}

/** Prepare a writable SQLite database before Prisma queries run. */
export function ensureDatabaseReady(): void {
  if (initialized) return;
  initialized = true;

  if (isTursoDatabase()) return;

  const runtimePath = getRuntimeDatabasePath();
  if (!runtimePath) return;

  if (isVercelSqlite() && !existsSync(runtimePath)) {
    const bundledPath = getBundledDatabasePath();
    if (bundledPath) {
      try {
        mkdirSync(dirname(runtimePath), { recursive: true });
        copyFileSync(bundledPath, runtimePath);
      } catch (error) {
        console.error("Failed to copy bundled database:", error);
        bootstrapRuntimeSchema(runtimePath);
      }
    } else {
      bootstrapRuntimeSchema(runtimePath);
    }
  }

  if (!process.env.VERCEL) {
    try {
      syncSchema(runtimePath);
    } catch (error) {
      console.error("Failed to sync database schema:", error);
    }
  }
}
