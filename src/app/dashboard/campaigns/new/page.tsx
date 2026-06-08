import { CampaignBuilder } from "@/components/CampaignBuilder";

export default function NewCampaignPage() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900">New campaign</h2>
        <p className="text-sm text-gray-500">
          Fill in the details below, then preview before you publish.
        </p>
      </div>
      <CampaignBuilder mode="create" />
    </div>
  );
}
