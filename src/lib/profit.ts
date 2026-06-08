export type OrderItemLike = {
  price: number;
  cost: number;
  quantity: number;
};

export function lineRevenue(item: OrderItemLike): number {
  return item.price * item.quantity;
}

export function lineCost(item: OrderItemLike): number {
  return item.cost * item.quantity;
}

export function lineProfit(item: OrderItemLike): number {
  return lineRevenue(item) - lineCost(item);
}

export function sumRevenue(items: OrderItemLike[]): number {
  return items.reduce((sum, i) => sum + lineRevenue(i), 0);
}

export function sumCost(items: OrderItemLike[]): number {
  return items.reduce((sum, i) => sum + lineCost(i), 0);
}

export function sumProfit(items: OrderItemLike[]): number {
  return sumRevenue(items) - sumCost(items);
}

export function profitMarginPercent(revenue: number, profit: number): number {
  if (revenue <= 0) return 0;
  return Math.round((profit / revenue) * 100);
}

export function goalProgressPercent(raised: number, goal: number | null): number | null {
  if (!goal || goal <= 0) return null;
  return Math.min(100, Math.round((raised / goal) * 100));
}
