"use server";

import { revalidatePath } from "next/cache";
import { createClient, getUser } from "@/lib/supabase/server";
import { storageUrl } from "@/lib/supabase/helpers";

export type NotificationType =
  | "message"
  | "offer_received"
  | "offer_accepted"
  | "offer_rejected"
  | "listing_favorited"
  | "favorite_price_drop"
  | "system";

export interface AppNotification {
  id:             string;
  type:           NotificationType;
  title:          string;
  body:           string;
  isRead:         boolean;
  createdAt:      string;
  listingId:      string | null;
  conversationId: string | null;
  listingImageUrl: string | null;
  listingBrand:   string | null;
  relatedUsername: string | null;
}

export async function getNotifications(): Promise<AppNotification[]> {
  try {
    const user = await getUser();
    if (!user) return [];

    const supabase = await createClient();
    const { data, error } = await (supabase
      .from("notifications") as any)
      .select(`
        id, type, title, body, is_read, created_at,
        listing_id, conversation_id,
        listing:products(brand, product_images(storage_path, position)),
        related_user:profiles!related_user_id(username)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(60);

    if (error) return []; // table may not exist yet

    return (data ?? []).map((n: any) => ({
      id:             n.id,
      type:           n.type,
      title:          n.title,
      body:           n.body,
      isRead:         n.is_read,
      createdAt:      n.created_at,
      listingId:      n.listing_id,
      conversationId: n.conversation_id,
      listingBrand:   n.listing?.brand ?? null,
      listingImageUrl: storageUrl(
        n.listing?.product_images
          ?.sort((a: any, b: any) => a.position - b.position)[0]
          ?.storage_path ?? null,
      ),
      relatedUsername: n.related_user?.username ?? null,
    }));
  } catch {
    return [];
  }
}

export async function markNotificationRead(notificationId: string) {
  const user = await getUser();
  if (!user) return;

  const supabase = await createClient();
  await (supabase.from("notifications") as any)
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  revalidatePath("/messages");
}

export async function markAllNotificationsRead() {
  const user = await getUser();
  if (!user) return;

  const supabase = await createClient();
  await (supabase.from("notifications") as any)
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  revalidatePath("/messages");
}

/** Notify all users who favorited a listing that its price dropped. */
export async function notifyPriceDrop(listingId: string, newPrice: number) {
  const supabase = await createClient();

  const { data: favs } = await supabase
    .from("favorites")
    .select("user_id")
    .eq("product_id", listingId);

  if (!favs?.length) return;

  const { data: product } = await (supabase.from("products") as any)
    .select("title, brand, seller_id")
    .eq("id", listingId)
    .single();

  await Promise.allSettled(
    favs
      .filter((f: any) => f.user_id !== product?.seller_id)
      .map((f: any) =>
        (supabase.rpc as any)("create_notification", {
          p_user_id:    f.user_id,
          p_type:       "favorite_price_drop",
          p_title:      "Prisnedsættelse",
          p_body:       `${product?.brand ?? ""} ${product?.title ?? ""} er sat ned i pris`,
          p_listing_id: listingId,
        }),
      ),
  );
}
