import { GoalProgress } from "@/components/dashboard/GoalProgress";
import { PublicCampaignStore } from "@/components/PublicCampaignStore";
import { ActivityFeed } from "@/components/public/ActivityFeed";
import { CountdownTimer } from "@/components/public/CountdownTimer";
import { LiveLeaderboard } from "@/components/public/LiveLeaderboard";
import { prisma } from "@/lib/db";
import { getCampaignActivity } from "@/lib/campaign-activity";
import { getPublicLeaderboard } from "@/lib/fundraising-stats";
import { goalProgressPercent, sumRevenue } from "@/lib/profit";
import { SafeImage } from "@/components/SafeImage";
import Link from "next/link";
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
    where: { slug },
    include: {
      products: { orderBy: { sortOrder: "asc" } },
      orders: { where: { status: "paid" }, include: { items: true } },
    },
  });

  if (!campaign || campaign.archived) notFound();

  if (!campaign.published) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md rounded-xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-gray-900">
            This fundraiser isn&apos;t live yet
          </h1>
          <p className="mt-3 text-sm text-gray-600">
            {campaign.name} hasn&apos;t been published. The organiser needs to
            publish it from their dashboard before orders can be placed.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-block text-sm font-medium text-brand hover:underline"
          >
            Go to dashboard →
          </Link>
        </div>
      </div>
    );
  }

  const allItems = campaign.orders.flatMap((o) => o.items);
  const totalRaised = sumRevenue(allItems);
  const goalProgress = goalProgressPercent(totalRaised, campaign.goalAmount);

  const [participants, activities] = await Promise.all([
    campaign.leaderboardEnabled
      ? getPublicLeaderboard(campaign.id)
      : Promise.resolve([]),
    getCampaignActivity(campaign.id),
  ]);

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

          {campaign.endDate && (
            <div className="mx-auto mt-6 max-w-sm">
              <CountdownTimer endDate={campaign.endDate.toISOString()} />
            </div>
          )}

          {(campaign.goalAmount || totalRaised > 0) && (
            <div className="mx-auto mt-6 max-w-sm">
              <GoalProgress
                raised={totalRaised}
                goal={campaign.goalAmount}
                progress={goalProgress}
                size="md"
              />
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

      <main className="mx-auto max-w-2xl space-y-8 px-4 py-8">
        <ActivityFeed slug={campaign.slug} initialActivities={activities} />

        <section>
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
        </section>

        {campaign.leaderboardEnabled && (
          <LiveLeaderboard
            entries={participants.map((p) => ({
              id: p.id,
              name: p.name,
              team: p.team,
              revenue: p.revenue,
            }))}
            title="Live leaderboard"
          />
        )}
      </main>

      <footer className="border-t border-gray-100 py-8 text-center text-xs text-gray-400">
        Powered by Beadoughs · Secure payments by Stripe
      </footer>
    </div>
  );
}
