import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/*": ["./prisma/build.db", "./prisma/schema.prisma"],
    "/dashboard": ["./prisma/build.db", "./prisma/schema.prisma"],
    "/dashboard/*": ["./prisma/build.db", "./prisma/schema.prisma"],
    "/api/*": ["./prisma/build.db", "./prisma/schema.prisma"],
  },
};

export default nextConfig;
