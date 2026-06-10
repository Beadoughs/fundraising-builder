import { getClientErrorMessage } from "@/lib/api-errors";
import { prisma } from "@/lib/db";
import { ensureSchema } from "@/lib/ensure-schema";
import { hashPassword } from "@/lib/password";
import {
  normalizeRegistrationEmail,
  registerSchema,
} from "@/lib/register";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    try {
      await ensureSchema();
    } catch (schemaError) {
      console.error(
        "[register] ensureSchema failed before account creation. " +
          "Set DIRECT_URL in Vercel to your Neon direct (non-pooler) connection string, then redeploy.",
        schemaError
      );
      throw schemaError;
    }

    const body = await request.json();
    const data = registerSchema.parse(body);
    const email = normalizeRegistrationEmail(data.email);
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

    const { message, status } = getClientErrorMessage(
      error,
      "Failed to create account"
    );
    return NextResponse.json({ error: message }, { status });
  }
}
