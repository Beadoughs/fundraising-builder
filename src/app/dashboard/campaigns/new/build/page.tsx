import {
  CampaignBuilder,
  templateToDraft,
} from "@/components/CampaignBuilder";
import { getTemplate } from "@/lib/templates";
import Link from "next/link";

type PageProps = {
  searchParams: Promise<{ template?: string }>;
};

export default async function BuildCampaignPage({ searchParams }: PageProps) {
  const { template: templateId } = await searchParams;
  const template = templateId ? getTemplate(templateId) : undefined;

  const initial = template ? templateToDraft(template) : undefined;

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/dashboard/campaigns/new"
          className="text-sm text-gray-500 hover:text-brand"
        >
          ← Choose template
        </Link>
        <h2 className="mt-2 text-2xl font-bold text-gray-900">
          {template ? `${template.emoji} ${template.name}` : "New fundraiser"}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {template
            ? "Products and goal are pre-filled — customise and launch."
            : "Set up your products, costs, and goal."}
        </p>
      </div>
      <CampaignBuilder mode="create" initial={initial} />
    </div>
  );
}
