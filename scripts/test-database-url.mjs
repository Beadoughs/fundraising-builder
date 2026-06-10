import assert from "node:assert/strict";
import { test } from "node:test";

function deriveDirectDatabaseUrl(databaseUrl) {
  try {
    const parsed = new URL(databaseUrl);
    if (parsed.hostname.includes("-pooler")) {
      parsed.hostname = parsed.hostname.replace("-pooler", "");
      return parsed.toString();
    }
    return databaseUrl;
  } catch {
    return databaseUrl.replace(/-pooler(?=\.)/, "");
  }
}

test("deriveDirectDatabaseUrl strips Neon pooler suffix", () => {
  const pooled =
    "postgresql://user:pass@ep-example-123456-pooler.us-east-2.aws.neon.tech/db?sslmode=require";
  const direct = deriveDirectDatabaseUrl(pooled);
  assert.equal(
    direct,
    "postgresql://user:pass@ep-example-123456.us-east-2.aws.neon.tech/db?sslmode=require"
  );
});

test("deriveDirectDatabaseUrl leaves direct URLs unchanged", () => {
  const direct =
    "postgresql://user:pass@ep-example-123456.us-east-2.aws.neon.tech/db?sslmode=require";
  assert.equal(deriveDirectDatabaseUrl(direct), direct);
});
