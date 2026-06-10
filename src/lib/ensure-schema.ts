import { prisma } from "@/lib/db";

const globalForSchema = globalThis as unknown as {
  schemaEnsurePromise?: Promise<void>;
};

/**
 * Applies pending schema changes idempotently at runtime.
 * Needed on Vercel when DATABASE_URL is only available at runtime, not during build.
 */
const SCHEMA_STATEMENTS = [
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "orgName" TEXT`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "onboardingComplete" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripeConnectAccountId" TEXT`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripeConnectOnboarded" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordHash" TEXT`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_stripeConnectAccountId_key" ON "User"("stripeConnectAccountId")`,
];

async function runEnsureSchema(): Promise<void> {
  for (const statement of SCHEMA_STATEMENTS) {
    await prisma.$executeRawUnsafe(statement);
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
