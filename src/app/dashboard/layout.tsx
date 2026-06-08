import { Header } from "@/components/Header";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brand">Beadoughs</h1>
            <p className="text-sm text-gray-500">
              Revenue · Profit · Top sellers · Orders to fulfil
            </p>
          </div>
          <Link
            href="/dashboard/campaigns/new"
            className="inline-flex items-center justify-center rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            + New fundraiser
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
