"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Form";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

type Props = {
  onboarded: boolean;
  hasAccount: boolean;
};

function PayoutSettingsInner({ onboarded, hasAccount }: Props) {
  const searchParams = useSearchParams();
  const returned = searchParams.get("return") === "1";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState(onboarded ? "complete" : "pending");

  async function startOnboarding() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/connect/onboard", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error || "Could not start payout setup");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function refreshStatus() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/connect/status");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not check payout status");
        return;
      }
      setStatus(data.onboarded ? "complete" : "pending");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <div className="flex items-start gap-4">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg ${
            status === "complete"
              ? "bg-green-100 text-green-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {status === "complete" ? "✓" : "!"}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900">
            {status === "complete"
              ? "Payouts enabled"
              : "Bank details required"}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {status === "complete"
              ? "Your connected account can receive fundraiser profits. Supporters can pay on live campaigns."
              : hasAccount
                ? "Finish Stripe onboarding to accept payments on your live fundraisers."
                : "Set up a secure Stripe Express account to receive payouts."}
          </p>

          {(returned || searchParams.get("refresh") === "1") && status !== "complete" && (
            <p className="mt-3 text-sm text-amber-700">
              Returned from Stripe — click refresh to update your status, or continue
              setup if you didn&apos;t finish.
            </p>
          )}

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <div className="mt-4 flex flex-wrap gap-3">
            {status !== "complete" && (
              <Button onClick={startOnboarding} disabled={loading}>
                {loading
                  ? "Loading…"
                  : hasAccount
                    ? "Continue payout setup"
                    : "Set up payouts"}
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={refreshStatus}
              disabled={loading}
            >
              Refresh status
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function PayoutSettings(props: Props) {
  return (
    <Suspense>
      <PayoutSettingsInner {...props} />
    </Suspense>
  );
}
