import {
  CampaignBuilder,
  campaignToDraft,
} from "@/components/CampaignBuilder";
import { CampaignManageActions } from "@/components/CampaignManageActions";
import { Card } from "@/components/ui/Form";
import { getDefaultOrganiserId } from "@/lib/organiser";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";

type PageProps = { params: Promise<{ id: string }> };

export default async function CampaignDetailPage({ params }: PageProps) {
  const { id } = await params;
  const userId = await getDefaultOrganiserId();

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      products: { orderBy: { sortOrder: "asc" } },
      orders: {
        include: { items: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!campaign || campaign.userId !== userId) {
    notFound();
  }

  const paidOrders = campaign.orders.filter((o) => o.status === "paid");
  const totalRaised = paidOrders.reduce((sum, o) => sum + o.total, 0);
  const goalProgress = campaign.goalAmount
    ? Math.min(100, Math.round((totalRaised / campaign.goalAmount) * 100))
    : null;

  return (
    <div>
      <div className="mb-8 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900">
                  {campaign.name}
                </h2>
                {campaign.archived ? (
                  <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
                    Archived
                  </span>
                ) : (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      campaign.published
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {campaign.published ? "Live" : "Draft"}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">{campaign.orgName}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-gray-400">Raised</p>
              <p className="text-xl font-bold text-brand">
                {formatCurrency(totalRaised)}
              </p>
            </div>
            {campaign.goalAmount && (
              <div>
                <p className="text-xs text-gray-400">Goal</p>
                <p className="text-xl font-bold">
                  {formatCurrency(campaign.goalAmount)}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-400">Orders</p>
              <p className="text-xl font-bold">{paidOrders.length}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Products</p>
              <p className="text-xl font-bold">{campaign.products.length}</p>
            </div>
          </div>

          {goalProgress !== null && (
            <div className="mt-6">
              <div className="mb-1 flex justify-between text-xs text-gray-500">
                <span>Progress</span>
                <span>{goalProgress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-brand transition-all"
                  style={{ width: `${goalProgress}%` }}
                />
              </div>
            </div>
          )}
        </Card>

        <Card>
          <h3 className="mb-4 font-semibold text-gray-900">Quick actions</h3>
          <div className="space-y-2">
            <Link
              href={`/dashboard/campaigns/${campaign.id}#edit`}
              className="block rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Edit products & details →
            </Link>
            <Link
              href={`/dashboard/campaigns/${campaign.id}/preview`}
              className="block rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Preview & share →
            </Link>
            {campaign.published && (
              <Link
                href={`/c/${campaign.slug}`}
                target="_blank"
                className="block rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                View public page →
              </Link>
            )}
            <a
              href={`/api/campaigns/${campaign.id}/export`}
              className="block rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Export orders (CSV) ↓
            </a>
          </div>
        </Card>
      </div>

      <div className="mb-12">
        <CampaignManageActions
          campaignId={campaign.id}
          campaignName={campaign.name}
          archived={campaign.archived}
        />
      </div>

      <div id="edit" className="mb-12 scroll-mt-8">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Edit campaign
        </h3>
        <CampaignBuilder
          mode="edit"
          initial={{
            id: campaign.id,
            slug: campaign.slug,
            published: campaign.published,
            ...campaignToDraft(campaign),
          }}
        />
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Orders ({campaign.orders.length})
        </h3>
        {campaign.orders.length === 0 ? (
          <Card className="py-8 text-center text-gray-500">
            No orders yet. Share your campaign link to start selling!
          </Card>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Items</th>
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
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">
                          {order.customerName}
                        </p>
                        <p className="text-xs text-gray-400">
                          {order.customerEmail}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {order.items
                          .map((i) => `${i.quantity}× ${i.name}`)
                          .join(", ")}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            order.status === "paid"
                              ? "bg-green-100 text-green-700"
                              : order.status === "pending"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-700"
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
