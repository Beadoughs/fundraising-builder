import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ order?: string }>;
};

export default async function SuccessPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const { order: orderId } = await searchParams;

  const campaign = await prisma.campaign.findFirst({
    where: { slug, published: true },
  });

  if (!campaign) notFound();

  const order = orderId
    ? await prisma.order.findFirst({
        where: { id: orderId, campaignId: campaign.id },
        include: { items: true },
      })
    : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-100 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
          ✓
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Order confirmed!</h1>
        <p className="mt-3 text-gray-600">
          Thank you for supporting <strong>{campaign.orgName}</strong>.
          {order && (
            <>
              {" "}
              A receipt has been sent to{" "}
              <strong>{order.customerEmail}</strong>.
            </>
          )}
        </p>

        {order && (
          <div className="mt-6 rounded-lg bg-gray-50 p-4 text-left text-sm">
            <p className="mb-2 font-medium text-gray-900">Order summary</p>
            <ul className="space-y-1 text-gray-600">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between">
                  <span>
                    {item.quantity}× {item.name}
                  </span>
                  <span>{formatCurrency(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex justify-between border-t border-gray-200 pt-3 font-semibold">
              <span>Total</span>
              <span className="text-brand">{formatCurrency(order.total)}</span>
            </div>
          </div>
        )}

        <Link
          href={`/c/${slug}`}
          className="mt-8 inline-block text-sm font-medium text-brand hover:underline"
        >
          ← Back to campaign
        </Link>
      </div>
    </div>
  );
}
