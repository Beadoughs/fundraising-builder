import { Header } from "@/components/Header";
import { ensureDatabaseReady } from "@/lib/db-init";
import { prisma } from "@/lib/db";
import { requirePageUser } from "@/lib/session";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requirePageUser();
  const schemaStatus = await ensureDatabaseReady();

  let payoutsReady = false;
  if (schemaStatus.ok) {
    try {
      const organiser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { stripeConnectOnboarded: true },
      });
      payoutsReady = organiser?.stripeConnectOnboarded ?? false;
    } catch (error) {
      console.error("[dashboard] Failed to load payout status:", error);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-6xl px-4 py-8">
        {!schemaStatus.ok && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
            <p className="text-sm font-medium text-red-900">
              Database setup incomplete
            </p>
            <p className="mt-1 text-sm text-red-800">
              Some dashboard data may be unavailable until migrations finish.
              Try reloading in a moment, or contact support if this persists.
            </p>
          </div>
        )}
        {!payoutsReady && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
            <p className="text-sm font-medium text-amber-900">
              Payout setup incomplete
            </p>
            <p className="mt-1 text-sm text-amber-800">
              You can publish fundraisers now. Payments go to the platform until
              you{" "}
              <Link
                href="/dashboard/payouts"
                className="font-medium underline hover:text-amber-900"
              >
                set up payouts
              </Link>
              .
            </p>
          </div>
        )}
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
