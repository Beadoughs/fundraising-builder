import {
  getConnectClientError,
  isConnectAccountReady,
  isConnectConfigured,
  syncConnectOnboardingStatus,
} from "@/lib/connect";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { requireApiUser } from "@/lib/session";
import { NextResponse } from "next/server";

export async function GET() {
  const authResult = await requireApiUser();
  if (authResult.response) return authResult.response;

  if (!isConnectConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 503 }
    );
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: authResult.user.id },
    select: { stripeConnectAccountId: true, stripeConnectOnboarded: true },
  });

  if (!user.stripeConnectAccountId) {
    return NextResponse.json({
      hasAccount: false,
      onboarded: false,
    });
  }

  try {
    const account = await stripe.accounts.retrieve(user.stripeConnectAccountId);
    const onboarded = isConnectAccountReady(account);
    if (onboarded !== user.stripeConnectOnboarded) {
      await syncConnectOnboardingStatus(user.stripeConnectAccountId);
    }

    return NextResponse.json({
      hasAccount: true,
      onboarded,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
    });
  } catch (error) {
    console.error("Connect status error:", error);
    return NextResponse.json(
      { error: getConnectClientError(error, "Failed to check payout status") },
      { status: 500 }
    );
  }
}
