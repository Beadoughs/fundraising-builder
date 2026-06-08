"use client";

import { Button } from "@/components/ui/Button";
import { Card, FieldGroup, Label } from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { ImageUpload } from "@/components/ImageUpload";
import {
  emptyProduct,
  type CampaignDraft,
  type ProductDraft,
} from "@/lib/campaign-draft";
import { formatCurrency } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type { CampaignDraft, ProductDraft };

type CampaignBuilderProps = {
  initial?: CampaignDraft & { id?: string; published?: boolean; slug?: string };
  mode: "create" | "edit";
};

export function CampaignBuilder({ initial, mode }: CampaignBuilderProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<CampaignDraft>(
    initial || {
      name: "",
      orgName: "",
      description: "",
      logoUrl: "",
      goalAmount: "",
      leaderboardEnabled: true,
      products: [emptyProduct()],
    }
  );

  function updateField<K extends keyof CampaignDraft>(
    key: K,
    value: CampaignDraft[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateProduct(index: number, patch: Partial<ProductDraft>) {
    setForm((prev) => ({
      ...prev,
      products: prev.products.map((p, i) =>
        i === index ? { ...p, ...patch } : p
      ),
    }));
  }

  function addProduct() {
    setForm((prev) => ({
      ...prev,
      products: [...prev.products, emptyProduct()],
    }));
  }

  function removeProduct(index: number) {
    setForm((prev) => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index),
    }));
  }

  function parsePayload() {
    if (!form.name.trim()) {
      throw new Error("Campaign name is required");
    }
    if (!form.orgName.trim()) {
      throw new Error("Organisation name is required");
    }

    const products = form.products
      .filter((p) => p.name.trim() || p.price.trim())
      .map((p, i) => {
        if (!p.name.trim()) {
          throw new Error("Each product needs a name");
        }
        const priceCents = Math.round(parseFloat(p.price) * 100);
        if (!Number.isFinite(priceCents) || priceCents <= 0) {
          throw new Error(`Enter a valid price for "${p.name.trim()}"`);
        }
        const costCents = p.cost.trim()
          ? Math.round(parseFloat(p.cost) * 100)
          : 0;
        if (!Number.isFinite(costCents) || costCents < 0) {
          throw new Error(`Enter a valid cost for "${p.name.trim()}"`);
        }
        if (costCents >= priceCents) {
          throw new Error(
            `Cost must be less than price for "${p.name.trim()}"`
          );
        }
        const quantityLimit = p.quantityLimit.trim()
          ? parseInt(p.quantityLimit, 10)
          : null;
        if (
          quantityLimit !== null &&
          (!Number.isFinite(quantityLimit) || quantityLimit <= 0)
        ) {
          throw new Error(`Enter a valid stock limit for "${p.name.trim()}"`);
        }
        return {
          name: p.name.trim(),
          price: priceCents,
          cost: costCents,
          imageUrl: p.imageUrl || null,
          quantityLimit,
          sortOrder: i,
        };
      });

    if (products.length === 0) {
      throw new Error("Add at least one product with a name and price");
    }

    let goalAmount: number | null = null;
    if (form.goalAmount.trim()) {
      const goalCents = Math.round(parseFloat(form.goalAmount) * 100);
      if (!Number.isFinite(goalCents) || goalCents <= 0) {
        throw new Error("Enter a valid fundraising goal");
      }
      goalAmount = goalCents;
    }

    return {
      name: form.name.trim(),
      orgName: form.orgName.trim(),
      description: form.description.trim() || null,
      logoUrl: form.logoUrl || null,
      goalAmount,
      leaderboardEnabled: form.leaderboardEnabled,
      products,
    };
  }

  async function save() {
    setError("");
    setSaving(true);

    try {
      const payload = parsePayload();

      const url =
        mode === "edit" && initial?.id
          ? `/api/campaigns/${initial.id}`
          : "/api/campaigns";
      const method = mode === "edit" ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");

      if (mode === "create") {
        router.push(`/dashboard/campaigns/${data.id}/preview`);
      } else {
        router.push(`/dashboard/campaigns/${initial!.id}/preview`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  const estimatedProfitPerUnit = form.products.map((p) => {
    const price = parseFloat(p.price);
    const cost = parseFloat(p.cost || "0");
    if (!Number.isFinite(price) || !Number.isFinite(cost)) return null;
    return price - cost;
  });

  return (
    <div className="mx-auto max-w-2xl">
      <Card className="mb-6">
        <h2 className="mb-1 text-lg font-semibold text-gray-900">
          Fundraiser details
        </h2>
        <p className="mb-6 text-sm text-gray-500">
          Basic info supporters will see on your public page.
        </p>

        <FieldGroup>
          <Label htmlFor="name">Fundraiser name</Label>
          <Input
            id="name"
            placeholder="e.g. Year 6 Doughnut Drive"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
          />
        </FieldGroup>

        <FieldGroup>
          <Label htmlFor="orgName">Organisation name</Label>
          <Input
            id="orgName"
            placeholder="e.g. Riverside Primary School"
            value={form.orgName}
            onChange={(e) => updateField("orgName", e.target.value)}
          />
        </FieldGroup>

        <FieldGroup>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Tell supporters what you're raising for…"
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
          />
        </FieldGroup>

        <ImageUpload
          label="Logo or campaign image"
          value={form.logoUrl}
          onChange={(url) => updateField("logoUrl", url)}
        />

        <FieldGroup>
          <Label htmlFor="goal">Fundraising goal (optional)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
              $
            </span>
            <Input
              id="goal"
              type="number"
              min="0"
              step="0.01"
              className="pl-7"
              placeholder="5000"
              value={form.goalAmount}
              onChange={(e) => updateField("goalAmount", e.target.value)}
            />
          </div>
        </FieldGroup>

        <FieldGroup className="mb-0">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={form.leaderboardEnabled}
              onChange={(e) =>
                updateField("leaderboardEnabled", e.target.checked)
              }
              className="h-4 w-4 rounded border-gray-300 text-brand"
            />
            <span className="text-sm text-gray-700">
              Enable seller leaderboard (boosts competition & sales)
            </span>
          </label>
        </FieldGroup>
      </Card>

      <Card className="mb-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Products</h2>
            <p className="text-sm text-gray-500">
              Set selling price and cost — profit is calculated automatically.
            </p>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={addProduct}>
            + Add product
          </Button>
        </div>

        <div className="space-y-6">
          {form.products.map((product, index) => (
            <div
              key={index}
              className="rounded-lg border border-gray-100 bg-gray-50/50 p-4"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Product {index + 1}
                  {estimatedProfitPerUnit[index] !== null &&
                    estimatedProfitPerUnit[index]! > 0 && (
                      <span className="ml-2 text-emerald-600">
                        {formatCurrency(
                          Math.round(estimatedProfitPerUnit[index]! * 100)
                        )}{" "}
                        profit/unit
                      </span>
                    )}
                </span>
                {form.products.length > 1 && (
                  <button
                    type="button"
                    className="text-sm text-red-500 hover:text-red-700"
                    onClick={() => removeProduct(index)}
                  >
                    Remove
                  </button>
                )}
              </div>

              <FieldGroup>
                <Label>Product name</Label>
                <Input
                  placeholder="e.g. Box of 6 glazed doughnuts"
                  value={product.name}
                  onChange={(e) =>
                    updateProduct(index, { name: e.target.value })
                  }
                />
              </FieldGroup>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <FieldGroup className="mb-0">
                  <Label>Sell price ($)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="12.00"
                    value={product.price}
                    onChange={(e) =>
                      updateProduct(index, { price: e.target.value })
                    }
                  />
                </FieldGroup>
                <FieldGroup className="mb-0">
                  <Label>Your cost ($)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="6.00"
                    value={product.cost}
                    onChange={(e) =>
                      updateProduct(index, { cost: e.target.value })
                    }
                  />
                </FieldGroup>
                <FieldGroup className="mb-0">
                  <Label>Stock limit</Label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="100"
                    value={product.quantityLimit}
                    onChange={(e) =>
                      updateProduct(index, { quantityLimit: e.target.value })
                    }
                  />
                </FieldGroup>
              </div>

              <ImageUpload
                label="Product image"
                value={product.imageUrl}
                onChange={(url) => updateProduct(index, { imageUrl: url })}
              />
            </div>
          ))}
        </div>
      </Card>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          disabled={saving}
          onClick={() => save()}
          className="flex-1"
          size="lg"
        >
          {saving
            ? "Saving…"
            : mode === "create"
              ? "Launch fundraiser"
              : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
