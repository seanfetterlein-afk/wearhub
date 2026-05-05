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

export type MessageType = "text" | "offer" | "system" | "order_update";
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

// ─── Order ───────────────────────────────────────────────────────────────────

export type OrderStatus =
  | "pending_payment"
  | "pending"
  | "paid"
  | "awaiting_seller_shipping"
  | "label_created"
  | "confirmed"
  | "shipped"
  | "in_transit"
  | "delivered"
  | "completed"
  | "cancelled"
  | "disputed"
  | "refunded";

export interface Order {
  id: string;
  productId: string;
  buyerId: string;
  sellerId: string;
  /** Total charged to buyer (item + shipping + platform fee) */
  amount: number;
  /** Seller payout (≈ 94 % of item price) */
  payout: number;
  itemPrice: number | null;
  shippingPrice: number | null;
  platformFee: number | null;
  totalPrice: number | null;
  status: OrderStatus;
  shippingDeadline: string | null;
  confirmedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  completedAt: string | null;
  createdAt: string;
  // Buyer delivery details
  buyerName: string | null;
  buyerAddress: string | null;
  buyerCity: string | null;
  buyerZip: string | null;
  // Shipping
  shippingCarrier: string | null;
  shippingMethod: string | null;
}

// ─── Shipping ────────────────────────────────────────────────────────────────

export type ShippingCarrier = "DAO" | "GLS" | "Bring" | "PostNord";

export interface Shipment {
  id: string;
  orderId: string;
  carrier: ShippingCarrier;
  shippingMethod: string;
  labelUrl: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  packageCode: string | null;
  status: string;
  createdAt: string;
  shippedAt: string | null;
}

// ─── Stat ───────────────────────────────────────────────────────────────────

export interface Stat {
  value: string;
  label: string;
}
