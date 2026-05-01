import { PageShell } from "@/components/ui/PageShell";
import { Hero } from "@/components/home/Hero";
import { ProductGrid } from "@/components/home/ProductGrid";
import { isSupabaseConfigured, storageUrl } from "@/lib/supabase/helpers";
import { createClient } from "@/lib/supabase/server";
import { DUMMY_PRODUCTS } from "@/lib/data/products";
import type { Product, Condition, Category } from "@/types";

export default async function HomePage() {
  let products: Product[] = [];

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data: rows } = await supabase
      .from("products")
      .select("*, product_images(storage_path, position), favorites(count)")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(24);

    products = (rows ?? []).map((row: any) => ({
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
      favorites:           (row.favorites?.[0] as any)?.count ?? 0,
    }));
  } else {
    products = DUMMY_PRODUCTS;
  }

  return (
    <PageShell>
      <section className="max-w-[1400px] mx-auto px-6 md:px-12 pt-4 pb-20">
        <ProductGrid products={products.slice(0, 8)} />
      </section>
      <Hero />
    </PageShell>
  );
}
