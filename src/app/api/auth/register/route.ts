import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = registerSchema.parse(body);
    const email = data.email.trim().toLowerCase();
    const passwordHash = await hashPassword(data.password);

    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing?.passwordHash) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { passwordHash, name: data.name },
      });
    } else {
      await prisma.user.create({
        data: {
          email,
          passwordHash,
          name: data.name,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Invalid data" },
        { status: 400 }
      );
    }
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
