import { getOwnedCampaign } from "@/lib/campaigns";
import { ensureDatabaseReady } from "@/lib/db-init";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/session";
import { slugify } from "@/lib/utils";
import { NextResponse } from "next/server";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1, "Name is required"),
  team: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
});

type RouteContext = { params: Promise<{ id: string }> };

async function uniqueParticipantSlug(
  campaignId: string,
  base: string
): Promise<string> {
  let slug = slugify(base) || "seller";
  let attempt = 0;
  while (
    await prisma.participant.findFirst({
      where: { campaignId, slug },
    })
  ) {
    attempt += 1;
    slug = `${slugify(base)}-${attempt}`;
  }
  return slug;
}

export async function GET(_request: Request, context: RouteContext) {
  const authResult = await requireApiUser();
  if (authResult.response) return authResult.response;

  ensureDatabaseReady();
  const { id } = await context.params;

  if (!(await getOwnedCampaign(id, authResult.user.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const participants = await prisma.participant.findMany({
    where: { campaignId: id },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(participants);
}

export async function POST(request: Request, context: RouteContext) {
  const authResult = await requireApiUser();
  if (authResult.response) return authResult.response;

  try {
    ensureDatabaseReady();
    const { id } = await context.params;

    if (!(await getOwnedCampaign(id, authResult.user.id))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const data = createSchema.parse(body);
    const slug = await uniqueParticipantSlug(id, data.name);

    const participant = await prisma.participant.create({
      data: {
        campaignId: id,
        name: data.name.trim(),
        slug,
        team: data.team?.trim() || null,
        email: data.email?.trim() || null,
      },
    });

    return NextResponse.json(participant, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Invalid data" },
        { status: 400 }
      );
    }
    console.error("Create participant error:", error);
    return NextResponse.json(
      { error: "Failed to add participant" },
      { status: 500 }
    );
  }
}
