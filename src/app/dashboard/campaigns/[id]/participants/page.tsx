import { CampaignNav } from "@/components/dashboard/CampaignNav";
import { ParticipantManager } from "@/components/ParticipantManager";
import { getCampaignById } from "@/lib/campaigns";
import { getParticipantStats } from "@/lib/fundraising-stats";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function ParticipantsPage({ params }: PageProps) {
  const { id } = await params;

  const campaign = await getCampaignById(id);
  if (!campaign) notFound();

  const full = await prisma.campaign.findUnique({ where: { id } });
  if (!full) notFound();

  const participants = await getParticipantStats(id);

  return (
    <div>
      <CampaignNav campaignId={id} campaignName={full.name} />
      <ParticipantManager
        campaignId={id}
        campaignSlug={full.slug}
        initialParticipants={participants}
      />
    </div>
  );
}
