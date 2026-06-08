import { CampaignPreviewPage } from "@/components/CampaignPreviewPage";
import { getCampaignById } from "@/lib/campaigns";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function CampaignPreviewRoute({ params }: PageProps) {
  const { id } = await params;

  const campaign = await getCampaignById(id);
  if (!campaign) notFound();

  const full = await prisma.campaign.findUnique({
    where: { id },
    include: {
      products: { orderBy: { sortOrder: "asc" } },
      orders: { where: { status: "paid" }, select: { total: true } },
    },
  });
  if (!full) notFound();

  const totalRaised = full.orders.reduce((sum, o) => sum + o.total, 0);

  return (
    <CampaignPreviewPage
      campaignId={full.id}
      slug={full.slug}
      published={full.published}
      archived={full.archived}
      campaignName={full.name}
      preview={{
        name: full.name,
        orgName: full.orgName,
        description: full.description,
        logoUrl: full.logoUrl,
        goalAmount: full.goalAmount,
        totalRaised,
        products: full.products.map((p) => ({
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
