import type { Metadata } from "next";
import { PageShell } from "@/components/ui/PageShell";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { isSupabaseConfigured, storageUrl, calculatePayout } from "@/lib/supabase/helpers";
import { createClient, getUser } from "@/lib/supabase/server";
import { DUMMY_PRODUCTS } from "@/lib/data/products";
import { DUMMY_SOLD_ITEMS } from "@/lib/data/reviews";
import type { Product, SoldListing, Condition, Category } from "@/types";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  let activeListings: Product[] = [];
  let soldItems: SoldListing[] = [];
  let draftCount = 0;
  let totalViews = 0;

  if (isSupabaseConfigured()) {
    const user = await getUser();

    if (user) {
      const supabase = await createClient();

      const { data: activeRows } = await supabase
        .from("products")
        .select("*, product_images(storage_path, position)")
        .eq("seller_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      activeListings = (activeRows ?? []).map((r: any) => ({
        id:                  r.id,
        title:               r.title,
        brand:               r.brand,
        description:         r.description ?? "",
        price:               r.price,
        originalRetailPrice: r.original_retail_price ?? undefined,
        size:                r.size,
        condition:           r.condition as Condition,
        category:            r.category as Category,
        imageUrl:            storageUrl(r.product_images?.[0]?.storage_path ?? null),
        isDrop:              r.is_drop,
        isVerified:          r.is_verified,
        sellerId:            r.seller_id,
        createdAt:           r.created_at,
        views:               r.views,
      }));

      totalViews = activeListings.reduce((s, p) => s + (p.views ?? 0), 0);

      const { count: drafts } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("seller_id", user.id)
        .eq("status", "draft");
      draftCount = drafts ?? 0;

      const { data: orderRows } = await supabase
        .from("orders")
        .select(`
          id, created_at,
          products(id, title, brand, price, condition, product_images(storage_path, position)),
          profiles!buyer_id(username)
        `)
        .eq("seller_id", user.id)
        .eq("status", "delivered")
        .order("created_at", { ascending: false });

      soldItems = (orderRows ?? []).map((o: any) => ({
        id:      o.id,
        product: {
          id:        o.products.id,
          title:     o.products.title,
          brand:     o.products.brand,
          price:     o.products.price,
          condition: o.products.condition as Condition,
          imageUrl:  storageUrl(o.products.product_images?.[0]?.storage_path ?? null),
        },
        buyerUsername: o.profiles?.username ?? "anonym",
        soldAt:        o.created_at,
        payout:        calculatePayout(o.products.price),
      }));
    }
  } else {
    activeListings = DUMMY_PRODUCTS;
    soldItems      = DUMMY_SOLD_ITEMS;
    draftCount     = 2;
    totalViews     = DUMMY_PRODUCTS.reduce((s, p) => s + (p.views ?? 0), 0);
  }

  return (
    <PageShell>
      <div className="max-w-[1400px] mx-auto px-6 py-10">
        <DashboardClient
          activeListings={activeListings}
          soldItems={soldItems}
          draftCount={draftCount}
          totalViews={totalViews}
        />
      </div>
    </PageShell>
  );
}
