import {
  createConnectOnboardingLink,
  getConnectClientError,
  getOrCreateConnectAccount,
  isConnectConfigured,
} from "@/lib/connect";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/session";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const authResult = await requireApiUser();
  if (authResult.response) return authResult.response;

  if (!isConnectConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured. Add STRIPE_SECRET_KEY to .env" },
      { status: 503 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: authResult.user.id },
    select: { email: true },
  });
  const email = user?.email?.trim();
  if (!email) {
    return NextResponse.json({ error: "User email is required" }, { status: 400 });
  }

  try {
    const accountId = await getOrCreateConnectAccount(authResult.user.id, email);
    const origin = new URL(request.url).origin;
    const url = await createConnectOnboardingLink(accountId, origin);

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Connect onboard error:", error);
    return NextResponse.json(
      { error: getConnectClientError(error, "Failed to start payout setup") },
      { status: 500 }
    );
  }
}
