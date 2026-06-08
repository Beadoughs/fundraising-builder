import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().min(1),
  price: z.number().int().positive(),
  imageUrl: z.string().optional().nullable(),
  quantityLimit: z.number().int().positive().optional().nullable(),
  sortOrder: z.number().int().default(0),
});

const campaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  orgName: z.string().min(1, "Organisation name is required"),
  description: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  goalAmount: z.number().int().positive().optional().nullable(),
  published: z.boolean().optional(),
  products: z.array(productSchema).optional(),
});

async function uniqueSlug(base: string): Promise<string> {
  let slug = slugify(base) || `campaign-${nanoid(6)}`;
  let attempt = 0;
  while (await prisma.campaign.findUnique({ where: { slug } })) {
    attempt += 1;
    slug = `${slugify(base)}-${attempt}`;
  }
  return slug;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const campaigns = await prisma.campaign.findMany({
    where: { userId: session.user.id },
    include: {
      products: { orderBy: { sortOrder: "asc" } },
      orders: { where: { status: "paid" }, select: { total: true } },
      _count: { select: { orders: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const result = campaigns.map((c) => ({
    ...c,
    totalRaised: c.orders.reduce((sum, o) => sum + o.total, 0),
    orderCount: c._count.orders,
    orders: undefined,
    _count: undefined,
  }));

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = campaignSchema.parse(body);
    const slug = await uniqueSlug(data.name);

    const campaign = await prisma.campaign.create({
      data: {
        name: data.name,
        orgName: data.orgName,
        description: data.description,
        logoUrl: data.logoUrl,
        goalAmount: data.goalAmount,
        published: data.published ?? false,
        slug,
        userId: session.user.id,
        products: data.products?.length
          ? {
              create: data.products.map((p, i) => ({
                name: p.name,
                price: p.price,
                imageUrl: p.imageUrl,
                quantityLimit: p.quantityLimit,
                sortOrder: p.sortOrder ?? i,
              })),
            }
          : undefined,
      },
      include: { products: { orderBy: { sortOrder: "asc" } } },
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Invalid data" },
        { status: 400 }
      );
    }
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create campaign" },
      { status: 500 }
    );
  }
}
