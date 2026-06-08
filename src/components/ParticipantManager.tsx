"use client";

import { Button } from "@/components/ui/Button";
import { FieldGroup, Label } from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import { formatCurrency } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ParticipantRow = {
  id: string;
  name: string;
  slug: string;
  team: string | null;
  email: string | null;
  revenue: number;
  profit: number;
  orderCount: number;
};

export function ParticipantManager({
  campaignId,
  campaignSlug,
  initialParticipants,
}: {
  campaignId: string;
  campaignSlug: string;
  initialParticipants: ParticipantRow[];
}) {
  const router = useRouter();
  const [participants, setParticipants] = useState(initialParticipants);
  const [name, setName] = useState("");
  const [team, setTeam] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const origin =
    typeof window !== "undefined" ? window.location.origin : "";

  async function addParticipant(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/campaigns/${campaignId}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          team: team.trim() || null,
          email: email.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add");

      setParticipants((prev) => [
        ...prev,
        {
          id: data.id,
          name: data.name,
          slug: data.slug,
          team: data.team,
          email: data.email,
          revenue: 0,
          profit: 0,
          orderCount: 0,
        },
      ]);
      setName("");
      setTeam("");
      setEmail("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function removeParticipant(id: string) {
    if (!confirm("Remove this participant? Their sales history will remain."))
      return;

    const res = await fetch(
      `/api/campaigns/${campaignId}/participants/${id}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      setParticipants((prev) => prev.filter((p) => p.id !== id));
      router.refresh();
    }
  }

  function copyLink(slug: string) {
    const url = `${origin}/c/${campaignSlug}/p/${slug}`;
    navigator.clipboard.writeText(url);
    setCopied(slug);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={addParticipant}
        className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm"
      >
        <h3 className="mb-1 font-semibold text-gray-900">Add participant</h3>
        <p className="mb-4 text-sm text-gray-500">
          Each participant gets a personal fundraising link to share.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <FieldGroup className="mb-0">
            <Label>Name</Label>
            <Input
              placeholder="e.g. Emma Wilson"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </FieldGroup>
          <FieldGroup className="mb-0">
            <Label>Team / class (optional)</Label>
            <Input
              placeholder="e.g. Year 6A"
              value={team}
              onChange={(e) => setTeam(e.target.value)}
            />
          </FieldGroup>
          <FieldGroup className="mb-0">
            <Label>Email (optional)</Label>
            <Input
              type="email"
              placeholder="emma@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FieldGroup>
        </div>
        {error && (
          <p className="mt-3 text-sm text-red-600">{error}</p>
        )}
        <Button type="submit" className="mt-4" disabled={loading}>
          {loading ? "Adding…" : "+ Add participant"}
        </Button>
      </form>

      {participants.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 py-12 text-center text-sm text-gray-500">
          No participants yet. Add students, players, or club members to track
          individual sales.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Participant</th>
                <th className="px-4 py-3 font-medium">Profit</th>
                <th className="px-4 py-3 font-medium">Revenue</th>
                <th className="px-4 py-3 font-medium">Orders</th>
                <th className="px-4 py-3 font-medium">Share link</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {participants.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{p.name}</p>
                    {p.team && (
                      <p className="text-xs text-gray-400">{p.team}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold text-emerald-600">
                    {formatCurrency(p.profit)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatCurrency(p.revenue)}
                  </td>
                  <td className="px-4 py-3">{p.orderCount}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => copyLink(p.slug)}
                      className="text-xs font-medium text-brand hover:underline"
                    >
                      {copied === p.slug ? "Copied!" : "Copy link"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => removeParticipant(p.id)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
