import { PublicCampaignStore } from "@/components/PublicCampaignStore";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import { SafeImage } from "@/components/SafeImage";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ cancelled?: string }>;
};

export default async function PublicCampaignPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const { cancelled } = await searchParams;

  const campaign = await prisma.campaign.findUnique({
    where: { slug, published: true },
    include: {
      products: { orderBy: { sortOrder: "asc" } },
      orders: { where: { status: "paid" }, select: { total: true } },
    },
  });

  if (!campaign) notFound();

  const totalRaised = campaign.orders.reduce((sum, o) => sum + o.total, 0);
  const goalProgress = campaign.goalAmount
    ? Math.min(100, Math.round((totalRaised / campaign.goalAmount) * 100))
    : null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-2xl px-4 py-8 text-center">
          {campaign.logoUrl && (
            <div className="relative mx-auto mb-4 h-20 w-20 overflow-hidden rounded-full border-2 border-white shadow-md">
              <SafeImage
                src={campaign.logoUrl}
                alt={campaign.orgName}
                fill
                className="object-cover"
              />
            </div>
          )}
          <p className="text-sm font-medium text-brand">{campaign.orgName}</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
            {campaign.name}
          </h1>
          {campaign.description && (
            <p className="mt-3 text-gray-600">{campaign.description}</p>
          )}

          {(campaign.goalAmount || totalRaised > 0) && (
            <div className="mx-auto mt-6 max-w-sm">
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-brand">
                  {formatCurrency(totalRaised)} raised
                </span>
                {campaign.goalAmount && (
                  <span className="text-gray-400">
                    Goal {formatCurrency(campaign.goalAmount)}
                  </span>
                )}
              </div>
              {goalProgress !== null && (
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{ width: `${goalProgress}%` }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {cancelled && (
        <div className="mx-auto max-w-2xl px-4 pt-4">
          <div className="rounded-lg bg-amber-50 px-4 py-3 text-center text-sm text-amber-800">
            Payment was cancelled. Your cart is still saved — try again when ready.
          </div>
        </div>
      )}

      <main className="mx-auto max-w-2xl px-4 py-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Order now
        </h2>
        <PublicCampaignStore
          slug={campaign.slug}
          products={campaign.products.map((p) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            imageUrl: p.imageUrl,
            quantityLimit: p.quantityLimit,
          }))}
        />
      </main>

      <footer className="border-t border-gray-100 py-8 text-center text-xs text-gray-400">
        Powered by Fundraising Builder · Secure payments by Stripe
      </footer>
    </div>
  );
}
