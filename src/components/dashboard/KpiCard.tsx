import { cn } from "@/lib/utils";

type KpiCardProps = {
  label: string;
  value: string;
  sub?: string;
  accent?: "brand" | "green" | "blue" | "purple" | "gray";
  className?: string;
};

const accents = {
  brand: "text-brand",
  green: "text-emerald-600",
  blue: "text-blue-600",
  purple: "text-purple-600",
  gray: "text-gray-900",
};

export function KpiCard({
  label,
  value,
  sub,
  accent = "gray",
  className,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-gray-100 bg-white p-5 shadow-sm",
        className
      )}
    >
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className={cn("mt-1 text-3xl font-bold tracking-tight", accents[accent])}>
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}
