"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = (id: string) => [
  { href: `/dashboard/campaigns/${id}`, label: "Overview" },
  { href: `/dashboard/campaigns/${id}/edit`, label: "Edit" },
  { href: `/dashboard/campaigns/${id}/participants`, label: "Participants" },
  { href: `/dashboard/campaigns/${id}/fulfillment`, label: "Fulfilment" },
  { href: `/dashboard/campaigns/${id}/reports`, label: "Reports" },
  { href: `/dashboard/campaigns/${id}/preview`, label: "Share" },
];

export function CampaignNav({
  campaignId,
  campaignName,
}: {
  campaignId: string;
  campaignName: string;
}) {
  const pathname = usePathname();
  const items = tabs(campaignId);

  return (
    <div className="mb-8">
      <Link
        href="/dashboard"
        className="text-sm text-gray-500 hover:text-brand"
      >
        ← All fundraisers
      </Link>
      <h2 className="mt-2 text-2xl font-bold text-gray-900">{campaignName}</h2>
      <nav className="mt-4 flex gap-1 overflow-x-auto border-b border-gray-100 pb-px">
        {items.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`whitespace-nowrap rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "border-b-2 border-brand bg-brand/5 text-brand"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
