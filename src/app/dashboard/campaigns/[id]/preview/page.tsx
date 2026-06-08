import { CampaignPreviewPage } from "@/components/CampaignPreviewPage";
import { getDefaultOrganiserId } from "@/lib/organiser";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

type PageProps = { params: Promise<{ id: string }> };

export default async function CampaignPreviewRoute({ params }: PageProps) {
  const { id } = await params;
  const userId = await getDefaultOrganiserId();

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      products: { orderBy: { sortOrder: "asc" } },
      orders: { where: { status: "paid" }, select: { total: true } },
    },
  });

  if (!campaign || campaign.userId !== userId) {
    notFound();
  }

  const totalRaised = campaign.orders.reduce((sum, o) => sum + o.total, 0);

  return (
    <CampaignPreviewPage
      campaignId={campaign.id}
      slug={campaign.slug}
      published={campaign.published}
      archived={campaign.archived}
      campaignName={campaign.name}
      preview={{
        name: campaign.name,
        orgName: campaign.orgName,
        description: campaign.description,
        logoUrl: campaign.logoUrl,
        goalAmount: campaign.goalAmount,
        totalRaised,
        products: campaign.products.map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          imageUrl: p.imageUrl,
          quantityLimit: p.quantityLimit,
        })),
      }}
    />
  );
}
