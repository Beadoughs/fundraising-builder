import { prisma } from "@/lib/db";
import { ensureDatabaseReady } from "@/lib/db-init";

/** Look up a campaign by id (single-organiser prototype — no ownership check). */
export async function getCampaignById(id: string) {
  ensureDatabaseReady();
  return prisma.campaign.findUnique({ where: { id } });
}
