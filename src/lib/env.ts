/** Default SQLite path for local dev. */
export const DEFAULT_DATABASE_URL = "file:./dev.db";

/** Writable SQLite path for Vercel serverless (project root is read-only). */
export const VERCEL_DATABASE_URL = "file:/tmp/fundraising.db";

/** SQLite file created during build and bundled into the deployment. */
export const BUNDLED_DATABASE_PATH = "prisma/build.db";

let partialTursoWarningLogged = false;

/** Turso is only usable when both URL and auth token are set. */
export function canUseTurso(): boolean {
  const url = process.env.TURSO_DATABASE_URL ?? "";
  return url.startsWith("libsql:") && Boolean(process.env.TURSO_AUTH_TOKEN);
}

function warnPartialTursoConfig(): void {
  if (
    process.env.TURSO_DATABASE_URL &&
    !process.env.TURSO_AUTH_TOKEN &&
    !partialTursoWarningLogged
  ) {
    partialTursoWarningLogged = true;
    console.warn(
      "TURSO_DATABASE_URL is set but TURSO_AUTH_TOKEN is missing — falling back to local/ephemeral SQLite. Set TURSO_AUTH_TOKEN for persistent storage on Vercel."
    );
  }
}

export function ensureDatabaseUrl(): string {
  warnPartialTursoConfig();

  if (canUseTurso()) {
    return (process.env.DATABASE_URL ??= process.env.TURSO_DATABASE_URL!);
  }

  // Vercel's project root is read-only — always use /tmp for file SQLite.
  if (process.env.VERCEL) {
    return (process.env.DATABASE_URL = VERCEL_DATABASE_URL);
  }

  const url = process.env.DATABASE_URL ?? "";
  if (!url || url.startsWith("libsql:")) {
    return (process.env.DATABASE_URL = DEFAULT_DATABASE_URL);
  }
  return url;
}

/** True when using Turso/libSQL (persistent SQLite on Vercel). */
export function isTursoDatabase(): boolean {
  return canUseTurso();
}

export function isVercelSqlite(): boolean {
  return Boolean(process.env.VERCEL) && !isTursoDatabase();
}

/** Ephemeral /tmp SQLite on Vercel — data is lost across serverless instances. */
export function isEphemeralVercelSqlite(): boolean {
  return isVercelSqlite();
}
