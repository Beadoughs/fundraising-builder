import {
  CampaignBuilder,
  campaignToDraft,
} from "@/components/CampaignBuilder";
import { getCampaignById } from "@/lib/campaigns";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditCampaignPage({ params }: PageProps) {
  const { id } = await params;

  const campaign = await getCampaignById(id);
  if (!campaign) notFound();

  const full = await prisma.campaign.findUnique({
    where: { id },
    include: { products: { orderBy: { sortOrder: "asc" } } },
  });
  if (!full) notFound();

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Edit fundraiser</h2>
          <p className="text-sm text-gray-500">{full.name}</p>
        </div>
        <div className="flex gap-4 text-sm">
          <Link
            href={`/dashboard/campaigns/${id}`}
            className="font-medium text-gray-500 hover:text-gray-900"
          >
            Manage orders
          </Link>
          <Link
            href={`/dashboard/campaigns/${id}/preview`}
            className="font-medium text-brand hover:underline"
          >
            Preview & share →
          </Link>
        </div>
      </div>
      <CampaignBuilder
        mode="edit"
        initial={{
          id: full.id,
          slug: full.slug,
          published: full.published,
          ...campaignToDraft(full),
        }}
      />
    </div>
  );
}
