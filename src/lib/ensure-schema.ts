import { PrismaClient } from "@prisma/client";

import { getDirectDatabaseUrlCandidates } from "@/lib/database-url";
import { prisma } from "@/lib/db";

const globalForSchema = globalThis as unknown as {
  schemaEnsurePromise?: Promise<SchemaEnsureResult>;
  ddlPrisma?: PrismaClient;
  ddlPrismaUrl?: string;
};

const REQUIRED_TABLE_COLUMNS = {
  User: [
    "passwordHash",
    "orgName",
    "onboardingComplete",
    "stripeConnectAccountId",
    "stripeConnectOnboarded",
  ],
  Campaign: ["endDate"],
} as const;

/**
 * Applies pending schema changes idempotently at runtime.
 * Needed on Vercel when DATABASE_URL is only available at runtime, not during build.
 *
 * DDL (ALTER TABLE) must use a direct (non-pooler) connection — Neon pooled URLs reject it.
 */
const SCHEMA_STATEMENTS = [
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "orgName" TEXT`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "onboardingComplete" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripeConnectAccountId" TEXT`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripeConnectOnboarded" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordHash" TEXT`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_stripeConnectAccountId_key" ON "User"("stripeConnectAccountId")`,
  `ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "endDate" TIMESTAMP(3)`,
];

export type SchemaEnsureResult =
  | { ok: true }
  | {
      ok: false;
      message: string;
      missing: Record<string, string[]>;
      cause?: unknown;
    };

export class SchemaEnsureError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown
  ) {
    super(message);
    this.name = "SchemaEnsureError";
  }
}

async function getTableColumns(tableName: string): Promise<Set<string>> {
  const rows = await prisma.$queryRaw<{ attname: string }[]>`
    SELECT a.attname
    FROM pg_attribute a
    INNER JOIN pg_class c ON a.attrelid = c.oid
    INNER JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND c.relname = ${tableName}
      AND a.attnum > 0
      AND NOT a.attisdropped
  `;

  return new Set(rows.map((row) => row.attname));
}

async function getMissingColumns(): Promise<Record<string, string[]>> {
  const missing: Record<string, string[]> = {};

  for (const [table, columns] of Object.entries(REQUIRED_TABLE_COLUMNS)) {
    const existing = await getTableColumns(table);
    const absent = columns.filter((column) => !existing.has(column));
    if (absent.length > 0) {
      missing[table] = absent;
    }
  }

  return missing;
}

async function isSchemaComplete(): Promise<boolean> {
  const missing = await getMissingColumns();
  return Object.keys(missing).length === 0;
}

function getDdlClient(url: string): PrismaClient {
  if (!globalForSchema.ddlPrisma || globalForSchema.ddlPrismaUrl !== url) {
    void globalForSchema.ddlPrisma?.$disconnect();
    globalForSchema.ddlPrismaUrl = url;
    globalForSchema.ddlPrisma = new PrismaClient({
      datasources: { db: { url } },
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  }

  return globalForSchema.ddlPrisma;
}

async function applySchemaStatements(connectionUrl: string): Promise<void> {
  const client = getDdlClient(connectionUrl);

  for (const statement of SCHEMA_STATEMENTS) {
    try {
      await client.$executeRawUnsafe(statement);
    } catch (error) {
      console.error(
        `[ensureSchema] Statement failed on ${safeHostname(connectionUrl)}:`,
        statement,
        error
      );
      throw error;
    }
  }
}

function formatMissingColumns(missing: Record<string, string[]>): string {
  return Object.entries(missing)
    .map(([table, columns]) => `${table}(${columns.join(", ")})`)
    .join(", ");
}

async function runEnsureSchema(): Promise<SchemaEnsureResult> {
  const initialMissing = await getMissingColumns();
  if (Object.keys(initialMissing).length === 0) {
    console.log("[ensureSchema] Schema already complete — skipping DDL");
    return { ok: true };
  }

  console.log(
    `[ensureSchema] Missing columns: ${formatMissingColumns(initialMissing)}`
  );

  const candidates = getDirectDatabaseUrlCandidates();
  if (candidates.length === 0) {
    const message = "DATABASE_URL is not configured — cannot apply schema updates.";
    console.error(`[ensureSchema] ${message}`);
    return {
      ok: false,
      message,
      missing: initialMissing,
    };
  }

  console.log(
    `[ensureSchema] Applying ${SCHEMA_STATEMENTS.length} statements via ${candidates.length} connection candidate(s)`
  );

  let lastError: unknown;

  for (const connectionUrl of candidates) {
    try {
      console.log(`[ensureSchema] Trying connection host: ${safeHostname(connectionUrl)}`);
      await applySchemaStatements(connectionUrl);

      const remaining = await getMissingColumns();
      if (Object.keys(remaining).length === 0) {
        console.log("[ensureSchema] Schema applied successfully");
        return { ok: true };
      }

      console.warn(
        `[ensureSchema] DDL ran but columns still missing: ${formatMissingColumns(remaining)}`
      );
    } catch (error) {
      lastError = error;
      console.error(
        `[ensureSchema] DDL failed for host ${safeHostname(connectionUrl)}`,
        error
      );
    }
  }

  const missing = await getMissingColumns();
  const message =
    "Could not apply database schema updates. Set DIRECT_URL to your Neon direct (non-pooler) connection string, or ensure DATABASE_URL can reach the database.";

  console.error(
    `[ensureSchema] ${message} Still missing: ${formatMissingColumns(missing)}`,
    lastError
  );

  return {
    ok: false,
    message,
    missing,
    cause: lastError,
  };
}

function safeHostname(connectionUrl: string): string {
  try {
    return new URL(connectionUrl).hostname;
  } catch {
    return "(invalid url)";
  }
}

export async function ensureSchema(): Promise<SchemaEnsureResult> {
  if (!globalForSchema.schemaEnsurePromise) {
    globalForSchema.schemaEnsurePromise = runEnsureSchema().catch((error) => {
      globalForSchema.schemaEnsurePromise = undefined;
      console.error("[ensureSchema] Unexpected failure:", error);
      return {
        ok: false,
        message: error instanceof Error ? error.message : "Schema ensure failed",
        missing: {},
        cause: error,
      } satisfies SchemaEnsureResult;
    });
  }
  return globalForSchema.schemaEnsurePromise;
}

/** Throws SchemaEnsureError — use when schema must be ready (e.g. registration). */
export async function ensureSchemaOrThrow(): Promise<void> {
  const result = await ensureSchema();
  if (!result.ok) {
    throw new SchemaEnsureError(result.message, result.cause);
  }
}
