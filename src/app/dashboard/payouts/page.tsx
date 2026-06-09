import { PayoutSettings } from "@/components/dashboard/PayoutSettings";
import { prisma } from "@/lib/db";
import { requirePageUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function PayoutsPage() {
  const sessionUser = await requirePageUser();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: sessionUser.id },
    select: {
      stripeConnectAccountId: true,
      stripeConnectOnboarded: true,
      email: true,
    },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900">Payout settings</h2>
      <p className="mt-2 text-sm text-gray-500">
        Connect your bank account so Beadoughs can pay out your fundraiser profits.
        Product costs are retained by the platform; profit is transferred to you.
      </p>
      <div className="mt-8">
        <PayoutSettings
          onboarded={user.stripeConnectOnboarded}
          hasAccount={Boolean(user.stripeConnectAccountId)}
        />
      </div>
    </div>
  );
}
