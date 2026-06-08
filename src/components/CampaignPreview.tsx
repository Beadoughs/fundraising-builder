import { formatCurrency } from "@/lib/utils";
import { SafeImage } from "@/components/SafeImage";

export type PreviewProduct = {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  quantityLimit: number | null;
};

export type PreviewCampaign = {
  name: string;
  orgName: string;
  description: string | null;
  logoUrl: string | null;
  goalAmount: number | null;
  products: PreviewProduct[];
  totalRaised?: number;
};

export function CampaignPreview({
  campaign,
  interactive = false,
}: {
  campaign: PreviewCampaign;
  interactive?: boolean;
}) {
  const totalRaised = campaign.totalRaised ?? 0;
  const goalProgress = campaign.goalAmount
    ? Math.min(100, Math.round((totalRaised / campaign.goalAmount) * 100))
    : null;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-background shadow-sm">
      <header className="border-b border-gray-100 bg-white">
        <div className="px-4 py-8 text-center">
          {campaign.logoUrl && (
            <div className="relative mx-auto mb-4 h-20 w-20 overflow-hidden rounded-full border-2 border-white shadow-md">
              <SafeImage
                src={campaign.logoUrl}
                alt={campaign.orgName}
                fill
                className="object-cover"
              />
            </div>
          )}
          <p className="text-sm font-medium text-brand">{campaign.orgName}</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
            {campaign.name}
          </h1>
          {campaign.description && (
            <p className="mt-3 text-gray-600">{campaign.description}</p>
          )}

          {campaign.goalAmount && (
            <div className="mx-auto mt-6 max-w-sm">
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-brand">
                  {formatCurrency(totalRaised)} raised
                </span>
                <span className="text-gray-400">
                  Goal {formatCurrency(campaign.goalAmount)}
                </span>
              </div>
              {goalProgress !== null && (
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{ width: `${goalProgress}%` }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="px-4 py-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Order now</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {campaign.products.map((product) => (
            <div
              key={product.id}
              className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm"
            >
              <div className="relative aspect-[4/3] bg-gray-50">
                {product.imageUrl ? (
                  <SafeImage
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-5xl">
                    🎁
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900">{product.name}</h3>
                <p className="mt-1 text-lg font-bold text-brand">
                  {formatCurrency(product.price)}
                </p>
                {product.quantityLimit && (
                  <p className="mt-1 text-xs text-gray-400">
                    Limited to {product.quantityLimit}
                  </p>
                )}
                <div
                  className={`mt-4 w-full rounded-lg py-2.5 text-center text-sm font-semibold ${
                    interactive
                      ? "bg-brand text-white"
                      : "border border-dashed border-gray-300 bg-gray-50 text-gray-400"
                  }`}
                >
                  Order now
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-gray-100 py-6 text-center text-xs text-gray-400">
        Powered by Beadoughs
      </footer>
    </div>
  );
}
