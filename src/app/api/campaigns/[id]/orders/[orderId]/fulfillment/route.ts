import { getOwnedCampaign } from "@/lib/campaigns";
import { ensureDatabaseReady } from "@/lib/db-init";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/session";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateSchema = z.object({
  fulfillmentStatus: z.enum(["pending", "ready", "collected", "delivered"]),
});

type RouteContext = {
  params: Promise<{ id: string; orderId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const authResult = await requireApiUser();
  if (authResult.response) return authResult.response;

  try {
    await ensureDatabaseReady();
    const { id, orderId } = await context.params;

    if (!(await getOwnedCampaign(id, authResult.user.id))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId, campaignId: id, status: "paid" },
    });
    if (!order) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const data = updateSchema.parse(body);

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { fulfillmentStatus: data.fulfillmentStatus },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Invalid data" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update fulfilment status" },
      { status: 500 }
    );
  }
}
