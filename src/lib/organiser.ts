import { prisma } from "@/lib/db";

const DEFAULT_ORGANISER_EMAIL = "organiser@localhost";

export async function getDefaultOrganiserId(): Promise<string> {
  const user = await prisma.user.upsert({
    where: { email: DEFAULT_ORGANISER_EMAIL },
    create: {
      email: DEFAULT_ORGANISER_EMAIL,
      name: "Organiser",
    },
    update: {},
  });

  return user.id;
}
