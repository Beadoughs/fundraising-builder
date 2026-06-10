"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <h2 className="text-xl font-semibold text-gray-900">
        Dashboard unavailable
      </h2>
      <p className="mt-2 text-sm text-gray-500">
        We hit a problem loading your dashboard. This is usually temporary —
        try reloading in a moment.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
      >
        Reload dashboard
      </button>
    </div>
  );
}
