import { execSync } from "child_process";
import { rmSync, writeFileSync } from "fs";
import { join } from "path";

// Always write to prisma/build.db so Vercel file tracing can bundle it,
// regardless of DATABASE_URL set in the Vercel project env.
const buildDbUrl = "file:./prisma/build.db";
const buildDbPath = "prisma/build.db";
const schemaPath = "prisma/schema.prisma";
const schemaSqlPath = "prisma/build-schema.sql";
const prismaCli = join(process.cwd(), "node_modules", ".bin", "prisma");

rmSync(buildDbPath, { force: true });

const script = execSync(
  `"${prismaCli}" migrate diff --from-empty --to-schema-datamodel ${schemaPath} --script`,
  { encoding: "utf8", env: { ...process.env, DATABASE_URL: buildDbUrl } }
).trim();

writeFileSync(schemaSqlPath, `${script}\n`);

if (!script) {
  console.log("Schema SQL empty — nothing to apply");
  process.exit(0);
}

execSync(`"${prismaCli}" db execute --stdin --url "${buildDbUrl}"`, {
  input: script,
  stdio: ["pipe", "inherit", "inherit"],
  env: { ...process.env, DATABASE_URL: buildDbUrl },
});

console.log(`Initialized ${join(process.cwd(), buildDbPath)} from Prisma schema`);
