import { formatCurrency } from "@/lib/utils";

export type LiveLeaderboardEntry = {
  id: string;
  name: string;
  team?: string | null;
  revenue: number;
};

const MEDALS = ["🥇", "🥈", "🥉"];

export function LiveLeaderboard({
  entries,
  title = "Live leaderboard",
}: {
  entries: LiveLeaderboardEntry[];
  title?: string;
}) {
  const ranked = entries.filter((entry) => entry.revenue > 0);

  if (ranked.length === 0) {
    return (
      <div className="rounded-xl border border-brand/10 bg-white p-6 text-center text-sm text-gray-500 shadow-sm">
        No sales yet — be the first to support this fundraiser!
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-brand/10 bg-white shadow-sm">
      <div className="border-b border-brand/10 bg-brand/5 px-5 py-4">
        <h3 className="font-semibold text-brand">{title}</h3>
        <p className="mt-0.5 text-xs text-gray-500">Updated as orders come in</p>
      </div>
      <ol className="divide-y divide-gray-50">
        {ranked.slice(0, 10).map((entry, index) => (
          <li
            key={entry.id}
            className="flex items-center gap-3 px-4 py-3.5 sm:gap-4 sm:px-5"
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center text-lg ${
                index < 3 ? "" : "rounded-full bg-gray-50 text-sm font-bold text-gray-500"
              }`}
              aria-label={`Rank ${index + 1}`}
            >
              {index < 3 ? MEDALS[index] : index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-gray-900">{entry.name}</p>
              {entry.team && (
                <p className="truncate text-xs text-gray-400">{entry.team}</p>
              )}
            </div>
            <p className="shrink-0 text-sm font-semibold text-brand">
              {formatCurrency(entry.revenue)}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
