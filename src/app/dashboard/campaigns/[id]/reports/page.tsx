import { CampaignNav } from "@/components/dashboard/CampaignNav";
import { GoalProgress } from "@/components/dashboard/GoalProgress";
import { Leaderboard } from "@/components/dashboard/Leaderboard";
import { PrintButton } from "@/components/PrintButton";
import { requireOwnedCampaignPage } from "@/lib/campaigns";
import {
  getCampaignStats,
  getFulfillmentSummary,
  getParticipantStats,
  getProductStats,
} from "@/lib/fundraising-stats";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function ReportsPage({ params }: PageProps) {
  const { id } = await params;

  const { campaign } = await requireOwnedCampaignPage(id);

  const full = await prisma.campaign.findUnique({ where: { id } });
  if (!full) notFound();

  const [stats, participants, products, fulfillment] = await Promise.all([
    getCampaignStats(id),
    getParticipantStats(id),
    getProductStats(id),
    getFulfillmentSummary(id),
  ]);
  if (!stats) notFound();

  const outstanding = fulfillment.pending + fulfillment.ready;
  const generatedAt = new Date().toLocaleString("en-AU");

  return (
    <div>
      <CampaignNav campaignId={id} campaignName={full.name} />

      <div className="mb-6 flex flex-wrap gap-3 print:hidden">
        <a
          href={`/api/campaigns/${id}/export?type=orders`}
          className="inline-flex rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Download orders CSV
        </a>
        <a
          href={`/api/campaigns/${id}/export?type=participants`}
          className="inline-flex rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Download participant report
        </a>
        <a
          href={`/api/campaigns/${id}/export?type=products`}
          className="inline-flex rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Download product report
        </a>
        <PrintButton />
      </div>

      <article className="rounded-xl border border-gray-100 bg-white p-8 shadow-sm print:border-0 print:shadow-none">
        <header className="border-b border-gray-100 pb-6">
          <p className="text-sm text-gray-500">{full.orgName}</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">{full.name}</h1>
          <p className="mt-2 text-sm text-gray-400">
            Fundraising report · Generated {generatedAt}
          </p>
        </header>

        <section className="grid gap-6 py-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm text-gray-500">Total revenue</p>
            <p className="text-2xl font-bold text-brand">
              {formatCurrency(stats.revenue)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total profit</p>
            <p className="text-2xl font-bold text-emerald-600">
              {formatCurrency(stats.profit)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total orders</p>
            <p className="text-2xl font-bold">{stats.orderCount}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Outstanding fulfilment</p>
            <p className="text-2xl font-bold">{outstanding}</p>
          </div>
        </section>

        {stats.goalAmount && (
          <section className="mb-8">
            <h2 className="mb-3 font-semibold text-gray-900">Goal progress</h2>
            <GoalProgress
              raised={stats.revenue}
              goal={stats.goalAmount}
              progress={stats.goalProgress}
              size="lg"
            />
          </section>
        )}

        <section className="mb-8">
          <h2 className="mb-4 font-semibold text-gray-900">
            Participant performance
          </h2>
          {participants.length === 0 ? (
            <p className="text-sm text-gray-500">No participants added yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-gray-500">
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Team</th>
                  <th className="pb-2 font-medium">Orders</th>
                  <th className="pb-2 font-medium">Revenue</th>
                  <th className="pb-2 font-medium">Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {participants.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2 font-medium">{p.name}</td>
                    <td className="py-2 text-gray-500">{p.team || "—"}</td>
                    <td className="py-2">{p.orderCount}</td>
                    <td className="py-2">{formatCurrency(p.revenue)}</td>
                    <td className="py-2 font-semibold text-emerald-600">
                      {formatCurrency(p.profit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="mb-8">
          <h2 className="mb-4 font-semibold text-gray-900">Product performance</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-gray-500">
                <th className="pb-2 font-medium">Product</th>
                <th className="pb-2 font-medium">Units sold</th>
                <th className="pb-2 font-medium">Revenue</th>
                <th className="pb-2 font-medium">Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="py-2 font-medium">{p.name}</td>
                  <td className="py-2">{p.unitsSold}</td>
                  <td className="py-2">{formatCurrency(p.revenue)}</td>
                  <td className="py-2 font-semibold text-emerald-600">
                    {formatCurrency(p.profit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {full.leaderboardEnabled && participants.length > 0 && (
          <section className="print:hidden">
            <Leaderboard entries={participants} />
          </section>
        )}
      </article>
    </div>
  );
}
