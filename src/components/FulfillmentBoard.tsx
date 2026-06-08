"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatCurrency } from "@/lib/utils";

type OrderRow = {
  id: string;
  customerName: string;
  customerEmail: string;
  total: number;
  profit: number;
  fulfillmentStatus: string;
  createdAt: string;
  items: string;
  participantName: string | null;
};

const STATUSES = [
  { value: "pending", label: "Pending", color: "bg-amber-100 text-amber-700" },
  { value: "ready", label: "Ready", color: "bg-blue-100 text-blue-700" },
  { value: "collected", label: "Collected", color: "bg-green-100 text-green-700" },
  { value: "delivered", label: "Delivered", color: "bg-green-100 text-green-700" },
] as const;

export function FulfillmentBoard({
  campaignId,
  orders,
}: {
  campaignId: string;
  orders: OrderRow[];
}) {
  const router = useRouter();
  const [updating, setUpdating] = useState<string | null>(null);

  async function updateStatus(orderId: string, fulfillmentStatus: string) {
    setUpdating(orderId);
    try {
      const res = await fetch(
        `/api/campaigns/${campaignId}/orders/${orderId}/fulfillment`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fulfillmentStatus }),
        }
      );
      if (res.ok) router.refresh();
    } finally {
      setUpdating(null);
    }
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 py-12 text-center text-sm text-gray-500">
        No paid orders yet. Orders will appear here once payments are complete.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Items</th>
              <th className="px-4 py-3 font-medium">Seller</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Profit</th>
              <th className="px-4 py-3 font-medium">Fulfilment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {orders.map((order) => {
              const status = STATUSES.find(
                (s) => s.value === order.fulfillmentStatus
              );
              return (
                <tr key={order.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(order.createdAt).toLocaleDateString("en-AU", {
                      day: "numeric",
                      month: "short",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">
                      {order.customerName}
                    </p>
                    <p className="text-xs text-gray-400">
                      {order.customerEmail}
                    </p>
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-gray-600">
                    {order.items}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {order.participantName || "—"}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {formatCurrency(order.total)}
                  </td>
                  <td className="px-4 py-3 font-semibold text-emerald-600">
                    {formatCurrency(order.profit)}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={order.fulfillmentStatus}
                      disabled={updating === order.id}
                      onChange={(e) =>
                        updateStatus(order.id, e.target.value)
                      }
                      className={`rounded-full border-0 px-2 py-1 text-xs font-medium ${status?.color ?? "bg-gray-100"}`}
                    >
                      {STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
