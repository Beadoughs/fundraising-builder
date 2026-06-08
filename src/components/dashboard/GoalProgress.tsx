import { formatCurrency } from "@/lib/utils";

type GoalProgressProps = {
  raised: number;
  goal: number | null;
  progress: number | null;
  showAmounts?: boolean;
  size?: "sm" | "md" | "lg";
};

export function GoalProgress({
  raised,
  goal,
  progress,
  showAmounts = true,
  size = "md",
}: GoalProgressProps) {
  if (!goal) {
    return (
      <p className="text-sm text-gray-500">
        {formatCurrency(raised)} raised — no goal set
      </p>
    );
  }

  const pct = progress ?? 0;
  const barHeight = size === "lg" ? "h-4" : size === "sm" ? "h-2" : "h-3";

  return (
    <div>
      {showAmounts && (
        <div className="mb-2 flex justify-between text-sm">
          <span className="font-semibold text-brand">
            {formatCurrency(raised)} raised
          </span>
          <span className="text-gray-500">
            Goal {formatCurrency(goal)} · {pct}%
          </span>
        </div>
      )}
      <div className={`overflow-hidden rounded-full bg-gray-100 ${barHeight}`}>
        <div
          className={`h-full rounded-full bg-brand transition-all ${barHeight}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
