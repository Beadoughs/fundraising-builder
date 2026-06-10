/**
 * Resolves candidate direct (non-pooler) PostgreSQL URLs for DDL and migrations.
 * Neon pooled hostnames include "-pooler"; the direct host omits that suffix.
 */
export function deriveDirectDatabaseUrl(databaseUrl: string): string {
  try {
    const parsed = new URL(databaseUrl);
    if (parsed.hostname.includes("-pooler")) {
      parsed.hostname = parsed.hostname.replace("-pooler", "");
    }
    // Session-mode pooler flags must be removed for DDL.
    parsed.searchParams.delete("pgbouncer");
    return parsed.toString();
  } catch {
    return databaseUrl
      .replace(/-pooler(?=\.)/, "")
      .replace(/([?&])pgbouncer=true(&|$)/, "$1")
      .replace(/[?&]$/, "");
  }
}

export function getDirectDatabaseUrlCandidates(): string[] {
  const explicit = process.env.DIRECT_URL?.trim();
  const databaseUrl = process.env.DATABASE_URL?.trim();
  const candidates: string[] = [];

  if (explicit) {
    candidates.push(explicit);
  }

  if (databaseUrl) {
    const derivedDirect = deriveDirectDatabaseUrl(databaseUrl);
    candidates.push(derivedDirect);
    if (derivedDirect !== databaseUrl) {
      candidates.push(databaseUrl);
    } else if (!explicit) {
      candidates.push(databaseUrl);
    }
  }

  return [...new Set(candidates)];
}

export function getPrimaryDirectDatabaseUrl(): string | undefined {
  return getDirectDatabaseUrlCandidates()[0];
}
