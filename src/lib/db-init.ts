import { ensureSchema } from "@/lib/ensure-schema";

/** Ensures runtime schema is up to date before Prisma queries (Vercel fallback when migrate deploy fails at build). */
export async function ensureDatabaseReady(): Promise<void> {
  await ensureSchema();
}
