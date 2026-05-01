"use server";

import { revalidatePath } from "next/cache";
import { createClient, getUser } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/push";
import { createNotification } from "@/lib/notifications";

/** Toggle favorite on/off. Returns new saved state. */
export async function toggleFavorite(
  productId: string,
): Promise<{ saved: boolean; error?: string }> {
  const user = await getUser();
  if (!user) return { saved: false, error: "Log ind for at gemme favorites." };

  const supabase = await createClient();

  // Check existing
  const { data: existing } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .maybeSingle() as { data: any };

  if (existing) {
    await supabase.from("favorites").delete().eq("id", existing.id);
    revalidatePath("/favorites");
    return { saved: false };
  } else {
    await (supabase.from("favorites") as any).insert({ user_id: user.id, product_id: productId });

    // Notify seller
    const { data: product } = await (supabase.from("products") as any)
      .select("seller_id, title")
      .eq("id", productId)
      .single();
    if (product && product.seller_id !== user.id) {
      createNotification({
        userId:        product.seller_id,
        type:          "listing_favorited",
        title:         "Ny favorit",
        body:          `Nogen har gemt din annonce: ${product.title}`,
        listingId:     productId,
        relatedUserId: user.id,
      }).catch(() => {});
      sendPushToUser(product.seller_id, {
        title: "Ny favorit",
        body:  `Nogen har gemt din annonce: ${product.title}`,
        url:   `/item/${productId}`,
      }).catch(() => {});
    }

    revalidatePath("/favorites");
    return { saved: true };
  }
}

/** Returns set of product IDs that the current user has favorited. */
export async function getUserFavoriteIds(): Promise<Set<string>> {
  const user = await getUser();
  if (!user) return new Set();

  const supabase = await createClient();
  const { data } = await supabase
    .from("favorites")
    .select("product_id")
    .eq("user_id", user.id);

  return new Set((data ?? []).map((f: any) => f.product_id));
}
