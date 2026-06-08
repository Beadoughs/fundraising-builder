"use client";

import { Button } from "@/components/ui/Button";
import { CampaignManageActions } from "@/components/CampaignManageActions";
import { CampaignPreview, type PreviewCampaign } from "@/components/CampaignPreview";
import { CampaignSharePanel } from "@/components/CampaignSharePanel";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function CampaignPreviewPage({
  campaignId,
  slug,
  published: initialPublished,
  archived = false,
  campaignName,
  preview,
}: {
  campaignId: string;
  slug: string;
  published: boolean;
  archived?: boolean;
  campaignName: string;
  preview: PreviewCampaign;
}) {
  const router = useRouter();
  const [published, setPublished] = useState(initialPublished);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");

  async function handlePublish() {
    setPublishing(true);
    setError("");

    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: true }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to publish");

      setPublished(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      {published ? (
        <div className="mb-8">
          <CampaignSharePanel slug={slug} campaignName={preview.name} />
        </div>
      ) : (
        <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="text-sm font-medium text-amber-900">Preview mode</p>
          <p className="mt-1 text-sm text-amber-800">
            This is how your fundraiser will look to buyers. Publish when
            you&apos;re happy with it to get your share link and QR code.
          </p>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Buyer preview</h2>
        {!published && (
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
            Not published yet
          </span>
        )}
      </div>

      <div className="mb-8 max-w-2xl mx-auto">
        <CampaignPreview campaign={preview} />
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href={`/dashboard/campaigns/${campaignId}`}
          className="inline-flex flex-1 items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Edit campaign
        </Link>
        {!published ? (
          <Button
            type="button"
            className="flex-1"
            size="lg"
            disabled={publishing}
            onClick={handlePublish}
          >
            {publishing ? "Publishing…" : "Publish fundraiser"}
          </Button>
        ) : (
          <Link
            href="/dashboard"
            className="inline-flex flex-1 items-center justify-center rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Back to dashboard
          </Link>
        )}
      </div>

      <div className="mt-10 border-t border-gray-100 pt-10">
        <CampaignManageActions
          campaignId={campaignId}
          campaignName={campaignName}
          archived={archived}
        />
      </div>
    </div>
  );
}
