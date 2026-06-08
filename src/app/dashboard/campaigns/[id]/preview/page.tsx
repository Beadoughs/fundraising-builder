import { CampaignPreviewPage } from "@/components/CampaignPreviewPage";
import { prisma } from "@/lib/db";
import { getDefaultOrganiserId } from "@/lib/organiser";
import { notFound } from "next/navigation";

type PageProps = { params: Promise<{ id: string }> };

export default async function CampaignPreviewRoute({ params }: PageProps) {
  const { id } = await params;
  const organiserId = await getDefaultOrganiserId();

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      products: { orderBy: { sortOrder: "asc" } },
      orders: { where: { status: "paid" }, select: { total: true } },
    },
  });

  if (!campaign || campaign.userId !== organiserId) {
    notFound();
  }

  const totalRaised = campaign.orders.reduce((sum, o) => sum + o.total, 0);

  return (
    <CampaignPreviewPage
      campaignId={campaign.id}
      slug={campaign.slug}
      published={campaign.published}
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
