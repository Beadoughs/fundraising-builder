import { prisma } from "@/lib/db";
import { ensureDatabaseReady } from "@/lib/db-init";
import { goalProgressPercent, sumCost, sumProfit, sumRevenue } from "@/lib/profit";

export type CampaignStats = {
  revenue: number;
  profit: number;
  cost: number;
  orderCount: number;
  participantCount: number;
  goalAmount: number | null;
  goalProgress: number | null;
  published: boolean;
  archived: boolean;
  status: "draft" | "live" | "archived";
};

export type ParticipantStats = {
  id: string;
  name: string;
  slug: string;
  team: string | null;
  email: string | null;
  revenue: number;
  profit: number;
  orderCount: number;
};

export type ProductStats = {
  id: string;
  name: string;
  price: number;
  cost: number;
  unitsSold: number;
  revenue: number;
  profit: number;
};

export type FulfillmentSummary = {
  pending: number;
  ready: number;
  collected: number;
  delivered: number;
};

const PAID = { status: "paid" as const };

export async function getCampaignStats(campaignId: string): Promise<CampaignStats | null> {
  ensureDatabaseReady();

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      orders: {
        where: PAID,
        include: { items: true },
      },
      _count: { select: { participants: true } },
    },
  });

  if (!campaign) return null;

  const items = campaign.orders.flatMap((o) => o.items);
  const revenue = sumRevenue(items);
  const profit = sumProfit(items);

  let status: CampaignStats["status"] = "draft";
  if (campaign.archived) status = "archived";
  else if (campaign.published) status = "live";

  return {
    revenue,
    profit,
    cost: sumCost(items),
    orderCount: campaign.orders.length,
    participantCount: campaign._count.participants,
    goalAmount: campaign.goalAmount,
    goalProgress: goalProgressPercent(revenue, campaign.goalAmount),
    published: campaign.published,
    archived: campaign.archived,
    status,
  };
}

export async function getOrganisationStats(userId: string) {
  ensureDatabaseReady();

  const campaigns = await prisma.campaign.findMany({
    where: { userId, archived: false },
    include: {
      orders: { where: PAID, include: { items: true } },
      _count: { select: { participants: true } },
    },
  });

  const items = campaigns.flatMap((c) => c.orders.flatMap((o) => o.items));
  const revenue = sumRevenue(items);
  const profit = sumProfit(items);

  return {
    revenue,
    profit,
    cost: sumCost(items),
    orderCount: campaigns.reduce((s, c) => s + c.orders.length, 0),
    participantCount: campaigns.reduce((s, c) => s + c._count.participants, 0),
    campaignCount: campaigns.length,
    liveCount: campaigns.filter((c) => c.published).length,
  };
}

export async function getParticipantStats(
  campaignId: string
): Promise<ParticipantStats[]> {
  ensureDatabaseReady();

  const participants = await prisma.participant.findMany({
    where: { campaignId },
    include: {
      orders: { where: PAID, include: { items: true } },
    },
    orderBy: { name: "asc" },
  });

  return participants
    .map((p) => {
      const items = p.orders.flatMap((o) => o.items);
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        team: p.team,
        email: p.email,
        revenue: sumRevenue(items),
        profit: sumProfit(items),
        orderCount: p.orders.length,
      };
    })
    .sort((a, b) => b.profit - a.profit);
}

export async function getProductStats(campaignId: string): Promise<ProductStats[]> {
  ensureDatabaseReady();

  const products = await prisma.product.findMany({
    where: { campaignId },
    include: {
      orderItems: {
        where: { order: PAID },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  return products
    .map((p) => {
      const unitsSold = p.orderItems.reduce((s, i) => s + i.quantity, 0);
      const revenue = sumRevenue(p.orderItems);
      const profit = sumProfit(p.orderItems);
      return {
        id: p.id,
        name: p.name,
        price: p.price,
        cost: p.cost,
        unitsSold,
        revenue,
        profit,
      };
    })
    .sort((a, b) => b.profit - a.profit);
}

export async function getFulfillmentSummary(
  campaignId: string
): Promise<FulfillmentSummary> {
  ensureDatabaseReady();

  const orders = await prisma.order.findMany({
    where: { campaignId, status: "paid" },
    select: { fulfillmentStatus: true },
  });

  const summary: FulfillmentSummary = {
    pending: 0,
    ready: 0,
    collected: 0,
    delivered: 0,
  };

  for (const o of orders) {
    const key = o.fulfillmentStatus as keyof FulfillmentSummary;
    if (key in summary) summary[key] += 1;
  }

  return summary;
}

export async function getCollectionList(campaignId: string) {
  ensureDatabaseReady();

  const items = await prisma.orderItem.findMany({
    where: { order: { campaignId, status: "paid" } },
    include: { product: true },
  });

  const totals = new Map<string, { name: string; quantity: number }>();
  for (const item of items) {
    const existing = totals.get(item.productId) ?? {
      name: item.name,
      quantity: 0,
    };
    existing.quantity += item.quantity;
    totals.set(item.productId, existing);
  }

  return Array.from(totals.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}
