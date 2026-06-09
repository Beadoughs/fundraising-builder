import { getOwnedCampaign } from "@/lib/campaigns";
import { ensureDatabaseReady } from "@/lib/db-init";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/session";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  team: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
});

type RouteContext = {
  params: Promise<{ id: string; participantId: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const authResult = await requireApiUser();
  if (authResult.response) return authResult.response;

  ensureDatabaseReady();
  const { id, participantId } = await context.params;

  if (!(await getOwnedCampaign(id, authResult.user.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const participant = await prisma.participant.findFirst({
    where: { id: participantId, campaignId: id },
  });
  if (!participant) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.participant.delete({ where: { id: participantId } });
  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request, context: RouteContext) {
  const authResult = await requireApiUser();
  if (authResult.response) return authResult.response;

  try {
    ensureDatabaseReady();
    const { id, participantId } = await context.params;

    if (!(await getOwnedCampaign(id, authResult.user.id))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const participant = await prisma.participant.findFirst({
      where: { id: participantId, campaignId: id },
    });
    if (!participant) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const data = updateSchema.parse(body);

    const updated = await prisma.participant.update({
      where: { id: participantId },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.team !== undefined && { team: data.team?.trim() || null }),
        ...(data.email !== undefined && { email: data.email?.trim() || null }),
      },
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
      { error: "Failed to update participant" },
      { status: 500 }
    );
  }
}
