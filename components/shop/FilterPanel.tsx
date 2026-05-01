"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ALL_BRANDS, ALL_SIZES } from "@/lib/data/products";
import type { ShopFilters, Category, Condition } from "@/types";

const CATEGORIES: { value: Category | "ALL"; label: string }[] = [
  { value: "ALL",         label: "Alle kategorier" },
  { value: "T-Shirts",    label: "T-Shirts" },
  { value: "Hoodies",     label: "Hoodies" },
  { value: "Bukser",      label: "Bukser" },
  { value: "Sneakers",    label: "Sneakers" },
  { value: "Outerwear",   label: "Outerwear" },
  { value: "Tasker",      label: "Tasker" },
  { value: "Caps",        label: "Caps" },
];

const CONDITIONS: { value: Condition | "ALL"; label: string }[] = [
  { value: "ALL",    label: "Alle stande" },
  { value: "NY",     label: "Ny" },
  { value: "SOM NY", label: "Som ny" },
  { value: "GOD",    label: "God" },
  { value: "BRUGT",  label: "Brugt" },
];

const PRICE_RANGES = [
  { label: "Alle priser",   min: null, max: null },
  { label: "Under 500 kr",  min: null, max: 500 },
  { label: "500–1.000 kr",  min: 500,  max: 1000 },
  { label: "1.000–2.000 kr",min: 1000, max: 2000 },
  { label: "2.000–5.000 kr",min: 2000, max: 5000 },
  { label: "Over 5.000 kr", min: 5000, max: null },
];

interface FilterPanelProps {
  filters: ShopFilters;
  onChange: (filters: ShopFilters) => void;
  /** Mobile: show as overlay */
  isDrawer?: boolean;
  onClose?: () => void;
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-brown/15 py-4">
      <p className="font-mono text-2xs tracking-widest text-ink-dim uppercase mb-3">{title}</p>
      {children}
    </div>
  );
}

function FilterOption({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-0 py-1 font-body text-sm transition-colors",
        active ? "text-brown font-semibold" : "text-ink-mid hover:text-ink",
      )}
    >
      {active && <span className="mr-1.5 text-brown">▸</span>}
      {children}
    </button>
  );
}

export function FilterPanel({ filters, onChange, isDrawer, onClose }: FilterPanelProps) {
  const set = <K extends keyof ShopFilters>(key: K, value: ShopFilters[K]) =>
    onChange({ ...filters, [key]: value });

  const activePriceLabel = PRICE_RANGES.find(
    (r) => r.min === filters.priceMin && r.max === filters.priceMax,
  )?.label ?? "Alle priser";

  return (
    <aside
      className={cn(
        "bg-paper",
        isDrawer
          ? "fixed inset-0 z-50 overflow-y-auto p-6 pt-4"
          : "w-56 shrink-0",
      )}
    >
      {isDrawer && (
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-brown/20">
          <span className="font-mono text-[11px] tracking-widest uppercase text-ink">FILTRÉR</span>
          <button onClick={onClose} className="text-ink-mid hover:text-ink p-1">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Category */}
      <FilterSection title="Kategori">
        <div className="flex flex-col">
          {CATEGORIES.map(({ value, label }) => (
            <FilterOption
              key={value}
              active={filters.category === value}
              onClick={() => set("category", value)}
            >
              {label}
            </FilterOption>
          ))}
        </div>
      </FilterSection>

      {/* Condition */}
      <FilterSection title="Stand">
        <div className="flex flex-col">
          {CONDITIONS.map(({ value, label }) => (
            <FilterOption
              key={value}
              active={filters.condition === value}
              onClick={() => set("condition", value)}
            >
              {label}
            </FilterOption>
          ))}
        </div>
      </FilterSection>

      {/* Brand */}
      <FilterSection title="Brand">
        <div className="flex flex-col max-h-44 overflow-y-auto pr-1">
          <FilterOption
            active={filters.brand === "ALL"}
            onClick={() => set("brand", "ALL")}
          >
            Alle brands
          </FilterOption>
          {ALL_BRANDS.map((brand) => (
            <FilterOption
              key={brand}
              active={filters.brand === brand}
              onClick={() => set("brand", brand)}
            >
              {brand}
            </FilterOption>
          ))}
        </div>
      </FilterSection>

      {/* Size */}
      <FilterSection title="Størrelse">
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => set("size", "ALL")}
            className={cn(
              "border px-2 py-1 font-mono text-[10px] tracking-wide transition-colors",
              filters.size === "ALL"
                ? "border-brown bg-brown text-cream"
                : "border-brown/20 text-ink-dim hover:border-brown/50",
            )}
          >
            ALLE
          </button>
          {ALL_SIZES.map((size) => (
            <button
              key={size}
              onClick={() => set("size", size)}
              className={cn(
                "border px-2 py-1 font-mono text-[10px] tracking-wide transition-colors",
                filters.size === size
                  ? "border-brown bg-brown text-cream"
                  : "border-brown/20 text-ink-dim hover:border-brown/50",
              )}
            >
              {size}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Price */}
      <FilterSection title="Pris">
        <div className="flex flex-col">
          {PRICE_RANGES.map(({ label, min, max }) => (
            <FilterOption
              key={label}
              active={activePriceLabel === label}
              onClick={() => onChange({ ...filters, priceMin: min, priceMax: max })}
            >
              {label}
            </FilterOption>
          ))}
        </div>
      </FilterSection>

      {isDrawer && (
        <button
          onClick={onClose}
          className="mt-6 w-full h-12 bg-brown text-cream font-body font-semibold text-sm tracking-wider uppercase"
        >
          VIS RESULTATER
        </button>
      )}
    </aside>
  );
}
