export type TemplateProduct = {
  name: string;
  price: number;
  cost: number;
  quantityLimit?: number;
};

export type FundraiserTemplate = {
  id: string;
  name: string;
  description: string;
  emoji: string;
  orgNamePlaceholder: string;
  namePlaceholder: string;
  descriptionPlaceholder: string;
  goalAmount?: number;
  products: TemplateProduct[];
};

export const FUNDRAISER_TEMPLATES: FundraiserTemplate[] = [
  {
    id: "doughnut",
    name: "Doughnut Fundraiser",
    description: "Classic doughnut drive — high margin, easy to sell.",
    emoji: "🍩",
    orgNamePlaceholder: "Riverside Primary School",
    namePlaceholder: "Year 6 Doughnut Drive",
    descriptionPlaceholder:
      "Help our Year 6 class raise funds for their end-of-year camp!",
    goalAmount: 500000,
    products: [
      { name: "Box of 6 glazed doughnuts", price: 1200, cost: 600 },
      { name: "Box of 12 assorted doughnuts", price: 2200, cost: 1100 },
      { name: "Doughnut voucher", price: 500, cost: 250 },
    ],
  },
  {
    id: "chocolate",
    name: "Chocolate Fundraiser",
    description: "Sell chocolate boxes — a proven school favourite.",
    emoji: "🍫",
    orgNamePlaceholder: "St Mary's Primary",
    namePlaceholder: "Chocolate Box Fundraiser",
    descriptionPlaceholder:
      "Every box sold helps fund new library books for our students.",
    goalAmount: 300000,
    products: [
      { name: "Milk chocolate box (250g)", price: 1000, cost: 500 },
      { name: "Assorted chocolate box (500g)", price: 1800, cost: 900 },
      { name: "Premium gift box", price: 2500, cost: 1200 },
    ],
  },
  {
    id: "school",
    name: "School Fundraiser",
    description: "Flexible template for any school fundraising drive.",
    emoji: "🏫",
    orgNamePlaceholder: "Your School Name",
    namePlaceholder: "School Fundraising Campaign",
    descriptionPlaceholder:
      "Support our school community with every purchase.",
    goalAmount: 1000000,
    products: [
      { name: "Fundraising item — Tier 1", price: 1000, cost: 400 },
      { name: "Fundraising item — Tier 2", price: 2000, cost: 800 },
    ],
  },
  {
    id: "sports",
    name: "Sports Club Fundraiser",
    description: "Raise funds for equipment, travel, and uniforms.",
    emoji: "⚽",
    orgNamePlaceholder: "Westside Junior FC",
    namePlaceholder: "Season Equipment Fundraiser",
    descriptionPlaceholder:
      "Help our team get new gear for the upcoming season!",
    goalAmount: 800000,
    products: [
      { name: "Club supporter pack", price: 1500, cost: 600 },
      { name: "Team merchandise item", price: 2500, cost: 1000 },
      { name: "Sponsorship contribution", price: 5000, cost: 0 },
    ],
  },
  {
    id: "community",
    name: "Community Group Fundraiser",
    description: "For clubs, scouts, and community organisations.",
    emoji: "🤝",
    orgNamePlaceholder: "Local Community Group",
    namePlaceholder: "Community Fundraising Drive",
    descriptionPlaceholder:
      "Your support helps us continue serving our community.",
    goalAmount: 500000,
    products: [
      { name: "Community supporter bundle", price: 1200, cost: 500 },
      { name: "Premium supporter pack", price: 3000, cost: 1200 },
    ],
  },
];

export function getTemplate(id: string): FundraiserTemplate | undefined {
  return FUNDRAISER_TEMPLATES.find((t) => t.id === id);
}
