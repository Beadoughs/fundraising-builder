import { ensureDatabaseReady } from "@/lib/db-init";
import { canUseTurso, ensureDatabaseUrl } from "@/lib/env";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { PrismaClient } from "@prisma/client";

ensureDatabaseUrl();

function createPrismaClient(): PrismaClient {
  if (canUseTurso()) {
    const adapter = new PrismaLibSQL({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });
    return new PrismaClient({ adapter });
  }

  ensureDatabaseReady();
  return new PrismaClient();
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

globalForPrisma.prisma = prisma;
