// ─── Product ────────────────────────────────────────────────────────────────

export type Condition = "NY" | "SOM NY" | "GOD" | "BRUGT";
export type Category =
  | "Sneakers"
  | "Outerwear"
  | "Hoodies"
  | "T-Shirts"
  | "Bukser"
  | "Accessories"
  | "Caps"
  | "Tasker";
export type SortOption = "newest" | "price_asc" | "price_desc" | "popular";

export interface Product {
  id: string;
  title: string;
  brand: string;
  description: string;
  price: number;
  originalRetailPrice?: number;
  size: string;
  condition: Condition;
  category: Category;
  imageUrl: string | null;
  images?: string[];
  isDrop: boolean;
  isVerified: boolean;
  sellerId: string;
  createdAt: string;
  views?: number;
  favorites?: number;
}

// ─── Seller / User ──────────────────────────────────────────────────────────

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  rating: number;
  totalSales: number;
  totalListings: number;
  memberSince: string;
  isVerified: boolean;
  location: string;
  responseRate: number; // percentage 0-100
  bio?: string;
  city?: string;
}

// ─── Review ─────────────────────────────────────────────────────────────────

export interface Review {
  id: string;
  authorId: string;
  authorUsername: string;
  rating: number;
  text: string;
  createdAt: string;
  productTitle: string;
}

// ─── Message / Conversation ─────────────────────────────────────────────────

export type MessageType = "text" | "offer";
export type OfferStatus = "pending" | "accepted" | "rejected";

export interface Offer {
  id: string;
  conversationId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  status: OfferStatus;
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: string;
  messageType: MessageType;
  offerId?: string | null;
}

export interface Conversation {
  id: string;
  participant: Pick<User, "id" | "username" | "displayName" | "avatarUrl" | "isVerified">;
  product: Pick<Product, "id" | "title" | "brand" | "price" | "imageUrl">;
  messages: Message[];
  unreadCount: number;
  updatedAt: string;
}

// ─── Dashboard ──────────────────────────────────────────────────────────────

export interface DashboardStat {
  label: string;
  value: string;
  sub?: string;
  trend?: "up" | "down" | "neutral";
}

export interface SoldListing {
  id: string;
  product: Pick<Product, "id" | "title" | "brand" | "price" | "imageUrl" | "condition">;
  buyerUsername: string;
  soldAt: string;
  payout: number;
}

// ─── Filter ─────────────────────────────────────────────────────────────────

export interface ShopFilters {
  category: Category | "ALL";
  condition: Condition | "ALL";
  brand: string | "ALL";
  size: string | "ALL";
  priceMin: number | null;
  priceMax: number | null;
  sort: SortOption;
}

// ─── Stat ───────────────────────────────────────────────────────────────────

export interface Stat {
  value: string;
  label: string;
}
