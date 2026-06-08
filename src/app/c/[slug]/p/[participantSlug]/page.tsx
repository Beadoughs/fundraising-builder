import { PublicCampaignStore } from "@/components/PublicCampaignStore";
import { GoalProgress } from "@/components/dashboard/GoalProgress";
import { Leaderboard } from "@/components/dashboard/Leaderboard";
import { SafeImage } from "@/components/SafeImage";
import { getParticipantStats } from "@/lib/fundraising-stats";
import { goalProgressPercent } from "@/lib/profit";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import { sumRevenue } from "@/lib/profit";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string; participantSlug: string }>;
  searchParams: Promise<{ cancelled?: string }>;
};

export default async function ParticipantStorePage({
  params,
  searchParams,
}: PageProps) {
  const { slug, participantSlug } = await params;
  const { cancelled } = await searchParams;

  const campaign = await prisma.campaign.findUnique({
    where: { slug, published: true },
    include: {
      products: { orderBy: { sortOrder: "asc" } },
      orders: { where: { status: "paid" }, include: { items: true } },
    },
  });
  if (!campaign) notFound();

  const participant = await prisma.participant.findFirst({
    where: { campaignId: campaign.id, slug: participantSlug },
  });
  if (!participant) notFound();

  const allItems = campaign.orders.flatMap((o) => o.items);
  const totalRaised = sumRevenue(allItems);
  const goalProgress = goalProgressPercent(totalRaised, campaign.goalAmount);

  const participantStats = await getParticipantStats(campaign.id);
  const sellerStats = participantStats.find((p) => p.id === participant.id);

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
            Support {participant.name}
          </h1>
          <p className="mt-2 text-gray-600">
            {campaign.name}
            {participant.team && ` · ${participant.team}`}
          </p>

          {sellerStats && sellerStats.orderCount > 0 && (
            <p className="mt-3 text-sm font-semibold text-emerald-600">
              {participant.name} has raised {formatCurrency(sellerStats.profit)}{" "}
              profit so far
            </p>
          )}

          {(campaign.goalAmount || totalRaised > 0) && (
            <div className="mx-auto mt-6 max-w-sm">
              <GoalProgress
                raised={totalRaised}
                goal={campaign.goalAmount}
                progress={goalProgress}
              />
            </div>
          )}
        </div>
      </header>

      {cancelled && (
        <div className="mx-auto max-w-2xl px-4 pt-4">
          <div className="rounded-lg bg-amber-50 px-4 py-3 text-center text-sm text-amber-800">
            Payment was cancelled. Your cart is still saved — try again when
            ready.
          </div>
        </div>
      )}

      <main className="mx-auto max-w-2xl px-4 py-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Order now</h2>
        <PublicCampaignStore
          slug={campaign.slug}
          participantSlug={participantSlug}
          products={campaign.products.map((p) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            imageUrl: p.imageUrl,
            quantityLimit: p.quantityLimit,
          }))}
        />

        {campaign.leaderboardEnabled && participantStats.length > 1 && (
          <div className="mt-12">
            <Leaderboard entries={participantStats} title="Seller leaderboard" />
          </div>
        )}
      </main>

      <footer className="border-t border-gray-100 py-8 text-center text-xs text-gray-400">
        Powered by Beadoughs · Secure payments by Stripe
      </footer>
    </div>
  );
}
