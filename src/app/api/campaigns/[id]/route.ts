import { prisma } from "@/lib/db";
import { getDefaultOrganiserId } from "@/lib/organiser";
import { NextResponse } from "next/server";
import { z } from "zod";

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  price: z.number().int().positive(),
  imageUrl: z.string().optional().nullable(),
  quantityLimit: z.number().int().positive().optional().nullable(),
  sortOrder: z.number().int().default(0),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  orgName: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  goalAmount: z.number().int().positive().optional().nullable(),
  published: z.boolean().optional(),
  products: z.array(productSchema).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

async function getOwnedCampaign(id: string) {
  const organiserId = await getDefaultOrganiserId();
  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign || campaign.userId !== organiserId) return null;
  return campaign;
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const owned = await getOwnedCampaign(id);
  if (!owned) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      products: { orderBy: { sortOrder: "asc" } },
      orders: {
        include: { items: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const paidOrders = campaign.orders.filter((o) => o.status === "paid");
  const totalRaised = paidOrders.reduce((sum, o) => sum + o.total, 0);

  return NextResponse.json({
    ...campaign,
    totalRaised,
    paidOrderCount: paidOrders.length,
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const existing = await getOwnedCampaign(id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const data = updateSchema.parse(body);

    if (data.products) {
      await prisma.product.deleteMany({ where: { campaignId: id } });
      await prisma.product.createMany({
        data: data.products.map((p, i) => ({
          campaignId: id,
          name: p.name,
          price: p.price,
          imageUrl: p.imageUrl,
          quantityLimit: p.quantityLimit,
          sortOrder: p.sortOrder ?? i,
        })),
      });
    }

    const campaign = await prisma.campaign.update({
      where: { id },
      data: {
        name: data.name,
        orgName: data.orgName,
        description: data.description,
        logoUrl: data.logoUrl,
        goalAmount: data.goalAmount,
        published: data.published,
      },
      include: { products: { orderBy: { sortOrder: "asc" } } },
    });

    return NextResponse.json(campaign);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Invalid data" },
        { status: 400 }
      );
    }
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update campaign" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const existing = await getOwnedCampaign(id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.campaign.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
