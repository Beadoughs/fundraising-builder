import { prisma } from "@/lib/db";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { NextResponse } from "next/server";
import { z } from "zod";

const checkoutSchema = z.object({
  campaignSlug: z.string(),
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

    const campaign = await prisma.campaign.findUnique({
      where: { slug: data.campaignSlug, published: true },
      include: { products: true },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const lineItems: {
      productId: string;
      name: string;
      price: number;
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
        quantity: item.quantity,
      });
      total += product.price * item.quantity;
    }

    const order = await prisma.order.create({
      data: {
        campaignId: campaign.id,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        total,
        status: "pending",
        items: {
          create: lineItems.map((item) => ({
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
        },
      },
    });

    const origin =
      process.env.AUTH_URL ||
      process.env.NEXTAUTH_URL ||
      new URL(request.url).origin;

    const session = await stripe.checkout.sessions.create({
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
    });

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
