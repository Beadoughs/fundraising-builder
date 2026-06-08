import { getDevMagicLink, isDevMagicLinkEnabled } from "@/lib/dev-magic-link";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  if (!isDevMagicLinkEnabled()) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const email = new URL(request.url).searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }

  const url = getDevMagicLink(email);
  return NextResponse.json({ url });
}
