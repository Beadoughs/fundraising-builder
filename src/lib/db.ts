import { ensureDatabaseReady } from "@/lib/db-init";
import { canUseTurso, ensureDatabaseUrl } from "@/lib/env";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  ensureDatabaseUrl();
  ensureDatabaseReady();

  const url = ensureDatabaseUrl();
  const adapter = new PrismaLibSQL(
    canUseTurso()
      ? { url, authToken: process.env.TURSO_AUTH_TOKEN! }
      : { url }
  );

  return new PrismaClient({ adapter });
}

function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

/** Lazy proxy so importing this module never throws before the first query. */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrismaClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(client)
      : value;
  },
});
