import { prisma } from "@/lib/db";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { getAppBaseUrl } from "@/lib/url";
import type Stripe from "stripe";

export function isConnectConfigured(): boolean {
  return isStripeConfigured();
}

export async function getOrCreateConnectAccount(
  userId: string,
  email: string
): Promise<string> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.stripeConnectAccountId) {
    return user.stripeConnectAccountId;
  }

  const account = await stripe.accounts.create({
    email,
    controller: {
      stripe_dashboard: { type: "express" },
      fees: { payer: "application" },
      losses: { payments: "application" },
    },
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { stripeConnectAccountId: account.id },
  });

  return account.id;
}

export async function createConnectOnboardingLink(
  accountId: string,
  origin?: string
): Promise<string> {
  const base = getAppBaseUrl(origin);
  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${base}/dashboard/payouts?refresh=1`,
    return_url: `${base}/dashboard/payouts?return=1`,
    type: "account_onboarding",
  });
  return link.url;
}

export async function syncConnectOnboardingStatus(
  accountId: string
): Promise<boolean> {
  const account = await stripe.accounts.retrieve(accountId);
  const onboarded = isConnectAccountReady(account);
  await prisma.user.updateMany({
    where: { stripeConnectAccountId: accountId },
    data: { stripeConnectOnboarded: onboarded },
  });
  return onboarded;
}

export function isConnectAccountReady(account: Stripe.Account): boolean {
  return Boolean(account.charges_enabled && account.payouts_enabled);
}
