/** Require DATABASE_URL (PostgreSQL connection string). */
export function ensureDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Add a PostgreSQL connection string to .env (see .env.example)."
    );
  }
  return url;
}
