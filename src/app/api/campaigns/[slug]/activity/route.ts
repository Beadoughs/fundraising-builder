import { getCampaignActivity } from "@/lib/campaign-activity";
import { ensureDatabaseReady } from "@/lib/db-init";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    await ensureDatabaseReady();
    const { slug } = await context.params;

    const campaign = await prisma.campaign.findFirst({
      where: { slug, published: true, archived: false },
      select: { id: true },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const activities = await getCampaignActivity(campaign.id);

    return NextResponse.json(
      { activities },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Campaign activity error:", error);
    return NextResponse.json(
      { error: "Failed to load activity" },
      { status: 500 }
    );
  }
}
