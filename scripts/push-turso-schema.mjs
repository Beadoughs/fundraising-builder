import { createClient } from "@libsql/client";
import { execSync } from "child_process";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.log("Skipping Turso schema push (TURSO_DATABASE_URL not set)");
  process.exit(0);
}

function runDiff(args) {
  return execSync(`npx prisma migrate diff ${args} --script`, {
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  }).trim();
}

const client = createClient({ url, authToken });

const tables = await client.execute(
  "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_litestream_%'"
);

let script = "";
if (tables.rows.length === 0) {
  console.log("Turso database empty — applying full schema");
  script = runDiff("--from-empty --to-schema-datamodel prisma/schema.prisma");
} else {
  try {
    script = runDiff(
      `--from-url "${url}" --to-schema-datamodel prisma/schema.prisma`
    );
  } catch {
    console.log("Could not diff Turso remotely — schema may already be current");
    process.exit(0);
  }
}

if (!script) {
  console.log("Turso schema is up to date");
  process.exit(0);
}

const statements = script
  .split(";")
  .map((statement) => statement.trim())
  .filter((statement) => statement.length > 0 && !statement.startsWith("--"));

for (const sql of statements) {
  await client.execute(sql);
}

console.log(`Applied ${statements.length} schema statement(s) to Turso`);
