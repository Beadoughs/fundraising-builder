import { CampaignBuilder } from "@/components/CampaignBuilder";
import { campaignToDraft } from "@/lib/campaign-draft";
import { CampaignNav } from "@/components/dashboard/CampaignNav";
import { requireOwnedCampaignPage } from "@/lib/campaigns";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditCampaignPage({ params }: PageProps) {
  const { id } = await params;

  await requireOwnedCampaignPage(id);

  const full = await prisma.campaign.findUnique({
    where: { id },
    include: { products: { orderBy: { sortOrder: "asc" } } },
  });
  if (!full) notFound();

  return (
    <div>
      <CampaignNav campaignId={id} campaignName={full.name} />
      <CampaignBuilder
        mode="edit"
        initial={{
          id: full.id,
          slug: full.slug,
          published: full.published,
          ...campaignToDraft(full),
        }}
      />
    </div>
  );
}
