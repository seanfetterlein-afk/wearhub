"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { SlidersHorizontal, ArrowUpDown, X } from "lucide-react";
import { FilterPanel } from "./FilterPanel";
import { ProductGrid } from "@/components/home/ProductGrid";
import { formatPrice } from "@/lib/utils";
import type { ShopFilters, SortOption, Product } from "@/types";

interface ShopClientProps {
  products: Product[];
  totalCount: number;
  currentFilters: Partial<ShopFilters>;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest",     label: "Nyeste" },
  { value: "price_asc",  label: "Pris: lav → høj" },
  { value: "price_desc", label: "Pris: høj → lav" },
  { value: "popular",    label: "Populære" },
];

export function ShopClient({ products, totalCount, currentFilters }: ShopClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [, startTransition] = useTransition();

  const filters: ShopFilters = {
    category:  currentFilters.category  ?? "ALL",
    condition: currentFilters.condition ?? "ALL",
    brand:     currentFilters.brand     ?? "ALL",
    size:      currentFilters.size      ?? "ALL",
    priceMin:  currentFilters.priceMin  ?? null,
    priceMax:  currentFilters.priceMax  ?? null,
    sort:      currentFilters.sort      ?? "newest",
  };

  const updateFilters = (next: ShopFilters) => {
    const params = new URLSearchParams();
    if (next.category  !== "ALL")  params.set("category",  next.category);
    if (next.condition !== "ALL")  params.set("condition", next.condition);
    if (next.brand     !== "ALL")  params.set("brand",     next.brand);
    if (next.size      !== "ALL")  params.set("size",      next.size);
    if (next.priceMin  !== null)   params.set("priceMin",  String(next.priceMin));
    if (next.priceMax  !== null)   params.set("priceMax",  String(next.priceMax));
    if (next.sort      !== "newest") params.set("sort",    next.sort);

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const activeCount = [
    filters.category  !== "ALL",
    filters.condition !== "ALL",
    filters.brand     !== "ALL",
    filters.size      !== "ALL",
    filters.priceMin !== null || filters.priceMax !== null,
  ].filter(Boolean).length;

  const clearAll = () => updateFilters({
    category: "ALL", condition: "ALL", brand: "ALL",
    size: "ALL", priceMin: null, priceMax: null, sort: filters.sort,
  });

  return (
    <>
      {/* Mobile drawer */}
      {drawerOpen && (
        <FilterPanel
          filters={filters}
          onChange={(f) => { updateFilters(f); setDrawerOpen(false); }}
          isDrawer
          onClose={() => setDrawerOpen(false)}
        />
      )}

      {/* Page header */}
      <div className="border-b border-brown/20 bg-paper">
        <div className="max-w-[1400px] mx-auto px-6 py-6">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <p className="font-mono text-2xs tracking-editorial text-ink-dim uppercase mb-1">SECTION / 00</p>
              <h1
                className="font-display font-semibold text-brown leading-none"
                style={{ fontSize: "clamp(28px, 4vw, 48px)", letterSpacing: "-0.03em" }}
              >
                SHOP
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {/* Mobile filter toggle */}
              <button
                onClick={() => setDrawerOpen(true)}
                className="lg:hidden flex items-center gap-2 border border-brown/30 px-3 h-9 font-mono text-[11px] tracking-wider text-ink-mid hover:border-brown transition-colors"
              >
                <SlidersHorizontal size={13} />
                FILTRÉR
                {activeCount > 0 && (
                  <span className="bg-brown text-cream text-[9px] font-mono px-1.5 py-0.5 leading-none">
                    {activeCount}
                  </span>
                )}
              </button>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <ArrowUpDown size={13} className="text-ink-dim" />
                <select
                  value={filters.sort}
                  onChange={(e) => updateFilters({ ...filters, sort: e.target.value as SortOption })}
                  className="bg-transparent border border-brown/20 px-3 h-9 font-mono text-[11px] tracking-wider text-ink-mid appearance-none outline-none focus:border-brown/50"
                >
                  {SORT_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Active filter chips */}
          {activeCount > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {filters.category  !== "ALL" && <Chip label={filters.category}  onRemove={() => updateFilters({ ...filters, category: "ALL" })} />}
              {filters.condition !== "ALL" && <Chip label={filters.condition} onRemove={() => updateFilters({ ...filters, condition: "ALL" })} />}
              {filters.brand     !== "ALL" && <Chip label={filters.brand}     onRemove={() => updateFilters({ ...filters, brand: "ALL" })} />}
              {filters.size      !== "ALL" && <Chip label={`SZ ${filters.size}`} onRemove={() => updateFilters({ ...filters, size: "ALL" })} />}
              {(filters.priceMin !== null || filters.priceMax !== null) && (
                <Chip
                  label={
                    filters.priceMin && filters.priceMax
                      ? `${formatPrice(filters.priceMin)} – ${formatPrice(filters.priceMax)}`
                      : filters.priceMax ? `Under ${formatPrice(filters.priceMax)}`
                      : `Over ${formatPrice(filters.priceMin!)}`
                  }
                  onRemove={() => updateFilters({ ...filters, priceMin: null, priceMax: null })}
                />
              )}
              <button onClick={clearAll} className="font-mono text-[10px] tracking-wider text-ink-dim hover:text-brown uppercase underline underline-offset-2">
                NULSTIL ALLE
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="flex gap-10 items-start">
          {/* Desktop sidebar */}
          <div className="hidden lg:block">
            <FilterPanel filters={filters} onChange={updateFilters} />
          </div>

          {/* Grid */}
          <div className="flex-1 min-w-0">
            <p className="font-mono text-2xs tracking-widest text-ink-dim mb-5 uppercase">
              {totalCount} ITEM{totalCount !== 1 ? "S" : ""}
            </p>
            {products.length === 0 ? (
              <div className="py-24 text-center">
                <p className="font-mono text-2xs tracking-editorial text-ink-dim uppercase mb-3">INGEN RESULTATER</p>
                <p className="font-display font-semibold text-brown" style={{ fontSize: "clamp(28px, 4vw, 48px)", letterSpacing: "-0.03em" }}>
                  INGEN ITEMS
                </p>
                <p className="text-ink-mid text-sm mt-3">Prøv at ændre dine filtre.</p>
                <button onClick={clearAll} className="mt-5 font-mono text-[11px] tracking-wider text-brown underline underline-offset-2 uppercase">
                  Nulstil filtre
                </button>
              </div>
            ) : (
              <ProductGrid products={products} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 border border-brown/30 bg-cream px-2.5 py-1 font-mono text-[10px] tracking-wider text-brown uppercase">
      {label}
      <button onClick={onRemove} className="hover:text-brown-deep"><X size={10} /></button>
    </span>
  );
}
