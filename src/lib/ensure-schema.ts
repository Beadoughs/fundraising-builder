import { PrismaClient } from "@prisma/client";

import { prisma } from "@/lib/db";

const globalForSchema = globalThis as unknown as {
  schemaEnsurePromise?: Promise<void>;
  ddlPrisma?: PrismaClient;
};

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
];

function getDdlClient(): PrismaClient {
  const directUrl = process.env.DIRECT_URL?.trim();

  if (directUrl) {
    if (!globalForSchema.ddlPrisma) {
      globalForSchema.ddlPrisma = new PrismaClient({
        datasources: { db: { url: directUrl } },
        log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
      });
    }
    return globalForSchema.ddlPrisma;
  }

  return prisma;
}

async function runEnsureSchema(): Promise<void> {
  const usingDirectUrl = Boolean(process.env.DIRECT_URL?.trim());
  const client = getDdlClient();

  console.log(
    `[ensureSchema] Applying ${SCHEMA_STATEMENTS.length} statements via ${
      usingDirectUrl ? "direct connection (DIRECT_URL)" : "pooled connection (DATABASE_URL fallback)"
    }`
  );

  for (const statement of SCHEMA_STATEMENTS) {
    await client.$executeRawUnsafe(statement);
  }
}

export async function ensureSchema(): Promise<void> {
  if (!globalForSchema.schemaEnsurePromise) {
    globalForSchema.schemaEnsurePromise = runEnsureSchema().catch((error) => {
      globalForSchema.schemaEnsurePromise = undefined;
      console.error(
        "[ensureSchema] Failed to apply schema statements. " +
          "Neon pooled DATABASE_URL cannot run DDL — set DIRECT_URL to your Neon direct (non-pooler) connection string.",
        error
      );
      throw error;
    });
  }
  return globalForSchema.schemaEnsurePromise;
}
