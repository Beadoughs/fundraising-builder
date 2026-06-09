import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";

export async function getSessionUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user;
}

export async function requirePageUser() {
  const user = await getSessionUser();
  if (!user) redirect("/login?callbackUrl=/dashboard");
  return user;
}

export async function requireApiUser() {
  const user = await getSessionUser();
  if (!user) {
    return {
      user: null as never,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { user, response: null };
}
