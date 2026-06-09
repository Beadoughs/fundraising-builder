import { CampaignNav } from "@/components/dashboard/CampaignNav";
import { FulfillmentBoard } from "@/components/FulfillmentBoard";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { requireOwnedCampaignPage } from "@/lib/campaigns";
import {
  getCollectionList,
  getFulfillmentSummary,
} from "@/lib/fundraising-stats";
import { sumProfit } from "@/lib/profit";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function FulfillmentPage({ params }: PageProps) {
  const { id } = await params;

  const { campaign } = await requireOwnedCampaignPage(id);

  const full = await prisma.campaign.findUnique({
    where: { id },
    include: {
      orders: {
        where: { status: "paid" },
        include: {
          items: true,
          participant: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!full) notFound();

  const [summary, collectionList] = await Promise.all([
    getFulfillmentSummary(id),
    getCollectionList(id),
  ]);

  const orders = full.orders.map((order) => ({
    id: order.id,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    total: order.total,
    profit: sumProfit(order.items),
    fulfillmentStatus: order.fulfillmentStatus,
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((i) => `${i.quantity}× ${i.name}`).join(", "),
    participantName: order.participant?.name ?? null,
  }));

  return (
    <div>
      <CampaignNav campaignId={id} campaignName={full.name} />

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <KpiCard label="Pending" value={String(summary.pending)} accent="brand" />
        <KpiCard label="Ready for pickup" value={String(summary.ready)} accent="blue" />
        <KpiCard label="Collected" value={String(summary.collected)} accent="green" />
        <KpiCard label="Delivered" value={String(summary.delivered)} accent="green" />
      </div>

      <div className="mb-8 flex flex-wrap gap-3">
        <a
          href={`/api/campaigns/${id}/export?type=fulfillment`}
          className="inline-flex rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Export fulfilment CSV ↓
        </a>
        <a
          href={`/api/campaigns/${id}/export?type=collection`}
          className="inline-flex rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Export collection list ↓
        </a>
        <Link
          href={`/dashboard/campaigns/${id}/reports`}
          className="inline-flex rounded-lg border border-brand/20 bg-brand/5 px-4 py-2 text-sm font-medium text-brand hover:bg-brand/10"
        >
          Full reports →
        </Link>
      </div>

      {collectionList.length > 0 && (
        <div className="mb-8 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-gray-900">
            Products to order / prepare
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {collectionList.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3"
              >
                <span className="text-sm font-medium text-gray-900">
                  {item.name}
                </span>
                <span className="rounded-full bg-brand/10 px-3 py-1 text-sm font-bold text-brand">
                  {item.quantity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <h3 className="mb-4 text-lg font-semibold text-gray-900">All orders</h3>
      <FulfillmentBoard campaignId={id} orders={orders} />
    </div>
  );
}
