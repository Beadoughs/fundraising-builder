"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Form";
import { useRouter } from "next/navigation";
import { useState } from "react";

type CampaignManageActionsProps = {
  campaignId: string;
  campaignName: string;
  archived: boolean;
  compact?: boolean;
  redirectAfterDelete?: string;
};

export function CampaignManageActions({
  campaignId,
  campaignName,
  archived,
  compact = false,
  redirectAfterDelete = "/dashboard",
}: CampaignManageActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<"archive" | "restore" | "delete" | null>(
    null
  );
  const [error, setError] = useState("");

  async function patchCampaign(body: Record<string, boolean>) {
    const res = await fetch(`/api/campaigns/${campaignId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  }

  async function handleArchive() {
    const confirmed = window.confirm(
      `Archive "${campaignName}"?\n\nIt will be taken offline and moved to your archived list. You can restore it later.`
    );
    if (!confirmed) return;

    setLoading("archive");
    setError("");

    try {
      await patchCampaign({ archived: true });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(null);
    }
  }

  async function handleRestore() {
    setLoading("restore");
    setError("");

    try {
      await patchCampaign({ archived: false });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(null);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `Permanently delete "${campaignName}"?\n\nThis removes the campaign, products, and all order data. This cannot be undone.`
    );
    if (!confirmed) return;

    setLoading("delete");
    setError("");

    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");

      router.push(redirectAfterDelete);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(null);
    }
  }

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {archived ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={loading !== null}
            onClick={handleRestore}
          >
            {loading === "restore" ? "Restoring…" : "Restore"}
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={loading !== null}
            onClick={handleArchive}
          >
            {loading === "archive" ? "Archiving…" : "Archive"}
          </Button>
        )}
        <Button
          type="button"
          variant="danger"
          size="sm"
          disabled={loading !== null}
          onClick={handleDelete}
        >
          {loading === "delete" ? "Deleting…" : "Delete"}
        </Button>
        {error && <p className="w-full text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <Card className="border-gray-200">
      <h3 className="font-semibold text-gray-900">Manage campaign</h3>
      <p className="mt-1 text-sm text-gray-500">
        {archived
          ? "This campaign is archived and hidden from your main dashboard."
          : "Archive to take this fundraiser offline, or delete it permanently."}
      </p>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        {archived ? (
          <Button
            type="button"
            variant="secondary"
            disabled={loading !== null}
            onClick={handleRestore}
          >
            {loading === "restore" ? "Restoring…" : "Restore campaign"}
          </Button>
        ) : (
          <Button
            type="button"
            variant="secondary"
            disabled={loading !== null}
            onClick={handleArchive}
          >
            {loading === "archive" ? "Archiving…" : "Archive campaign"}
          </Button>
        )}
        <Button
          type="button"
          variant="danger"
          disabled={loading !== null}
          onClick={handleDelete}
        >
          {loading === "delete" ? "Deleting…" : "Delete permanently"}
        </Button>
      </div>
    </Card>
  );
}
