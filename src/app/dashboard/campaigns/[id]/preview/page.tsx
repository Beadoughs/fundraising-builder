import { CampaignPreviewPage } from "@/components/CampaignPreviewPage";
import { CampaignNav } from "@/components/dashboard/CampaignNav";
import { requireOwnedCampaignPage } from "@/lib/campaigns";
import { prisma } from "@/lib/db";
import { sumRevenue } from "@/lib/profit";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function CampaignPreviewRoute({ params }: PageProps) {
  const { id } = await params;

  const { campaign } = await requireOwnedCampaignPage(id);

  const full = await prisma.campaign.findUnique({
    where: { id },
    include: {
      products: { orderBy: { sortOrder: "asc" } },
      orders: { where: { status: "paid" }, include: { items: true } },
    },
  });
  if (!full) notFound();

  const totalRaised = sumRevenue(full.orders.flatMap((o) => o.items));

  return (
    <div>
      <CampaignNav campaignId={id} campaignName={full.name} />
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
    </div>
  );
}
