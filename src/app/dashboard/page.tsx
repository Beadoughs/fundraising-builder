import { CampaignManageActions } from "@/components/CampaignManageActions";
import { GoalProgress } from "@/components/dashboard/GoalProgress";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Card } from "@/components/ui/Form";
import { requirePageUser } from "@/lib/session";
import { getOrganisationStats } from "@/lib/fundraising-stats";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

const campaignInclude = {
  products: true,
  _count: { select: { orders: true, participants: true } },
};

const emptyOrgStats = {
  revenue: 0,
  profit: 0,
  cost: 0,
  orderCount: 0,
  participantCount: 0,
  campaignCount: 0,
  liveCount: 0,
};

async function loadDashboardData(userId: string) {
  try {
    const [orgStats, activeCampaigns, archivedCampaigns] = await Promise.all([
      getOrganisationStats(userId),
      prisma.campaign.findMany({
        where: { userId, archived: false },
        include: {
          ...campaignInclude,
          orders: {
            where: { status: "paid" as const },
            include: { items: true },
          },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.campaign.findMany({
        where: { userId, archived: true },
        include: campaignInclude,
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    return {
      ok: true as const,
      orgStats,
      activeCampaigns,
      archivedCampaigns,
    };
  } catch (error) {
    console.error("[dashboard] Failed to load dashboard data:", error);
    return {
      ok: false as const,
      orgStats: emptyOrgStats,
      activeCampaigns: [],
      archivedCampaigns: [],
    };
  }
}

export default async function DashboardPage() {
  const user = await requirePageUser();
  const data = await loadDashboardData(user.id);
  const { orgStats, activeCampaigns, archivedCampaigns } = data;

  return (
    <div>
      {!data.ok && (
        <Card className="mb-6 border-amber-200 bg-amber-50 py-4 text-center">
          <p className="text-sm font-medium text-amber-900">
            We couldn&apos;t load your stats right now
          </p>
          <p className="mt-1 text-sm text-amber-800">
            Your account is fine — try reloading the page in a moment.
          </p>
        </Card>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="Total revenue"
          value={formatCurrency(orgStats.revenue)}
          accent="brand"
        />
        <KpiCard
          label="Total profit"
          value={formatCurrency(orgStats.profit)}
          sub="Across all fundraisers"
          accent="green"
        />
        <KpiCard
          label="Total orders"
          value={String(orgStats.orderCount)}
          accent="blue"
        />
        <KpiCard
          label="Participants"
          value={String(orgStats.participantCount)}
          accent="purple"
        />
        <KpiCard
          label="Live fundraisers"
          value={String(orgStats.liveCount)}
          sub={`${orgStats.campaignCount} total`}
          accent="gray"
        />
        <KpiCard
          label="Profit margin"
          value={
            orgStats.revenue > 0
              ? `${Math.round((orgStats.profit / orgStats.revenue) * 100)}%`
              : "—"
          }
          accent="green"
        />
      </div>

      {activeCampaigns.length === 0 ? (
        <Card className="py-12 text-center">
          <p className="text-lg font-medium text-gray-900">
            {data.ok ? "Launch your first fundraiser" : "Dashboard data unavailable"}
          </p>
          <p className="mt-2 text-sm text-gray-500">
            {data.ok
              ? "Set up your products and go live in under 5 minutes."
              : "Try reloading the page. If this keeps happening, contact support."}
          </p>
          {data.ok && (
            <Link
              href="/dashboard/campaigns/new"
              className="mt-6 inline-flex rounded-lg bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              Start a fundraiser
            </Link>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {activeCampaigns.map((campaign) => {
            const revenue = campaign.orders.reduce(
              (s, o) => s + o.items.reduce((si, i) => si + i.price * i.quantity, 0),
              0
            );
            const profit = campaign.orders.reduce(
              (s, o) =>
                s +
                o.items.reduce(
                  (si, i) =>
                    si + (i.price - (i.cost ?? 0)) * i.quantity,
                  0
                ),
              0
            );
            const goalProgress = campaign.goalAmount
              ? Math.min(100, Math.round((revenue / campaign.goalAmount) * 100))
              : null;

            return (
              <Card
                key={campaign.id}
                className="transition-shadow hover:shadow-md"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Link
                      href={`/dashboard/campaigns/${campaign.id}`}
                      className="min-w-0 flex-1"
                    >
                      <div className="flex items-center gap-2">
                        <h2 className="font-semibold text-gray-900">
                          {campaign.name}
                        </h2>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            campaign.published
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {campaign.published ? "Live" : "Draft"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{campaign.orgName}</p>
                    </Link>
                    <div className="flex gap-6 text-sm">
                      <div>
                        <p className="text-gray-400">Profit</p>
                        <p className="font-semibold text-emerald-600">
                          {formatCurrency(profit)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Revenue</p>
                        <p className="font-semibold text-brand">
                          {formatCurrency(revenue)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Orders</p>
                        <p className="font-semibold">
                          {campaign._count.orders}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Sellers</p>
                        <p className="font-semibold">
                          {campaign._count.participants}
                        </p>
                      </div>
                    </div>
                  </div>

                  {campaign.goalAmount && (
                    <GoalProgress
                      raised={revenue}
                      goal={campaign.goalAmount}
                      progress={goalProgress}
                      size="sm"
                    />
                  )}

                  <div className="flex flex-wrap gap-3 text-sm">
                    <Link
                      href={`/dashboard/campaigns/${campaign.id}`}
                      className="font-medium text-brand hover:underline"
                    >
                      Overview →
                    </Link>
                    <Link
                      href={`/dashboard/campaigns/${campaign.id}/participants`}
                      className="font-medium text-gray-500 hover:text-gray-900"
                    >
                      Participants
                    </Link>
                    <Link
                      href={`/dashboard/campaigns/${campaign.id}/fulfillment`}
                      className="font-medium text-gray-500 hover:text-gray-900"
                    >
                      Fulfilment
                    </Link>
                    <Link
                      href={`/dashboard/campaigns/${campaign.id}/preview`}
                      className="font-medium text-gray-500 hover:text-gray-900"
                    >
                      Share
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {archivedCampaigns.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Archived fundraisers
          </h2>
          <div className="space-y-4">
            {archivedCampaigns.map((campaign) => (
              <Card key={campaign.id} className="border-dashed bg-gray-50/50">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-700">
                      {campaign.name}
                    </h3>
                    <p className="text-sm text-gray-500">{campaign.orgName}</p>
                  </div>
                  <CampaignManageActions
                    campaignId={campaign.id}
                    campaignName={campaign.name}
                    archived
                    compact
                  />
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
