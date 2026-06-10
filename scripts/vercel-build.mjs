import { execSync } from "node:child_process";

function run(command, env = process.env) {
  execSync(command, { stdio: "inherit", env });
}

run("prisma generate");

if (process.env.DATABASE_URL || process.env.DIRECT_URL) {
  const migrateEnv = { ...process.env };

  if (process.env.DIRECT_URL) {
    console.log("DIRECT_URL is set — running prisma migrate deploy via direct connection");
  } else {
    console.warn(
      "DIRECT_URL is not set — running prisma migrate deploy with DATABASE_URL. " +
        "This may fail with Neon pooled connections; set DIRECT_URL to the non-pooler URL."
    );
    migrateEnv.DIRECT_URL = process.env.DATABASE_URL;
  }

  run("prisma migrate deploy", migrateEnv);
} else {
  console.warn(
    "DATABASE_URL is not set at build time — skipping prisma migrate deploy. " +
      "Schema will be ensured at runtime on first registration request."
  );
}

run("next build");
