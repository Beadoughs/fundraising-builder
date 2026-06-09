import { CampaignBuilder } from "@/components/CampaignBuilder";
import { prisma } from "@/lib/db";
import { requirePageUser } from "@/lib/session";

export default async function NewCampaignPage() {
  const user = await requirePageUser();
  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { orgName: true },
  });

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">New fundraiser</h2>
        <p className="mt-1 text-sm text-gray-500">
          Set up your products, costs, and goal — then share with your community.
        </p>
      </div>
      <CampaignBuilder mode="create" defaultOrgName={profile?.orgName ?? undefined} />
    </div>
  );
}
