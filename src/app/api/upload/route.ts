import { NextResponse } from "next/server";

/** Legacy upload route — images are stored inline in the database now. */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "File uploads are handled in the browser. Use the Add image button on the campaign form.",
    },
    { status: 410 }
  );
}
