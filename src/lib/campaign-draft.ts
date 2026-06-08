export type ProductDraft = {
  name: string;
  price: string;
  cost: string;
  imageUrl: string;
  quantityLimit: string;
};

export type CampaignDraft = {
  name: string;
  orgName: string;
  description: string;
  logoUrl: string;
  goalAmount: string;
  leaderboardEnabled: boolean;
  products: ProductDraft[];
};

export const emptyProduct = (): ProductDraft => ({
  name: "",
  price: "",
  cost: "",
  imageUrl: "",
  quantityLimit: "",
});

export function campaignToDraft(campaign: {
  name: string;
  orgName: string;
  description: string | null;
  logoUrl: string | null;
  goalAmount: number | null;
  leaderboardEnabled?: boolean;
  products: {
    name: string;
    price: number;
    cost?: number;
    imageUrl: string | null;
    quantityLimit: number | null;
  }[];
}): CampaignDraft {
  return {
    name: campaign.name,
    orgName: campaign.orgName,
    description: campaign.description || "",
    logoUrl: campaign.logoUrl || "",
    goalAmount: campaign.goalAmount
      ? String(campaign.goalAmount / 100)
      : "",
    leaderboardEnabled: campaign.leaderboardEnabled ?? true,
    products: campaign.products.length
      ? campaign.products.map((p) => ({
          name: p.name,
          price: String(p.price / 100),
          cost: p.cost ? String(p.cost / 100) : "",
          imageUrl: p.imageUrl || "",
          quantityLimit: p.quantityLimit ? String(p.quantityLimit) : "",
        }))
      : [emptyProduct()],
  };
}
