import { ensureDatabaseReady } from "@/lib/db-init";
import { ensureDatabaseUrl } from "@/lib/env";
import { PrismaClient } from "@prisma/client";

ensureDatabaseUrl();
ensureDatabaseReady();

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
