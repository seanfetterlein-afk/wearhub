export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          bio: string | null;
          location: string | null;
          avatar_url: string | null;
          is_verified: boolean;
          response_rate: number;
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          bio?: string | null;
          location?: string | null;
          avatar_url?: string | null;
          is_verified?: boolean;
          response_rate?: number;
          created_at?: string;
        };
        Update: {
          username?: string;
          display_name?: string | null;
          bio?: string | null;
          location?: string | null;
          avatar_url?: string | null;
          is_verified?: boolean;
          response_rate?: number;
        };
      };
      products: {
        Row: {
          id: string;
          seller_id: string;
          title: string;
          description: string | null;
          brand: string;
          category: string;
          size: string;
          condition: "NY" | "SOM NY" | "GOD" | "BRUGT";
          price: number;
          original_retail_price: number | null;
          is_drop: boolean;
          is_verified: boolean;
          status: "draft" | "active" | "sold" | "removed";
          views: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          seller_id: string;
          title: string;
          description?: string | null;
          brand: string;
          category: string;
          size: string;
          condition: "NY" | "SOM NY" | "GOD" | "BRUGT";
          price: number;
          original_retail_price?: number | null;
          is_drop?: boolean;
          is_verified?: boolean;
          status?: "draft" | "active" | "sold" | "removed";
          views?: number;
        };
        Update: {
          title?: string;
          description?: string | null;
          brand?: string;
          category?: string;
          size?: string;
          condition?: "NY" | "SOM NY" | "GOD" | "BRUGT";
          price?: number;
          original_retail_price?: number | null;
          is_drop?: boolean;
          status?: "draft" | "active" | "sold" | "removed";
        };
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          storage_path: string;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          storage_path: string;
          position?: number;
        };
        Update: {
          position?: number;
        };
      };
      favorites: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id: string;
        };
        Update: never;
      };
      conversations: {
        Row: {
          id: string;
          product_id: string | null;
          buyer_id: string;
          seller_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id?: string | null;
          buyer_id: string;
          seller_id: string;
        };
        Update: {
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          text: string;
          is_read: boolean;
          message_type: "text" | "offer";
          offer_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          text: string;
          is_read?: boolean;
          message_type?: "text" | "offer";
          offer_id?: string | null;
        };
        Update: {
          is_read?: boolean;
        };
      };
      offers: {
        Row: {
          id: string;
          conversation_id: string;
          buyer_id: string;
          seller_id: string;
          amount: number;
          status: "pending" | "accepted" | "rejected";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          buyer_id: string;
          seller_id: string;
          amount: number;
          status?: "pending" | "accepted" | "rejected";
        };
        Update: {
          status?: "pending" | "accepted" | "rejected";
        };
      };
      orders: {
        Row: {
          id: string;
          product_id: string;
          buyer_id: string;
          seller_id: string;
          amount: number;
          payout: number;
          stripe_payment_intent_id: string | null;
          status: "pending" | "paid" | "shipped" | "delivered" | "disputed" | "refunded";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          buyer_id: string;
          seller_id: string;
          amount: number;
          payout: number;
          stripe_payment_intent_id?: string | null;
          status?: "pending" | "paid" | "shipped" | "delivered" | "disputed" | "refunded";
        };
        Update: {
          status?: "pending" | "paid" | "shipped" | "delivered" | "disputed" | "refunded";
          stripe_payment_intent_id?: string | null;
        };
      };
      notifications: {
        Row: {
          id:              string;
          user_id:         string;
          type:            "message" | "offer_received" | "offer_accepted" | "offer_rejected" | "listing_favorited" | "favorite_price_drop" | "system";
          title:           string;
          body:            string;
          listing_id:      string | null;
          related_user_id: string | null;
          conversation_id: string | null;
          is_read:         boolean;
          created_at:      string;
        };
        Insert: {
          id?:             string;
          user_id:         string;
          type:            string;
          title:           string;
          body:            string;
          listing_id?:     string | null;
          related_user_id?: string | null;
          conversation_id?: string | null;
          is_read?:        boolean;
        };
        Update: {
          is_read?: boolean;
        };
      };
      push_subscriptions: {
        Row: {
          id:         string;
          user_id:    string;
          endpoint:   string;
          p256dh:     string;
          auth:       string;
          created_at: string;
        };
        Insert: {
          id?:        string;
          user_id:    string;
          endpoint:   string;
          p256dh:     string;
          auth:       string;
        };
        Update: {
          p256dh?: string;
          auth?:   string;
        };
      };
      reviews: {
        Row: {
          id: string;
          order_id: string | null;
          author_id: string;
          subject_id: string;
          rating: number;
          text: string | null;
          product_title: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id?: string | null;
          author_id: string;
          subject_id: string;
          rating: number;
          text?: string | null;
          product_title?: string | null;
        };
        Update: never;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};

// ─── Convenience row types ───────────────────────────────────────────────────

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type Profile     = Tables<"profiles">;
export type ProductRow  = Tables<"products">;
export type ProductImage = Tables<"product_images">;
export type Favorite    = Tables<"favorites">;
export type Conversation = Tables<"conversations">;
export type MessageRow  = Tables<"messages">;
export type OfferRow    = Tables<"offers">;
export type Order       = Tables<"orders">;
export type ReviewRow   = Tables<"reviews">;

// ─── Joined types used across the app ───────────────────────────────────────

export type ProductWithSeller = ProductRow & {
  seller: Pick<Profile, "id" | "username" | "display_name" | "is_verified" | "avatar_url">;
  product_images: Pick<ProductImage, "storage_path" | "position">[];
};

export type ConversationWithDetails = Conversation & {
  product: Pick<ProductRow, "id" | "title" | "brand" | "price"> & {
    product_images: Pick<ProductImage, "storage_path" | "position">[];
  };
  other_user: Pick<Profile, "id" | "username" | "display_name" | "avatar_url" | "is_verified">;
  last_message: Pick<MessageRow, "text" | "sender_id" | "created_at"> | null;
  unread_count: number;
};
