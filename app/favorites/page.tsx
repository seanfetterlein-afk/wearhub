import type { Metadata } from "next";
import { PageShell } from "@/components/ui/PageShell";
import { FavoritesClient } from "@/components/favorites/FavoritesClient";
import { isSupabaseConfigured, storageUrl } from "@/lib/supabase/helpers";
import { createClient, getUser } from "@/lib/supabase/server";
import { DUMMY_PRODUCTS } from "@/lib/data/products";
import type { Product, Condition, Category } from "@/types";

export const metadata: Metadata = { title: "Favoritter" };

export default async function FavoritesPage() {
  let products: Product[] = [];

  if (isSupabaseConfigured()) {
    const user = await getUser();

    if (user) {
      const supabase = await createClient();

      const { data: favRows } = await supabase
        .from("favorites")
        .select("product_id, products(*, product_images(storage_path, position))")
        .eq("user_id", user.id);

      products = (favRows ?? [])
        .map((f) => (f as any).products)
        .filter(Boolean)
        .map((row: any) => ({
          id:                  row.id,
          title:               row.title,
          brand:               row.brand,
          description:         row.description ?? "",
          price:               row.price,
          originalRetailPrice: row.original_retail_price ?? undefined,
          size:                row.size,
          condition:           row.condition as Condition,
          category:            row.category as Category,
          imageUrl:            storageUrl(row.product_images?.[0]?.storage_path ?? null),
          isDrop:              row.is_drop,
          isVerified:          row.is_verified,
          sellerId:            row.seller_id,
          createdAt:           row.created_at,
          views:               row.views,
        }));
    }
  } else {
    products = DUMMY_PRODUCTS.slice(0, 4);
  }

  return (
    <PageShell>
      <div className="max-w-[1400px] mx-auto px-6 py-10">
        <FavoritesClient initialProducts={products} />
      </div>
    </PageShell>
  );
}
