import { prisma } from "@/lib/db";
import { sendOrderReceipt } from "@/lib/email";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

const CHECKOUT_EVENTS = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
]);

async function markOrderPaid(session: Stripe.Checkout.Session): Promise<void> {
  if (session.payment_status !== "paid") {
    console.warn(
      `[stripe webhook] Session ${session.id} ignored: payment_status=${session.payment_status}`
    );
    return;
  }

  const orderId = session.metadata?.orderId;
  const order = orderId
    ? await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true, campaign: true },
      })
    : null;

  const orderBySession =
    order ??
    (await prisma.order.findUnique({
      where: { stripeSessionId: session.id },
      include: { items: true, campaign: true },
    }));

  if (!orderBySession) {
    console.error(
      `[stripe webhook] No order for session ${session.id} (metadata.orderId=${orderId ?? "missing"})`
    );
    return;
  }

  if (orderBySession.status === "paid") {
    return;
  }

  await prisma.order.update({
    where: { id: orderBySession.id },
    data: {
      status: "paid",
      stripeSessionId: session.id,
      stripePaymentId:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id,
    },
  });

  try {
    await sendOrderReceipt({
      to: orderBySession.customerEmail,
      customerName: orderBySession.customerName,
      campaignName: orderBySession.campaign.name,
      orgName: orderBySession.campaign.orgName,
      orderId: orderBySession.id,
      total: orderBySession.total,
      items: orderBySession.items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        price: i.price,
      })),
    });
  } catch (error) {
    console.error(
      `[stripe webhook] Receipt email failed for order ${orderBySession.id}:`,
      error
    );
  }
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("[stripe webhook] STRIPE_SECRET_KEY is not set");
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error(
      "[stripe webhook] Missing stripe-signature header or STRIPE_WEBHOOK_SECRET"
    );
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error("[stripe webhook] Signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (CHECKOUT_EVENTS.has(event.type)) {
    try {
      await markOrderPaid(event.data.object as Stripe.Checkout.Session);
    } catch (error) {
      console.error(`[stripe webhook] Failed to process ${event.type}:`, error);
      return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
