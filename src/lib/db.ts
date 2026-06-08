import { ensureDatabaseReady } from "@/lib/db-init";
import { ensureDatabaseUrl, isTursoDatabase } from "@/lib/env";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { PrismaClient } from "@prisma/client";

ensureDatabaseUrl();

function createPrismaClient(): PrismaClient {
  if (isTursoDatabase()) {
    const url = process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL!;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!authToken) {
      throw new Error(
        "TURSO_AUTH_TOKEN is required when TURSO_DATABASE_URL is set"
      );
    }
    const adapter = new PrismaLibSQL({ url, authToken });
    return new PrismaClient({ adapter });
  }

  ensureDatabaseReady();
  return new PrismaClient();
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

globalForPrisma.prisma = prisma;
