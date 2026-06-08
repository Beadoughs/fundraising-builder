import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      orders: {
        where: { status: "paid" },
        include: { items: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!campaign || campaign.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const headers = [
    "Order ID",
    "Date",
    "Customer Name",
    "Customer Email",
    "Product",
    "Quantity",
    "Unit Price",
    "Line Total",
    "Order Total",
  ];

  const rows: string[][] = [];

  for (const order of campaign.orders) {
    for (let i = 0; i < order.items.length; i++) {
      const item = order.items[i];
      rows.push([
        order.id,
        order.createdAt.toISOString(),
        order.customerName,
        order.customerEmail,
        item.name,
        String(item.quantity),
        formatCurrency(item.price),
        formatCurrency(item.price * item.quantity),
        i === 0 ? formatCurrency(order.total) : "",
      ]);
    }
  }

  const csv = [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${campaign.slug}-orders.csv"`,
    },
  });
}
