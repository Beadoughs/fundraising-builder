import { CampaignBuilder } from "@/components/CampaignBuilder";

export default function NewCampaignPage() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">New fundraiser</h2>
        <p className="mt-1 text-sm text-gray-500">
          Set up your products, costs, and goal — then share with your community.
        </p>
      </div>
      <CampaignBuilder mode="create" />
    </div>
  );
}
