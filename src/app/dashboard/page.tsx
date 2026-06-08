import { CampaignManageActions } from "@/components/CampaignManageActions";
import { Card } from "@/components/ui/Form";
import { getDefaultOrganiserId } from "@/lib/organiser";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

const campaignInclude = {
  products: true,
  orders: { where: { status: "paid" as const }, select: { total: true } },
  _count: { select: { orders: true } },
};

export default async function DashboardPage() {
  const userId = await getDefaultOrganiserId();

  const [activeCampaigns, archivedCampaigns] = await Promise.all([
    prisma.campaign.findMany({
      where: { userId, archived: false },
      include: campaignInclude,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.campaign.findMany({
      where: { userId, archived: true },
      include: campaignInclude,
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const totalRaised = activeCampaigns.reduce(
    (sum, c) => sum + c.orders.reduce((s, o) => s + o.total, 0),
    0
  );

  return (
    <div>
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-gray-500">Total raised</p>
          <p className="mt-1 text-3xl font-bold text-brand">
            {formatCurrency(totalRaised)}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Active campaigns</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">
            {activeCampaigns.length}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Total orders</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">
            {activeCampaigns.reduce((s, c) => s + c._count.orders, 0)}
          </p>
        </Card>
      </div>

      {activeCampaigns.length === 0 ? (
        <Card className="py-12 text-center">
          <p className="text-lg font-medium text-gray-900">
            No active campaigns
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Create your first fundraiser and share the link with your community.
          </p>
          <Link
            href="/dashboard/campaigns/new"
            className="mt-6 inline-flex rounded-lg bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Create campaign
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {activeCampaigns.map((campaign) => {
            const raised = campaign.orders.reduce((s, o) => s + o.total, 0);
            return (
              <Card key={campaign.id} className="transition-shadow hover:shadow-md">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <Link
                    href={`/dashboard/campaigns/${campaign.id}/preview`}
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
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="flex gap-6 text-sm">
                      <div>
                        <p className="text-gray-400">Raised</p>
                        <p className="font-semibold text-brand">
                          {formatCurrency(raised)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Products</p>
                        <p className="font-semibold">{campaign.products.length}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Orders</p>
                        <p className="font-semibold">{campaign._count.orders}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Link
                        href={`/dashboard/campaigns/${campaign.id}/preview`}
                        className="font-medium text-gray-500 hover:text-brand"
                      >
                        Share
                      </Link>
                      <Link
                        href={`/dashboard/campaigns/${campaign.id}/edit`}
                        className="font-medium text-brand hover:underline"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {archivedCampaigns.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-2 text-lg font-semibold text-gray-900">
            Archived campaigns
          </h2>
          <p className="mb-4 text-sm text-gray-500">
            Archived fundraisers are offline and hidden from your main list.
            Restore them or delete permanently.
          </p>
          <div className="space-y-4">
            {archivedCampaigns.map((campaign) => {
              const raised = campaign.orders.reduce((s, o) => s + o.total, 0);
              return (
                <Card key={campaign.id} className="border-dashed bg-gray-50/50">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-700">
                          {campaign.name}
                        </h3>
                        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
                          Archived
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{campaign.orgName}</p>
                      <p className="mt-2 text-sm text-gray-500">
                        Raised {formatCurrency(raised)} · {campaign._count.orders}{" "}
                        orders
                      </p>
                    </div>
                    <CampaignManageActions
                      campaignId={campaign.id}
                      campaignName={campaign.name}
                      archived
                      compact
                    />
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
