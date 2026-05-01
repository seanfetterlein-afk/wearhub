import type { Review } from "@/types";

export const DUMMY_REVIEWS: Review[] = [
  {
    id: "rev_001",
    authorId: "user_abc",
    authorUsername: "nikekid_cph",
    rating: 5,
    text: "Perfekt handel. Hurtig sending og varen var præcis som beskrevet. Klart anbefalet sælger!",
    createdAt: "2026-04-10T10:00:00Z",
    productTitle: "Nike Air Max 90",
  },
  {
    id: "rev_002",
    authorId: "user_ghi",
    authorUsername: "supreme_sthlm",
    rating: 5,
    text: "Super professionel — boks og alt medfølgte. Sender hurtigt og kommunikerer godt.",
    createdAt: "2026-03-28T14:30:00Z",
    productTitle: "Palace Tri-Ferg Hoodie",
  },
  {
    id: "rev_003",
    authorId: "user_mno",
    authorUsername: "stone_island_dk",
    rating: 4,
    text: "God handel. Varen havde en lille plet som ikke var nævnt, men prisen var fair og sælger var imødekommende.",
    createdAt: "2026-03-15T09:00:00Z",
    productTitle: "Stüssy World Tour Tee",
  },
  {
    id: "rev_004",
    authorId: "user_def",
    authorUsername: "yeezy_dk",
    rating: 5,
    text: "Fantastisk sælger. Alt autentisk og hurtig levering. Handler gerne igen.",
    createdAt: "2026-03-01T16:00:00Z",
    productTitle: "Carhartt WIP Logo Sweatshirt",
  },
  {
    id: "rev_005",
    authorId: "user_stu",
    authorUsername: "carhartt_cph",
    rating: 5,
    text: "Præcis som annonceret, lynhurtig sending. En fornøjelse!",
    createdAt: "2026-02-14T11:00:00Z",
    productTitle: "New Balance 2002R",
  },
];

export const DUMMY_SOLD_ITEMS = [
  {
    id: "sold_001",
    product: {
      id: "s001",
      title: "Nike Air Max 90",
      brand: "Nike",
      price: 1899,
      imageUrl: null,
      condition: "GOD" as const,
    },
    buyerUsername: "nikekid_cph",
    soldAt: "2026-04-10T10:00:00Z",
    payout: 1784,
  },
  {
    id: "sold_002",
    product: {
      id: "s002",
      title: "Palace Tri-Ferg Hoodie",
      brand: "Palace",
      price: 1499,
      imageUrl: null,
      condition: "SOM NY" as const,
    },
    buyerUsername: "supreme_sthlm",
    soldAt: "2026-03-28T14:30:00Z",
    payout: 1409,
  },
  {
    id: "sold_003",
    product: {
      id: "s003",
      title: "Stüssy World Tour Tee",
      brand: "Stüssy",
      price: 649,
      imageUrl: null,
      condition: "GOD" as const,
    },
    buyerUsername: "stone_island_dk",
    soldAt: "2026-03-15T09:00:00Z",
    payout: 610,
  },
];
