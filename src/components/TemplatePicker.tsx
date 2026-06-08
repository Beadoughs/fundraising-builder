"use client";

import { FUNDRAISER_TEMPLATES } from "@/lib/templates";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function TemplatePicker() {
  const router = useRouter();

  return (
    <div>
      <div className="mb-8">
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-brand">
          ← Back to dashboard
        </Link>
        <h2 className="mt-2 text-2xl font-bold text-gray-900">
          Start a fundraiser
        </h2>
        <p className="mt-1 text-gray-500">
          Pick a template to launch in under 5 minutes — or start from scratch.
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FUNDRAISER_TEMPLATES.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() =>
              router.push(`/dashboard/campaigns/new/build?template=${template.id}`)
            }
            className="rounded-xl border border-gray-100 bg-white p-6 text-left shadow-sm transition-shadow hover:border-brand/30 hover:shadow-md"
          >
            <span className="text-3xl">{template.emoji}</span>
            <h3 className="mt-3 font-semibold text-gray-900">{template.name}</h3>
            <p className="mt-1 text-sm text-gray-500">{template.description}</p>
            <p className="mt-3 text-xs font-medium text-brand">
              {template.products.length} products pre-configured →
            </p>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => router.push("/dashboard/campaigns/new/build")}
        className="w-full rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 px-6 py-8 text-center text-sm font-medium text-gray-600 hover:border-brand/40 hover:bg-brand/5 hover:text-brand"
      >
        Start from scratch (blank fundraiser)
      </button>
    </div>
  );
}
