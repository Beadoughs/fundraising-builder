"use client";

import type { ActivityItem } from "@/lib/campaign-activity";
import { useEffect, useState } from "react";

const POLL_INTERVAL_MS = 8000;

export function ActivityFeed({
  slug,
  initialActivities,
}: {
  slug: string;
  initialActivities: ActivityItem[];
}) {
  const [activities, setActivities] = useState(initialActivities);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        setLoading(true);
        const res = await fetch(`/api/campaigns/${slug}/activity`);
        if (!res.ok) return;
        const data = (await res.json()) as { activities: ActivityItem[] };
        if (!cancelled) setActivities(data.activities);
      } catch {
        // Ignore transient network errors during polling.
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    const id = window.setInterval(refresh, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [slug]);

  if (activities.length === 0) {
    return (
      <div className="rounded-xl border border-brand/10 bg-white px-4 py-5 text-center text-sm text-gray-500 shadow-sm">
        Be the first to place an order and kick off the activity feed!
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-brand/10 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-brand/10 bg-brand/5 px-4 py-3 sm:px-5">
        <h3 className="font-semibold text-brand">Live activity</h3>
        <span
          className={`inline-flex items-center gap-1.5 text-xs text-gray-500 ${loading ? "opacity-100" : "opacity-70"}`}
          aria-live="polite"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Live
        </span>
      </div>
      <ul className="max-h-64 divide-y divide-gray-50 overflow-y-auto">
        {activities.map((activity) => (
          <li
            key={activity.id}
            className="px-4 py-3 text-sm text-gray-700 sm:px-5"
          >
            <span aria-hidden="true" className="mr-1.5">
              🎉
            </span>
            {activity.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
