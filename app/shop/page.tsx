import type { Metadata } from "next";
import { PageShell } from "@/components/ui/PageShell";
import { ShopClient } from "@/components/shop/ShopClient";
import { isSupabaseConfigured } from "@/lib/supabase/helpers";
import { createClient } from "@/lib/supabase/server";
import { DUMMY_PRODUCTS } from "@/lib/data/products";
import type { ShopFilters, Product, Condition, Category } from "@/types";

export const metadata: Metadata = { title: "Shop" };

interface ShopPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;

  const q   = params.q?.trim()   || "";
  const tag = params.tag?.trim() || "";

  const STREETWEAR_BRANDS = [
    "supreme", "carhartt", "stüssy", "stussy", "nike", "palace",
    "adidas", "bape", "off-white", "stone island", "a-cold-wall", "corteiz",
  ];

  const filters: Partial<ShopFilters> = {
    category:  (params.category  as Category)  || "ALL",
    condition: (params.condition as Condition) || "ALL",
    brand:     params.brand   || "ALL",
    size:      params.size    || "ALL",
    priceMin:  params.priceMin  ? parseInt(params.priceMin)  : null,
    priceMax:  params.priceMax  ? parseInt(params.priceMax)  : null,
    sort:      (params.sort as ShopFilters["sort"]) || "newest",
  };

  let products: Product[] = [];
  let totalCount = 0;

  if (isSupabaseConfigured()) {
    // ── Server-side Supabase query ──────────────────────────────────────────
    const supabase = await createClient();
    let query = supabase
      .from("products")
      .select("*, product_images(storage_path, position), favorites(count)", { count: "exact" })
      .eq("status", "active");

    if (q)   query = query.or(`title.ilike.%${q}%,brand.ilike.%${q}%`);
    if (tag === "streetwear") {
      const conditions = STREETWEAR_BRANDS.map((b) => `brand.ilike.%${b}%`).join(",");
      query = query.or(conditions);
    }
    if (filters.category  && filters.category  !== "ALL") query = query.eq("category",  filters.category);
    if (filters.condition && filters.condition !== "ALL") query = query.eq("condition", filters.condition);
    if (filters.brand     && filters.brand     !== "ALL") query = query.eq("brand",     filters.brand);
    if (filters.size      && filters.size      !== "ALL") query = query.ilike("size", `%${filters.size}%`);
    if (filters.priceMin  !== null && filters.priceMin !== undefined)  query = query.gte("price", filters.priceMin);
    if (filters.priceMax  !== null && filters.priceMax !== undefined)  query = query.lte("price", filters.priceMax);

    switch (filters.sort) {
      case "price_asc":  query = query.order("price",      { ascending: true });  break;
      case "price_desc": query = query.order("price",      { ascending: false }); break;
      case "popular":    query = query.order("views",      { ascending: false }); break;
      default:           query = query.order("created_at", { ascending: false }); break;
    }

    const { data, count } = await query;
    totalCount = count ?? 0;

    // Map Supabase rows → shared Product type
    products = (data ?? []).map((row: any) => ({
      id:                  row.id,
      title:               row.title,
      brand:               row.brand,
      description:         row.description ?? "",
      price:               row.price,
      originalRetailPrice: row.original_retail_price ?? undefined,
      size:                row.size,
      condition:           row.condition as Condition,
      category:            row.category as Category,
      imageUrl:            row.product_images?.[0]?.storage_path
        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${row.product_images[0].storage_path}`
        : null,
      isDrop:      row.is_drop,
      isVerified:  row.is_verified,
      sellerId:    row.seller_id,
      createdAt:   row.created_at,
      views:       row.views,
      favorites:   (row.favorites?.[0] as any)?.count ?? 0,
    }));
  } else {
    // ── Fallback: in-memory dummy data ──────────────────────────────────────
    let result = [...DUMMY_PRODUCTS];
    if (q)   result = result.filter((p) => p.title.toLowerCase().includes(q.toLowerCase()) || p.brand.toLowerCase().includes(q.toLowerCase()));
    if (tag === "streetwear") result = result.filter((p) =>
      STREETWEAR_BRANDS.some((b) =>
        p.brand.toLowerCase().includes(b) ||
        p.title.toLowerCase().includes(b) ||
        (p.description ?? "").toLowerCase().includes(b),
      ),
    );
    if (filters.category  && filters.category  !== "ALL") result = result.filter(p => p.category  === filters.category);
    if (filters.condition && filters.condition !== "ALL") result = result.filter(p => p.condition === filters.condition);
    if (filters.brand     && filters.brand     !== "ALL") result = result.filter(p => p.brand     === filters.brand);
    if (filters.size      && filters.size      !== "ALL") result = result.filter(p => p.size.includes(filters.size!));
    if (filters.priceMin  !== null && filters.priceMin !== undefined) result = result.filter(p => p.price >= filters.priceMin!);
    if (filters.priceMax  !== null && filters.priceMax !== undefined) result = result.filter(p => p.price <= filters.priceMax!);

    switch (filters.sort) {
      case "price_asc":  result.sort((a, b) => a.price - b.price); break;
      case "price_desc": result.sort((a, b) => b.price - a.price); break;
      case "popular":    result.sort((a, b) => {
        const score = (p: typeof a) => (p.favorites ?? 0) * 0.5 + (p.views ?? 0) * 0.3;
        return score(b) - score(a);
      }); break;
      default:           result.sort((a, b) => b.createdAt.localeCompare(a.createdAt)); break;
    }

    products   = result;
    totalCount = result.length;
  }

  return (
    <PageShell>
      <ShopClient
        products={products}
        totalCount={totalCount}
        currentFilters={filters}
      />
    </PageShell>
  );
}
