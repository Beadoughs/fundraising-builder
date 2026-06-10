import { execSync } from "node:child_process";

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

function run(command, env = process.env) {
  execSync(command, { stdio: "inherit", env });
}

run("prisma generate");

if (process.env.DATABASE_URL || process.env.DIRECT_URL) {
  const migrateEnv = { ...process.env };

  if (process.env.DIRECT_URL) {
    console.log("DIRECT_URL is set — running prisma migrate deploy via direct connection");
  } else if (process.env.DATABASE_URL) {
    migrateEnv.DIRECT_URL = deriveDirectDatabaseUrl(process.env.DATABASE_URL);
    console.log(
      "DIRECT_URL is not set — derived direct connection from DATABASE_URL for migrate deploy"
    );
  } else {
    console.warn("Neither DIRECT_URL nor DATABASE_URL is set — skipping migrate deploy env setup.");
  }

  try {
    run("prisma migrate deploy", migrateEnv);
  } catch (error) {
    console.warn(
      "prisma migrate deploy failed — continuing build. " +
        "Schema will be ensured at runtime via ensureSchema (requires DIRECT_URL at runtime). " +
        "Common causes: pooled connection at build time, DB created with db push (columns already exist), " +
        "or missing _prisma_migrations history."
    );
    if (error instanceof Error && error.message) {
      console.warn(error.message);
    }
  }
} else {
  console.warn(
    "DATABASE_URL is not set at build time — skipping prisma migrate deploy. " +
      "Schema will be ensured at runtime on first registration request."
  );
}

run("next build");
