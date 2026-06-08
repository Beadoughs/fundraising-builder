import { prisma } from "@/lib/db";

const DEFAULT_EMAIL = "organiser@localhost";

export async function getDefaultOrganiserId(): Promise<string> {
  const user = await prisma.user.upsert({
    where: { email: DEFAULT_EMAIL },
    update: {},
    create: { email: DEFAULT_EMAIL },
  });
  return user.id;
}
