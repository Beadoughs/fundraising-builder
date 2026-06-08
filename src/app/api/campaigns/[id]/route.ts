import { ensureDatabaseReady } from "@/lib/db-init";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  price: z.number().int().positive(),
  cost: z.number().int().min(0).default(0),
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
  templateId: z.string().optional().nullable(),
  leaderboardEnabled: z.boolean().optional(),
  published: z.boolean().optional(),
  archived: z.boolean().optional(),
  products: z.array(productSchema).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

async function getCampaign(id: string) {
  ensureDatabaseReady();
  return prisma.campaign.findUnique({ where: { id } });
}

export async function GET(_request: Request, context: RouteContext) {
  ensureDatabaseReady();

  const { id } = await context.params;
  const owned = await getCampaign(id);
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
  try {
    ensureDatabaseReady();

    const { id } = await context.params;
    const existing = await getCampaign(id);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const data = updateSchema.parse(body);

    if (data.products) {
      await prisma.product.deleteMany({ where: { campaignId: id } });
      await prisma.product.createMany({
        data: data.products.map((p, i) => ({
          campaignId: id,
          name: p.name,
          price: p.price,
          cost: p.cost ?? 0,
          imageUrl: p.imageUrl,
          quantityLimit: p.quantityLimit,
          sortOrder: p.sortOrder ?? i,
        })),
      });
    }

    const updateData: {
      name?: string;
      orgName?: string;
      description?: string | null;
      logoUrl?: string | null;
      goalAmount?: number | null;
      templateId?: string | null;
      leaderboardEnabled?: boolean;
      published?: boolean;
      archived?: boolean;
    } = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.orgName !== undefined) updateData.orgName = data.orgName;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl;
    if (data.goalAmount !== undefined) updateData.goalAmount = data.goalAmount;
    if (data.templateId !== undefined) updateData.templateId = data.templateId;
    if (data.leaderboardEnabled !== undefined)
      updateData.leaderboardEnabled = data.leaderboardEnabled;
    if (data.published !== undefined) updateData.published = data.published;
    if (data.archived !== undefined) updateData.archived = data.archived;

    if (data.archived === true) {
      updateData.published = false;
    }

    const campaign = await prisma.campaign.update({
      where: { id },
      data: updateData,
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
    console.error("Update campaign error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update campaign";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  ensureDatabaseReady();

  const { id } = await context.params;
  const existing = await getCampaign(id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.campaign.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
