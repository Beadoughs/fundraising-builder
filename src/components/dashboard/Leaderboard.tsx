"use client";

import { formatCurrency } from "@/lib/utils";

export type LeaderboardEntry = {
  id: string;
  name: string;
  team?: string | null;
  revenue: number;
  profit: number;
  orderCount: number;
};

export function Leaderboard({
  entries,
  title = "Top sellers",
  showProfit = true,
}: {
  entries: LeaderboardEntry[];
  title?: string;
  showProfit?: boolean;
}) {
  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-6 text-center text-sm text-gray-500">
        No sales yet — add participants and share their links to start the
        leaderboard.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-4">
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      <ol className="divide-y divide-gray-50">
        {entries.slice(0, 10).map((entry, index) => (
          <li
            key={entry.id}
            className="flex items-center gap-4 px-5 py-3.5"
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                index === 0
                  ? "bg-amber-100 text-amber-700"
                  : index === 1
                    ? "bg-gray-200 text-gray-700"
                    : index === 2
                      ? "bg-orange-100 text-orange-700"
                      : "bg-gray-50 text-gray-500"
              }`}
            >
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-gray-900">{entry.name}</p>
              {entry.team && (
                <p className="truncate text-xs text-gray-400">{entry.team}</p>
              )}
            </div>
            <div className="text-right text-sm">
              {showProfit ? (
                <>
                  <p className="font-semibold text-emerald-600">
                    {formatCurrency(entry.profit)} profit
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatCurrency(entry.revenue)} · {entry.orderCount} orders
                  </p>
                </>
              ) : (
                <p className="font-semibold text-brand">
                  {formatCurrency(entry.revenue)}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
