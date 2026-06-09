"use client";

import { Button } from "@/components/ui/Button";
import { FieldGroup, Label } from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import { useSession } from "next-auth/react";
import { FormEvent, useState } from "react";

export default function OnboardingPage() {
  const { update } = useSession();
  const [name, setName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/user/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), orgName: orgName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save your profile");
        return;
      }
      await update({ user: { onboardingComplete: true, name: name.trim() } });
      window.location.href = "/dashboard/payouts";
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <h2 className="text-2xl font-bold text-gray-900">Welcome to Beadoughs</h2>
      <p className="mt-2 text-sm text-gray-500">
        Tell us a bit about you so we can set up your fundraiser dashboard.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <FieldGroup>
          <Label htmlFor="name">Your name</Label>
          <Input
            id="name"
            required
            placeholder="Alex Morgan"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </FieldGroup>

        <FieldGroup>
          <Label htmlFor="orgName">Organisation or group name</Label>
          <Input
            id="orgName"
            required
            placeholder="Westside Primary P&C"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
          />
          <p className="mt-1 text-xs text-gray-400">
            Used as the default on new fundraisers — you can change it per campaign.
          </p>
        </FieldGroup>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? "Saving…" : "Continue to payout setup"}
        </Button>
      </form>
    </div>
  );
}
