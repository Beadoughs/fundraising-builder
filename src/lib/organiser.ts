import { prisma } from "@/lib/db";
import { ensureDatabaseReady } from "@/lib/db-init";

const DEFAULT_EMAIL = "organiser@localhost";

export async function getDefaultOrganiserId(): Promise<string> {
  ensureDatabaseReady();

  const user = await prisma.user.upsert({
    where: { email: DEFAULT_EMAIL },
    update: {},
    create: { email: DEFAULT_EMAIL },
  });
  return user.id;
}
