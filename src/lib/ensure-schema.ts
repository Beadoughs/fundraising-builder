import { Prisma, PrismaClient } from "@prisma/client";

import { getDirectDatabaseUrlCandidates } from "@/lib/database-url";
import { prisma } from "@/lib/db";

const globalForSchema = globalThis as unknown as {
  schemaEnsurePromise?: Promise<void>;
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

export class SchemaEnsureError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown
  ) {
    super(message);
    this.name = "SchemaEnsureError";
  }
}

async function tableHasRequiredColumns(
  tableName: string,
  columns: readonly string[]
): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ column_name: string }[]>`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = ${tableName}
      AND column_name IN (${Prisma.join([...columns])})
  `;

  return rows.length === columns.length;
}

async function isSchemaComplete(): Promise<boolean> {
  const checks = await Promise.all(
    Object.entries(REQUIRED_TABLE_COLUMNS).map(([table, columns]) =>
      tableHasRequiredColumns(table, columns)
    )
  );

  return checks.every(Boolean);
}

function getDdlClient(url: string): PrismaClient {
  if (
    !globalForSchema.ddlPrisma ||
    globalForSchema.ddlPrismaUrl !== url
  ) {
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
    await client.$executeRawUnsafe(statement);
  }
}

async function runEnsureSchema(): Promise<void> {
  if (await isSchemaComplete()) {
    console.log("[ensureSchema] Schema already complete — skipping DDL");
    return;
  }

  const candidates = getDirectDatabaseUrlCandidates();
  if (candidates.length === 0) {
    throw new SchemaEnsureError(
      "DATABASE_URL is not configured — cannot apply schema updates."
    );
  }

  console.log(
    `[ensureSchema] Applying ${SCHEMA_STATEMENTS.length} statements via ${candidates.length} connection candidate(s)`
  );

  let lastError: unknown;

  for (const connectionUrl of candidates) {
    try {
      const host = new URL(connectionUrl).hostname;
      console.log(`[ensureSchema] Trying connection host: ${host}`);
      await applySchemaStatements(connectionUrl);

      if (await isSchemaComplete()) {
        console.log("[ensureSchema] Schema applied successfully");
        return;
      }
    } catch (error) {
      lastError = error;
      console.error(
        `[ensureSchema] DDL failed for host ${safeHostname(connectionUrl)}`,
        error
      );
    }
  }

  throw new SchemaEnsureError(
    "Could not apply database schema updates. Set DIRECT_URL to your Neon direct (non-pooler) connection string, or ensure DATABASE_URL can reach the database.",
    lastError
  );
}

function safeHostname(connectionUrl: string): string {
  try {
    return new URL(connectionUrl).hostname;
  } catch {
    return "(invalid url)";
  }
}

export async function ensureSchema(): Promise<void> {
  if (!globalForSchema.schemaEnsurePromise) {
    globalForSchema.schemaEnsurePromise = runEnsureSchema().catch((error) => {
      globalForSchema.schemaEnsurePromise = undefined;
      throw error;
    });
  }
  return globalForSchema.schemaEnsurePromise;
}
