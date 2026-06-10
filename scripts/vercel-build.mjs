import { execSync } from "node:child_process";

function run(command) {
  execSync(command, { stdio: "inherit" });
}

run("prisma generate");

if (process.env.DATABASE_URL) {
  console.log("DATABASE_URL is set — running prisma migrate deploy");
  run("prisma migrate deploy");
} else {
  console.warn(
    "DATABASE_URL is not set at build time — skipping prisma migrate deploy. " +
      "Schema will be ensured at runtime on first registration request."
  );
}

run("next build");
