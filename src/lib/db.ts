import { ensureDatabaseReady } from "@/lib/db-init";
import { canUseTurso, ensureDatabaseUrl } from "@/lib/env";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { PrismaClient } from "@prisma/client";

ensureDatabaseUrl();

function createPrismaClient(): PrismaClient {
  ensureDatabaseReady();

  const url = ensureDatabaseUrl();
  const adapter = new PrismaLibSQL(
    canUseTurso()
      ? { url, authToken: process.env.TURSO_AUTH_TOKEN! }
      : { url }
  );

  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

globalForPrisma.prisma = prisma;
