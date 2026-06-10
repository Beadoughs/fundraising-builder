import { prisma } from "@/lib/db";
import { ensureDatabaseReady } from "@/lib/db-init";
import { formatCurrency } from "@/lib/utils";

export type ActivityItem = {
  id: string;
  message: string;
  createdAt: string;
};

function firstName(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return "Someone";
  return trimmed.split(/\s+/)[0] ?? "Someone";
}

function formatItemSummary(
  items: { name: string; quantity: number }[]
): string | null {
  if (items.length === 0) return null;

  if (items.length === 1) {
    const item = items[0];
    if (item.quantity === 1) return item.name;
    return `${item.quantity} ${item.name}`;
  }

  const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
  if (totalQty <= 3) {
    return items
      .map((item) =>
        item.quantity === 1 ? item.name : `${item.quantity} ${item.name}`
      )
      .join(" and ");
  }

  return "a mixed box";
}

export function formatOrderActivity(order: {
  customerName: string;
  total: number;
  participant?: { name: string } | null;
  items: { name: string; quantity: number }[];
}): string {
  const buyer = firstName(order.customerName);
  const itemSummary = formatItemSummary(order.items);

  if (itemSummary) {
    const needsArticle =
      itemSummary.startsWith("a ") ||
      itemSummary.startsWith("an ") ||
      /^\d/.test(itemSummary);
    if (needsArticle) {
      return `${buyer} just ordered ${itemSummary}`;
    }
    return `${buyer} just ordered ${itemSummary}`;
  }

  if (order.participant) {
    return `${buyer} just supported ${order.participant.name}`;
  }

  return `${buyer} donated ${formatCurrency(order.total)}`;
}

export async function getCampaignActivity(
  campaignId: string,
  limit = 12
): Promise<ActivityItem[]> {
  ensureDatabaseReady();

  const orders = await prisma.order.findMany({
    where: { campaignId, status: "paid" },
    include: {
      items: true,
      participant: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return orders.map((order) => ({
    id: order.id,
    message: formatOrderActivity(order),
    createdAt: order.createdAt.toISOString(),
  }));
}
