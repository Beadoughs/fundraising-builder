import { CampaignManageActions } from "@/components/CampaignManageActions";
import { CampaignNav } from "@/components/dashboard/CampaignNav";
import { GoalProgress } from "@/components/dashboard/GoalProgress";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Leaderboard } from "@/components/dashboard/Leaderboard";
import { Card } from "@/components/ui/Form";
import { getCampaignById } from "@/lib/campaigns";
import {
  getCampaignStats,
  getFulfillmentSummary,
  getParticipantStats,
  getProductStats,
} from "@/lib/fundraising-stats";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function CampaignOverviewPage({ params }: PageProps) {
  const { id } = await params;

  if (!(await getCampaignById(id))) notFound();

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      orders: {
        include: {
          items: true,
          participant: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });
  if (!campaign) notFound();

  const [stats, participants, products, fulfillment] = await Promise.all([
    getCampaignStats(id),
    getParticipantStats(id),
    getProductStats(id),
    getFulfillmentSummary(id),
  ]);
  if (!stats) notFound();

  const outstandingOrders = fulfillment.pending + fulfillment.ready;
  const statusLabel =
    stats.status === "live"
      ? "Live"
      : stats.status === "archived"
        ? "Archived"
        : "Draft";
  const statusColor =
    stats.status === "live"
      ? "bg-green-100 text-green-700"
      : stats.status === "archived"
        ? "bg-gray-200 text-gray-600"
        : "bg-amber-100 text-amber-700";

  return (
    <div>
      <CampaignNav campaignId={id} campaignName={campaign.name} />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="Total revenue"
          value={formatCurrency(stats.revenue)}
          accent="brand"
        />
        <KpiCard
          label="Total profit"
          value={formatCurrency(stats.profit)}
          sub={`${stats.revenue > 0 ? Math.round((stats.profit / stats.revenue) * 100) : 0}% margin`}
          accent="green"
        />
        <KpiCard label="Total orders" value={String(stats.orderCount)} accent="blue" />
        <KpiCard
          label="Participants"
          value={String(stats.participantCount)}
          accent="purple"
        />
        <KpiCard
          label="Outstanding orders"
          value={String(outstandingOrders)}
          sub="Need fulfilment"
          accent={outstandingOrders > 0 ? "brand" : "gray"}
        />
        <KpiCard
          label="Status"
          value={statusLabel}
          sub={
            stats.goalAmount
              ? `${stats.goalProgress ?? 0}% of goal`
              : "No goal set"
          }
          accent="gray"
        />
      </div>

      {stats.goalAmount && (
        <Card className="mb-8">
          <h3 className="mb-3 font-semibold text-gray-900">Fundraising goal</h3>
          <GoalProgress
            raised={stats.revenue}
            goal={stats.goalAmount}
            progress={stats.goalProgress}
            size="lg"
          />
        </Card>
      )}

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        {campaign.leaderboardEnabled && (
          <Leaderboard entries={participants} title="Top sellers" />
        )}

        <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <h3 className="font-semibold text-gray-900">Top products by profit</h3>
          </div>
          {products.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-gray-500">
              No sales yet
            </p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {products.slice(0, 5).map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between px-5 py-3.5"
                >
                  <div>
                    <p className="font-medium text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-400">
                      {p.unitsSold} sold · {formatCurrency(p.price)} each
                    </p>
                  </div>
                  <p className="font-semibold text-emerald-600">
                    {formatCurrency(p.profit)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-4">
        <Link
          href={`/dashboard/campaigns/${id}/participants`}
          className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm hover:border-brand/30"
        >
          <p className="text-sm text-gray-500">Manage</p>
          <p className="font-semibold text-gray-900">Participants →</p>
        </Link>
        <Link
          href={`/dashboard/campaigns/${id}/fulfillment`}
          className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm hover:border-brand/30"
        >
          <p className="text-sm text-gray-500">Fulfil</p>
          <p className="font-semibold text-gray-900">
            {outstandingOrders} orders pending →
          </p>
        </Link>
        <Link
          href={`/dashboard/campaigns/${id}/reports`}
          className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm hover:border-brand/30"
        >
          <p className="text-sm text-gray-500">Download</p>
          <p className="font-semibold text-gray-900">Reports →</p>
        </Link>
        <Link
          href={`/dashboard/campaigns/${id}/preview`}
          className="rounded-xl border border-brand/20 bg-brand/5 p-4 shadow-sm hover:border-brand/40"
        >
          <p className="text-sm text-brand/70">Share</p>
          <p className="font-semibold text-brand">Preview & publish →</p>
        </Link>
      </div>

      <div className="mb-8">
        <CampaignManageActions
          campaignId={campaign.id}
          campaignName={campaign.name}
          archived={campaign.archived}
        />
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Recent orders</h3>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`}>
            {statusLabel}
          </span>
        </div>
        {campaign.orders.length === 0 ? (
          <Card className="py-8 text-center text-gray-500">
            No orders yet. Share your fundraiser link to start selling!
          </Card>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Seller</th>
                    <th className="px-4 py-3 font-medium">Total</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {campaign.orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-gray-600">
                        {order.createdAt.toLocaleDateString("en-AU", {
                          day: "numeric",
                          month: "short",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">
                          {order.customerName}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {order.participant?.name || "—"}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            order.status === "paid"
                              ? "bg-green-100 text-green-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
