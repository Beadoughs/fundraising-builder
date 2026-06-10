import {
  ensureSchema,
  type SchemaEnsureResult,
} from "@/lib/ensure-schema";

export type DatabaseReadyResult = SchemaEnsureResult;

/**
 * Ensures runtime schema is up to date before Prisma queries (Vercel fallback when migrate deploy fails at build).
 * Never throws — callers decide how to degrade when schema is incomplete.
 */
export async function ensureDatabaseReady(): Promise<DatabaseReadyResult> {
  const result = await ensureSchema();
  if (!result.ok) {
    console.error(
      "[ensureDatabaseReady] Schema incomplete:",
      result.message,
      "missing:",
      result.missing
    );
  }
  return result;
}
