import { getOwnedCampaign } from "@/lib/campaigns";
import { ensureDatabaseReady } from "@/lib/db-init";
import { prisma } from "@/lib/db";
import {
  getCollectionList,
  getParticipantStats,
  getProductStats,
} from "@/lib/fundraising-stats";
import { sumProfit } from "@/lib/profit";
import { requireApiUser } from "@/lib/session";
import { formatCurrency } from "@/lib/utils";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

function csvEscape(cell: string | number): string {
  return `"${String(cell).replace(/"/g, '""')}"`;
}

function toCsv(headers: string[], rows: (string | number)[][]): string {
  return [headers, ...rows]
    .map((row) => row.map(csvEscape).join(","))
    .join("\n");
}

export async function GET(request: Request, context: RouteContext) {
  const authResult = await requireApiUser();
  if (authResult.response) return authResult.response;

  ensureDatabaseReady();
  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "orders";

  const campaign = await getOwnedCampaign(id, authResult.user.id);
  if (!campaign) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const full = await prisma.campaign.findUnique({
    where: { id },
    include: {
      orders: {
        where: { status: "paid" },
        include: {
          items: true,
          participant: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!full) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let csv = "";
  let filename = full.slug;

  if (type === "fulfillment") {
    const headers = [
      "Order ID",
      "Date",
      "Customer",
      "Email",
      "Seller",
      "Items",
      "Total",
      "Profit",
      "Fulfilment Status",
    ];
    const rows = full.orders.map((order) => [
      order.id,
      order.createdAt.toISOString(),
      order.customerName,
      order.customerEmail,
      order.participant?.name || "",
      order.items.map((i) => `${i.quantity}x ${i.name}`).join("; "),
      formatCurrency(order.total),
      formatCurrency(sumProfit(order.items)),
      order.fulfillmentStatus,
    ]);
    csv = toCsv(headers, rows);
    filename = `${full.slug}-fulfillment`;
  } else if (type === "collection") {
    const list = await getCollectionList(id);
    csv = toCsv(
      ["Product", "Quantity Required"],
      list.map((i) => [i.name, i.quantity])
    );
    filename = `${full.slug}-collection-list`;
  } else if (type === "participants") {
    const participants = await getParticipantStats(id);
    csv = toCsv(
      ["Name", "Team", "Orders", "Revenue", "Profit"],
      participants.map((p) => [
        p.name,
        p.team || "",
        p.orderCount,
        formatCurrency(p.revenue),
        formatCurrency(p.profit),
      ])
    );
    filename = `${full.slug}-participants`;
  } else if (type === "products") {
    const products = await getProductStats(id);
    csv = toCsv(
      ["Product", "Price", "Cost", "Units Sold", "Revenue", "Profit"],
      products.map((p) => [
        p.name,
        formatCurrency(p.price),
        formatCurrency(p.cost),
        p.unitsSold,
        formatCurrency(p.revenue),
        formatCurrency(p.profit),
      ])
    );
    filename = `${full.slug}-products`;
  } else {
    const headers = [
      "Order ID",
      "Date",
      "Customer Name",
      "Customer Email",
      "Seller",
      "Product",
      "Quantity",
      "Unit Price",
      "Unit Cost",
      "Line Revenue",
      "Line Profit",
      "Order Total",
      "Fulfilment Status",
    ];
    const rows: (string | number)[][] = [];
    for (const order of full.orders) {
      for (let i = 0; i < order.items.length; i++) {
        const item = order.items[i];
        const lineRev = item.price * item.quantity;
        const lineProfit = (item.price - item.cost) * item.quantity;
        rows.push([
          order.id,
          order.createdAt.toISOString(),
          order.customerName,
          order.customerEmail,
          order.participant?.name || "",
          item.name,
          item.quantity,
          formatCurrency(item.price),
          formatCurrency(item.cost),
          formatCurrency(lineRev),
          formatCurrency(lineProfit),
          i === 0 ? formatCurrency(order.total) : "",
          i === 0 ? order.fulfillmentStatus : "",
        ]);
      }
    }
    csv = toCsv(headers, rows);
    filename = `${full.slug}-orders`;
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}.csv"`,
    },
  });
}
