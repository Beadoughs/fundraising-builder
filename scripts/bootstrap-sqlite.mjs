import { createClient } from "@libsql/client";
import { readFileSync } from "fs";

const [runtimePath, schemaPath] = process.argv.slice(2);
if (!runtimePath || !schemaPath) {
  console.error("Usage: bootstrap-sqlite.mjs <db-path> <schema.sql>");
  process.exit(1);
}

const sql = readFileSync(schemaPath, "utf8");
const client = createClient({ url: `file:${runtimePath}` });

const statements = sql
  .split(";")
  .map((statement) => statement.trim())
  .filter(
    (statement) => statement.length > 0 && !statement.startsWith("--")
  );

for (const statement of statements) {
  await client.execute(statement);
}

console.log(`Bootstrapped ${runtimePath} (${statements.length} statements)`);
