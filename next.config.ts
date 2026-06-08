import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/*": [
      "./prisma/build.db",
      "./prisma/build-schema.sql",
      "./scripts/bootstrap-sqlite.mjs",
    ],
    "/dashboard": [
      "./prisma/build.db",
      "./prisma/build-schema.sql",
      "./scripts/bootstrap-sqlite.mjs",
    ],
    "/dashboard/*": [
      "./prisma/build.db",
      "./prisma/build-schema.sql",
      "./scripts/bootstrap-sqlite.mjs",
    ],
    "/api/*": [
      "./prisma/build.db",
      "./prisma/build-schema.sql",
      "./scripts/bootstrap-sqlite.mjs",
    ],
  },
  serverExternalPackages: ["@libsql/client", "libsql"],
};

export default nextConfig;
