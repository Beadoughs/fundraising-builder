/** Default SQLite path for local dev. */
export const DEFAULT_DATABASE_URL = "file:./dev.db";

/** Writable SQLite path for Vercel serverless (project root is read-only). */
export const VERCEL_DATABASE_URL = "file:/tmp/fundraising.db";

/** SQLite file created during build and bundled into the deployment. */
export const BUNDLED_DATABASE_PATH = "prisma/build.db";

export function ensureDatabaseUrl(): string {
  if (!process.env.DATABASE_URL && process.env.TURSO_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TURSO_DATABASE_URL;
  }
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = process.env.VERCEL
      ? VERCEL_DATABASE_URL
      : DEFAULT_DATABASE_URL;
  }
  return process.env.DATABASE_URL;
}

/** True when using Turso/libSQL (persistent SQLite on Vercel). */
export function isTursoDatabase(): boolean {
  const url = process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL ?? "";
  return url.startsWith("libsql:");
}

export function isVercelSqlite(): boolean {
  return (
    Boolean(process.env.VERCEL) &&
    !isTursoDatabase() &&
    ensureDatabaseUrl().startsWith("file:/tmp/")
  );
}

/** Ephemeral /tmp SQLite on Vercel — data is lost across serverless instances. */
export function isEphemeralVercelSqlite(): boolean {
  return isVercelSqlite();
}
