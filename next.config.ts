import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/*": ["./prisma/build.db"],
    "/dashboard": ["./prisma/build.db"],
    "/dashboard/*": ["./prisma/build.db"],
    "/api/*": ["./prisma/build.db"],
  },
};

export default nextConfig;
