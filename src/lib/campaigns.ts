import { prisma } from "@/lib/db";
import { ensureDatabaseReady } from "@/lib/db-init";
import { requirePageUser } from "@/lib/session";
import { notFound } from "next/navigation";

/** Campaign owned by the signed-in organiser. */
export async function getOwnedCampaign(id: string, userId: string) {
  await ensureDatabaseReady();
  return prisma.campaign.findFirst({
    where: { id, userId },
  });
}

/** Dashboard pages: require auth and campaign ownership. */
export async function requireOwnedCampaignPage(id: string) {
  const user = await requirePageUser();
  const campaign = await getOwnedCampaign(id, user.id);
  if (!campaign) notFound();
  return { user, campaign };
}
