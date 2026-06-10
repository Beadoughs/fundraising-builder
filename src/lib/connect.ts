import { prisma } from "@/lib/db";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { getAppBaseUrl } from "@/lib/url";
import Stripe from "stripe";
import type { Stripe as StripeTypes } from "stripe";

const isDev = process.env.NODE_ENV === "development";
const isConnectDebug = process.env.CONNECT_DEBUG === "1";

export function isConnectConfigured(): boolean {
  return isStripeConfigured();
}

function isMissingConnectAccount(error: unknown): boolean {
  return (
    error instanceof Stripe.errors.StripeInvalidRequestError &&
    (error.code === "resource_missing" ||
      error.message.toLowerCase().includes("no such account"))
  );
}

export function getConnectClientError(error: unknown, fallback: string): string {
  if (error instanceof Stripe.errors.StripeInvalidRequestError) {
    const message = error.message.toLowerCase();

    if (
      message.includes("signed up for connect") ||
      message.includes("platform_registration")
    ) {
      return "Stripe Connect is not enabled on your platform account. In the Stripe Dashboard go to Connect → Get started, complete your platform profile, then try again.";
    }

    if (isMissingConnectAccount(error)) {
      return "Your saved payout account is no longer valid (often a test vs live key mismatch). Try setup again.";
    }

    if (isDev || isConnectDebug) {
      return `${error.code ?? "stripe_error"}: ${error.message}`;
    }
  }

  if (isDev || isConnectDebug) {
    if (error instanceof Error) return error.message;
    return String(error);
  }

  return fallback;
}

async function clearConnectAccount(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { stripeConnectAccountId: null, stripeConnectOnboarded: false },
  });
}

async function createConnectAccount(email: string): Promise<string> {
  const country = process.env.STRIPE_CONNECT_DEFAULT_COUNTRY || "AU";

  const account = await stripe.accounts.create({
    email,
    country,
    controller: {
      stripe_dashboard: { type: "express" },
      fees: { payer: "application" },
      losses: { payments: "application" },
      requirement_collection: "stripe",
    },
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });

  return account.id;
}

export async function getOrCreateConnectAccount(
  userId: string,
  email: string
): Promise<string> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  if (user.stripeConnectAccountId) {
    try {
      await stripe.accounts.retrieve(user.stripeConnectAccountId);
      return user.stripeConnectAccountId;
    } catch (error) {
      if (!isMissingConnectAccount(error)) {
        throw error;
      }
      console.warn(
        `[connect] Clearing invalid account ${user.stripeConnectAccountId} for user ${userId}`
      );
      await clearConnectAccount(userId);
    }
  }

  const accountId = await createConnectAccount(email);

  await prisma.user.update({
    where: { id: userId },
    data: { stripeConnectAccountId: accountId },
  });

  return accountId;
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

export function isConnectAccountReady(account: StripeTypes.Account): boolean {
  return Boolean(account.charges_enabled && account.payouts_enabled);
}
