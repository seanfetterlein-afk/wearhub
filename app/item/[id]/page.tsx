import { cache } from "react";
import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Eye, ChevronRight } from "lucide-react";
import { PageShell } from "@/components/ui/PageShell";
import { ConditionBadge, Badge } from "@/components/ui/Badge";
import { SellerCard } from "@/components/item/SellerCard";
import { ProductGrid } from "@/components/home/ProductGrid";
import { ItemActions } from "@/components/item/ItemActions";
import { ImageGallery } from "@/components/item/ImageGallery";
import { ItemDetails } from "@/components/item/ItemDetails";
import { isSupabaseConfigured, storageUrl } from "@/lib/supabase/helpers";
import { createClient, getUser } from "@/lib/supabase/server";
import { DUMMY_PRODUCTS } from "@/lib/data/products";
import { DUMMY_SELLERS } from "@/lib/data/users";
import { getUserFavoriteIds } from "@/lib/actions/favorites";
import { incrementViews } from "@/lib/actions/products";
import { formatPrice } from "@/lib/utils";
import type { Product, User, Condition, Category } from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

// Deduplicate the product DB fetch between generateMetadata and the page
// so Supabase is only called once per request, not twice.
const fetchProductRow = cache(async (id: string) => {
  const supabase = await createClient();
  return supabase
    .from("products")
    .select(`
      *,
      product_images(storage_path, position),
      profiles!seller_id(id, username, display_name, bio, location, avatar_url, is_verified, response_rate, created_at)
    `)
    .eq("id", id)
    .single() as Promise<{ data: any; error: any }>;
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  if (!isSupabaseConfigured()) {
    const p = DUMMY_PRODUCTS.find((p) => p.id === id);
    return p ? { title: `${p.brand} — ${p.title}` } : { title: "Item" };
  }
  const { data } = await fetchProductRow(id);
  return data ? { title: `${data.brand} — ${data.title}` } : { title: "Item" };
}

export default async function ItemPage({ params }: PageProps) {
  const { id } = await params;

  let product: Product | null = null;
  let seller: User | null = null;
  let initialSaved = false;

  if (isSupabaseConfigured()) {
    // Run product fetch + favorite check in parallel
    const [{ data: row }, favoriteIds] = await Promise.all([
      fetchProductRow(id),          // deduplicated with generateMetadata
      getUserFavoriteIds(),
    ]);

    if (!row || row.status !== "active") notFound();

    // Fire-and-forget — never block the render for a view count
    incrementViews(id).catch(() => {});

    const images = (row.product_images ?? [])
      .sort((a: any, b: any) => a.position - b.position);

    product = {
      id:                  row.id,
      title:               row.title,
      brand:               row.brand,
      description:         row.description ?? "",
      price:               row.price,
      originalRetailPrice: row.original_retail_price ?? undefined,
      size:                row.size,
      condition:           row.condition as Condition,
      category:            row.category as Category,
      imageUrl:            storageUrl(images[0]?.storage_path ?? null),
      images:              images.map((img: any) => storageUrl(img.storage_path)).filter(Boolean) as string[],
      isDrop:              row.is_drop,
      isVerified:          row.is_verified,
      sellerId:            row.seller_id,
      createdAt:           row.created_at,
      views:               row.views,
    };

    const p = row.profiles as any;
    seller = p ? {
      id:            p.id,
      username:      p.username,
      displayName:   p.display_name ?? p.username,
      avatarUrl:     p.avatar_url,
      rating:        4.8,
      totalSales:    0,
      totalListings: 0,
      memberSince:   p.created_at,
      isVerified:    p.is_verified,
      location:      p.location ?? "Danmark",
      responseRate:  p.response_rate,
      bio:           p.bio,
    } : null;

    initialSaved = favoriteIds.has(id);

  } else {
    product = DUMMY_PRODUCTS.find((p) => p.id === id) ?? null;
    if (!product) notFound();
    seller = DUMMY_SELLERS[product.sellerId] ?? null;
  }

  if (!product) notFound();

  return (
    <PageShell>
      <div className="max-w-[1400px] mx-auto px-6 py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 font-mono text-2xs tracking-wider text-ink-dim uppercase mb-8">
          <Link href="/shop" className="hover:text-ink transition-colors flex items-center gap-1">
            <ArrowLeft size={11} /> SHOP
          </Link>
          <ChevronRight size={11} />
          <span className="text-ink-mid">{product.category}</span>
          <ChevronRight size={11} />
          <span className="text-ink">{product.brand}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-12 xl:gap-16">
          {/* ── Left: Images ──────────────────────────────── */}
          <div className="flex flex-col gap-3">
            <div className="relative">
              <ImageGallery
                images={product.images ?? (product.imageUrl ? [product.imageUrl] : [])}
                title={product.title}
                productId={product.id}
              />
              {product.isDrop && (
                <div className="absolute top-4 left-4 z-10">
                  <Badge variant="brown">▲ DROP</Badge>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-ink-dim">
              <Eye size={12} />
              <span className="font-mono text-[10px] tracking-wider">{product.views ?? 0} visninger</span>
            </div>
          </div>

          {/* ── Right: Details ─────────────────────────────── */}
          <div className="flex flex-col gap-6">
            <div>
              <p className="font-mono text-2xs tracking-widest text-ink-dim uppercase mb-1">{product.brand}</p>
              <h1
                className="font-display font-semibold text-ink leading-tight"
                style={{ fontSize: "clamp(24px, 3vw, 36px)", letterSpacing: "-0.02em" }}
              >
                {product.title}
              </h1>
            </div>

            <div className="flex items-baseline gap-4">
              <span style={{ fontFamily: "var(--font-bebas-neue)", fontSize: 48, letterSpacing: "0.02em" }}>
                {formatPrice(product.price)}
              </span>
              {product.originalRetailPrice && (
                <span className="font-mono text-sm text-ink-dim line-through">
                  Retail: {formatPrice(product.originalRetailPrice)}
                </span>
              )}
            </div>

            <ItemDetails>
              <div className="flex flex-wrap gap-2">
                <MetaChip label="Størrelse" value={product.size} />
                <MetaChip label="Stand" value={<ConditionBadge condition={product.condition} />} />
                <MetaChip label="Kategori" value={product.category} />
              </div>

              {product.isVerified && (
                <div className="flex items-center gap-2 bg-cream border border-brown/15 px-4 py-2.5">
                  <ShieldCheck size={16} className="text-brown shrink-0" />
                  <div>
                    <p className="font-mono text-[10px] tracking-widest text-brown uppercase font-bold">Verificeret af Nord Studios</p>
                    <p className="text-ink-dim text-xs mt-0.5">Autentificitet bekræftet. Penge frigives efter levering.</p>
                  </div>
                </div>
              )}

              <div className="border-t border-brown/10 pt-4">
                <p className="font-mono text-2xs tracking-widest text-ink-dim uppercase mb-2">BESKRIVELSE</p>
                <p className="text-ink-mid text-sm leading-relaxed">{product.description}</p>
              </div>

              <ItemActions product={product} initialSaved={initialSaved} />

              <p className="font-mono text-[10px] tracking-wider text-ink-dim border-t border-brown/10 pt-3">
                Sikker betaling via Stripe · Pengene frigives ved levering · Returfrist 3 dage
              </p>

              {seller && <SellerCard seller={seller} />}
            </ItemDetails>
          </div>
        </div>

        {/* Related — deferred, doesn't block above-the-fold content */}
        {isSupabaseConfigured() && (
          <Suspense fallback={<RelatedSkeleton />}>
            <RelatedItems productId={id} category={product.category} brand={product.brand} />
          </Suspense>
        )}
      </div>
    </PageShell>
  );
}

// Streams in after the main content without blocking it
async function RelatedItems({
  productId,
  category,
  brand,
}: {
  productId: string;
  category: string;
  brand: string;
}) {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("products")
    .select("*, product_images(storage_path, position)")
    .eq("status", "active")
    .neq("id", productId)
    .or(`category.eq.${category},brand.eq.${brand}`)
    .limit(4);

  const related: Product[] = (rows ?? []).map((r: any) => {
    const imgs = (r.product_images ?? []).sort((a: any, b: any) => a.position - b.position);
    return {
      id: r.id, title: r.title, brand: r.brand, description: r.description ?? "",
      price: r.price, size: r.size, condition: r.condition as Condition,
      category: r.category as Category,
      imageUrl: storageUrl(imgs[0]?.storage_path ?? null),
      isDrop: r.is_drop, isVerified: r.is_verified, sellerId: r.seller_id,
      createdAt: r.created_at, views: r.views, favorites: 0,
    };
  });

  if (related.length === 0) return null;

  return (
    <div className="mt-20 pt-12 border-t border-brown/20">
      <div className="flex items-end justify-between mb-7 pb-5 border-b border-brown/20">
        <div>
          <p className="font-mono text-2xs tracking-editorial text-ink-dim uppercase mb-1">MÅSKE OGSÅ</p>
          <h2
            className="font-display font-semibold text-brown leading-none"
            style={{ fontSize: "clamp(28px, 3vw, 42px)", letterSpacing: "-0.03em" }}
          >
            LIGNENDE ITEMS
          </h2>
        </div>
        <Link href="/shop" className="font-mono text-[11px] tracking-widest text-ink-mid hover:text-brown uppercase">
          SE ALLE →
        </Link>
      </div>
      <ProductGrid products={related} />
    </div>
  );
}

function RelatedSkeleton() {
  return (
    <div className="mt-20 pt-12 border-t border-brown/20 animate-pulse">
      <div className="h-8 w-48 bg-[#EEECE8] rounded mb-8" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-5 gap-y-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="aspect-[3/4] bg-[#EEECE8]" />
            <div className="h-3 w-3/4 bg-[#EEECE8] rounded" />
            <div className="h-3 w-1/2 bg-[#EEECE8] rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

function MetaChip({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border border-brown/15 px-3 py-2 min-w-[80px]">
      <p className="font-mono text-[9px] tracking-widest text-ink-dim uppercase mb-0.5">{label}</p>
      <div className="font-body text-sm font-medium text-ink">{value}</div>
    </div>
  );
}
