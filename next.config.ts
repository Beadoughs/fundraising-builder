import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/*": ["./prisma/build.db", "./prisma/build-schema.sql"],
    "/dashboard": ["./prisma/build.db", "./prisma/build-schema.sql"],
    "/dashboard/*": ["./prisma/build.db", "./prisma/build-schema.sql"],
    "/api/*": ["./prisma/build.db", "./prisma/build-schema.sql"],
  },
  serverExternalPackages: ["@libsql/client", "libsql"],
};

export default nextConfig;
