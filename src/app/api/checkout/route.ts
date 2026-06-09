import { prisma } from "@/lib/db";
import { sumCost } from "@/lib/profit";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { getAppBaseUrl } from "@/lib/url";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { z } from "zod";

const checkoutSchema = z.object({
  campaignSlug: z.string(),
  participantSlug: z.string().optional(),
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
});

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured. Add keys to .env" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const data = checkoutSchema.parse(body);

    const campaign = await prisma.campaign.findFirst({
      where: { slug: data.campaignSlug, published: true },
      include: {
        products: true,
        user: {
          select: {
            stripeConnectAccountId: true,
            stripeConnectOnboarded: true,
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    if (
      !campaign.user.stripeConnectOnboarded ||
      !campaign.user.stripeConnectAccountId
    ) {
      return NextResponse.json(
        {
          error:
            "This fundraiser is not accepting payments yet. The organiser needs to complete payout setup.",
        },
        { status: 503 }
      );
    }

    let participantId: string | undefined;
    if (data.participantSlug) {
      const participant = await prisma.participant.findFirst({
        where: { campaignId: campaign.id, slug: data.participantSlug },
      });
      if (participant) participantId = participant.id;
    }

    const lineItems: {
      productId: string;
      name: string;
      price: number;
      cost: number;
      quantity: number;
    }[] = [];
    let total = 0;

    for (const item of data.items) {
      const product = campaign.products.find((p) => p.id === item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${item.productId}` },
          { status: 400 }
        );
      }

      if (product.quantityLimit) {
        const sold = await prisma.orderItem.aggregate({
          where: {
            productId: product.id,
            order: { status: "paid" },
          },
          _sum: { quantity: true },
        });
        const soldCount = sold._sum.quantity || 0;
        if (soldCount + item.quantity > product.quantityLimit) {
          return NextResponse.json(
            { error: `Not enough stock for ${product.name}` },
            { status: 400 }
          );
        }
      }

      lineItems.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        cost: product.cost,
        quantity: item.quantity,
      });
      total += product.price * item.quantity;
    }

    const order = await prisma.order.create({
      data: {
        campaignId: campaign.id,
        participantId,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        total,
        status: "pending",
        items: {
          create: lineItems.map((item) => ({
            productId: item.productId,
            name: item.name,
            price: item.price,
            cost: item.cost,
            quantity: item.quantity,
          })),
        },
      },
    });

    const origin = getAppBaseUrl(new URL(request.url).origin);
    const totalCost = sumCost(lineItems);
    const profit = total - totalCost;

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      customer_email: data.customerEmail,
      line_items: lineItems.map((item) => ({
        price_data: {
          currency: "aud",
          product_data: { name: item.name },
          unit_amount: item.price,
        },
        quantity: item.quantity,
      })),
      metadata: {
        orderId: order.id,
        campaignId: campaign.id,
      },
      success_url: `${origin}/c/${campaign.slug}/success?order=${order.id}`,
      cancel_url: `${origin}/c/${campaign.slug}?cancelled=1`,
    };

    if (profit > 0) {
      sessionParams.payment_intent_data = {
        transfer_data: {
          destination: campaign.user.stripeConnectAccountId,
        },
        application_fee_amount: totalCost,
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
    });

    return NextResponse.json({ url: session.url, orderId: order.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Invalid data" },
        { status: 400 }
      );
    }
    console.error(error);
    return NextResponse.json(
      { error: "Checkout failed" },
      { status: 500 }
    );
  }
}
