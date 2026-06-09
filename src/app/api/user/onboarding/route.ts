import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/session";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  orgName: z.string().min(1, "Organisation name is required"),
});

export async function POST(request: Request) {
  const authResult = await requireApiUser();
  if (authResult.response) return authResult.response;

  try {
    const body = await request.json();
    const data = schema.parse(body);

    await prisma.user.update({
      where: { id: authResult.user.id },
      data: {
        name: data.name,
        orgName: data.orgName,
        onboardingComplete: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Invalid data" },
        { status: 400 }
      );
    }
    console.error("Onboarding error:", error);
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }
}
