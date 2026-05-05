import type { Metadata } from "next";
import { PageShell } from "@/components/ui/PageShell";
import { ProfileClient } from "@/components/profile/ProfileClient";
import { isSupabaseConfigured, storageUrl, calculatePayout } from "@/lib/supabase/helpers";
import { createClient, getUser } from "@/lib/supabase/server";
import { CURRENT_USER } from "@/lib/data/users";
import { DUMMY_PRODUCTS } from "@/lib/data/products";
import { DUMMY_REVIEWS, DUMMY_SOLD_ITEMS } from "@/lib/data/reviews";
import type { Product, User, Review, SoldListing, Condition, Category } from "@/types";

export const metadata: Metadata = { title: "Profil" };

export default async function ProfilePage() {
  let user: User = CURRENT_USER;
  let listings: Product[] = [];
  let soldItems: SoldListing[] = [];
  let reviews: Review[] = [];

  if (isSupabaseConfigured()) {
    const authUser = await getUser();

    if (authUser) {
      const supabase = await createClient();

      // Profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single() as { data: any };

      if (profile) {
        user = {
          id:            profile.id,
          username:      profile.username,
          displayName:   profile.display_name ?? profile.username,
          avatarUrl:     profile.avatar_url,
          rating:        4.8,
          totalSales:    0,
          totalListings: 0,
          memberSince:   profile.created_at,
          isVerified:    profile.is_verified,
          location:      profile.location ?? "Danmark",
          responseRate:  profile.response_rate ?? 100,
          bio:           profile.bio ?? undefined,
          city:          profile.city ?? undefined,
        };
      }

      // Active listings
      const { data: listingRows } = await supabase
        .from("products")
        .select("*, product_images(storage_path, position)")
        .eq("seller_id", authUser.id)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      listings = (listingRows ?? []).map((r: any) => {
        const imgs = (r.product_images ?? []).sort(
          (a: any, b: any) => a.position - b.position,
        );
        return {
          id:                  r.id,
          title:               r.title,
          brand:               r.brand,
          description:         r.description ?? "",
          price:               r.price,
          originalRetailPrice: r.original_retail_price ?? undefined,
          size:                r.size,
          condition:           r.condition as Condition,
          category:            r.category as Category,
          imageUrl:            storageUrl(imgs[0]?.storage_path ?? null),
          isDrop:              r.is_drop,
          isVerified:          r.is_verified,
          sellerId:            r.seller_id,
          createdAt:           r.created_at,
          views:               r.views,
          favorites:           0,
        };
      });

      user = { ...user, totalListings: listings.length };

      // Sold orders
      const { data: orderRows } = await supabase
        .from("orders")
        .select(`
          id, created_at,
          products(id, title, brand, price, condition, product_images(storage_path, position)),
          profiles!buyer_id(username)
        `)
        .eq("seller_id", authUser.id)
        .in("status", ["paid", "shipped", "delivered"])
        .order("created_at", { ascending: false });

      soldItems = (orderRows ?? []).map((o: any) => {
        const imgs = (o.products?.product_images ?? []).sort(
          (a: any, b: any) => a.position - b.position,
        );
        return {
          id:            o.id,
          product: {
            id:        o.products?.id ?? "",
            title:     o.products?.title ?? "",
            brand:     o.products?.brand ?? "",
            price:     o.products?.price ?? 0,
            condition: (o.products?.condition ?? "GOD") as Condition,
            imageUrl:  storageUrl(imgs[0]?.storage_path ?? null),
          },
          buyerUsername: (o as any)["profiles"]?.username ?? "anonym",
          soldAt:        o.created_at,
          payout:        calculatePayout(o.products?.price ?? 0),
        };
      });

      user = { ...user, totalSales: soldItems.length };

      // Reviews
      const { data: reviewRows } = await supabase
        .from("reviews")
        .select(`
          id, rating, text, created_at,
          profiles!author_id(username),
          products(title)
        `)
        .eq("subject_id", authUser.id)
        .order("created_at", { ascending: false });

      reviews = (reviewRows ?? []).map((r: any) => ({
        id:             r.id,
        authorId:       (r as any)["profiles"]?.id ?? "",
        authorUsername: (r as any)["profiles"]?.username ?? "anonym",
        rating:         r.rating,
        text:           r.text,
        createdAt:      r.created_at,
        productTitle:   r.products?.title ?? "",
      }));
    }
  } else {
    listings  = DUMMY_PRODUCTS.slice(0, 6);
    soldItems = DUMMY_SOLD_ITEMS;
    reviews   = DUMMY_REVIEWS;
  }

  return (
    <PageShell>
      <div className="max-w-[1400px] mx-auto px-6 py-10">
        <ProfileClient
          user={user}
          listings={listings}
          soldItems={soldItems}
          reviews={reviews}
        />
      </div>
    </PageShell>
  );
}
