"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  Package,
  DollarSign,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { Tabs } from "@/components/ui/Tabs";
import { ConditionBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { deleteListing } from "@/lib/actions/products";
import { isSupabaseConfigured } from "@/lib/supabase/helpers";
import { formatPrice } from "@/lib/utils";
import type { Product, SoldListing } from "@/types";

interface Props {
  activeListings: Product[];
  soldItems: SoldListing[];
  draftCount: number;
  totalViews: number;
}

export function DashboardClient({ activeListings, soldItems, draftCount, totalViews }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState("active");
  const [listings, setListings] = useState(activeListings);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const totalPayout = soldItems.reduce((s, i) => s + i.payout, 0);

  const stats = [
    {
      icon:  Package,
      label: "Aktive listings",
      value: String(listings.length),
      sub:   "Dine aktive annoncer",
      trend: "neutral" as const,
    },
    {
      icon:  TrendingUp,
      label: "Solgte items",
      value: String(soldItems.length),
      sub:   "Alle tider",
      trend: soldItems.length > 0 ? ("up" as const) : ("neutral" as const),
    },
    {
      icon:  DollarSign,
      label: "Total udbetalt",
      value: formatPrice(totalPayout),
      sub:   "Efter provision (6%)",
      trend: totalPayout > 0 ? ("up" as const) : ("neutral" as const),
    },
    {
      icon:  Eye,
      label: "Visninger",
      value: String(totalViews),
      sub:   "På aktive listings",
      trend: "neutral" as const,
    },
  ];

  const tabs = [
    { key: "active", label: "Aktive",  count: listings.length },
    { key: "sold",   label: "Solgt",   count: soldItems.length },
    { key: "drafts", label: "Kladder", count: draftCount },
  ];

  const handleDelete = (id: string) => {
    if (!confirm("Er du sikker på, at du vil slette denne annonce?")) return;

    if (!isSupabaseConfigured()) {
      setListings((ls) => ls.filter((l) => l.id !== id));
      return;
    }

    setDeleting(id);
    startTransition(async () => {
      await deleteListing(id);
      setListings((ls) => ls.filter((l) => l.id !== id));
      setDeleting(null);
      router.refresh();
    });
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
        <div>
          <p className="font-mono text-2xs tracking-editorial text-ink-dim uppercase mb-1">
            SÆLGER DASHBOARD
          </p>
          <h1
            className="font-display font-semibold text-brown leading-none"
            style={{ fontSize: "clamp(28px, 4vw, 48px)", letterSpacing: "-0.03em" }}
          >
            OVERSIGT
          </h1>
        </div>
        <Button size="md" asChild>
          <Link href="/sell">+ NY ANNONCE</Link>
        </Button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 border border-brown/20 divide-x divide-brown/20 mb-10 overflow-hidden">
        {stats.map(({ icon: Icon, label, value, sub, trend }) => (
          <div key={label} className="p-5 sm:p-6 relative">
            <div className="flex items-center justify-between mb-3">
              <Icon size={16} className="text-ink-dim" />
              {trend === "up" && (
                <span className="font-mono text-[9px] tracking-wider text-brown uppercase bg-cream px-1.5 py-0.5">
                  ↑ STIGER
                </span>
              )}
            </div>
            <div
              className="font-display font-semibold text-brown"
              style={{
                fontSize: "clamp(22px, 3vw, 32px)",
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}
            >
              {value}
            </div>
            <p className="font-mono text-[9px] tracking-widest text-ink-dim uppercase mt-1.5">
              {label}
            </p>
            {sub && <p className="font-mono text-[9px] text-ink-dim mt-0.5">{sub}</p>}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} active={tab} onChange={setTab} className="mb-6" />

      {/* Active listings */}
      {tab === "active" && (
        <div className="border border-brown/20 overflow-hidden">
          <div className="hidden sm:grid grid-cols-[1fr_80px_100px_100px_80px] gap-4 px-5 py-3 bg-cream border-b border-brown/15">
            {["ITEM", "STAND", "PRIS", "VISNINGER", ""].map((h) => (
              <span
                key={h}
                className="font-mono text-[9px] tracking-widest text-ink-dim uppercase"
              >
                {h}
              </span>
            ))}
          </div>
          {listings.length === 0 && (
            <div className="py-12 text-center">
              <p className="font-mono text-2xs tracking-editorial text-ink-dim uppercase mb-3">
                INGEN AKTIVE LISTINGS
              </p>
              <Link
                href="/sell"
                className="font-mono text-[11px] tracking-wider text-brown underline underline-offset-2 uppercase"
              >
                + OPRET DIN FØRSTE ANNONCE
              </Link>
            </div>
          )}
          {listings.map((product, i) => (
            <div
              key={product.id}
              className={`flex sm:grid sm:grid-cols-[1fr_80px_100px_100px_80px] items-center gap-4 px-5 py-4 flex-wrap ${
                i > 0 ? "border-t border-brown/10" : ""
              } ${deleting === product.id ? "opacity-40 pointer-events-none" : ""}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 bg-cream-deep border border-brown/10 shrink-0">
                  {product.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-mono text-[9px] tracking-widest text-ink-dim uppercase truncate">
                    {product.brand}
                  </p>
                  <p className="font-body text-sm font-medium text-ink truncate">
                    {product.title}
                  </p>
                  <p className="font-mono text-[9px] text-ink-dim mt-0.5">
                    {product.size}
                  </p>
                </div>
              </div>

              <ConditionBadge condition={product.condition} />

              <span
                className="font-display font-semibold text-brown"
                style={{ fontSize: 15, letterSpacing: "-0.01em" }}
              >
                {formatPrice(product.price)}
              </span>

              <span className="font-mono text-[11px] text-ink-dim">
                {product.views ?? 0}
              </span>

              <div className="flex items-center gap-1 ml-auto sm:ml-0">
                <Link
                  href={`/item/${product.id}`}
                  className="w-7 h-7 flex items-center justify-center text-ink-dim hover:text-ink transition-colors"
                  title="Se listing"
                >
                  <Eye size={13} />
                </Link>
                <button
                  className="w-7 h-7 flex items-center justify-center text-ink-dim hover:text-ink transition-colors"
                  title="Rediger"
                  onClick={() => alert("Rediger listing (tilsluttes)")}
                >
                  <Edit size={13} />
                </button>
                <button
                  className="w-7 h-7 flex items-center justify-center text-ink-dim hover:text-red-500 transition-colors"
                  title="Slet"
                  onClick={() => handleDelete(product.id)}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sold */}
      {tab === "sold" && (
        <div className="border border-brown/20 overflow-hidden">
          <div className="hidden sm:grid grid-cols-[1fr_100px_100px_100px] gap-4 px-5 py-3 bg-cream border-b border-brown/15">
            {["ITEM", "SOLGT TIL", "PRIS", "UDBETALT"].map((h) => (
              <span
                key={h}
                className="font-mono text-[9px] tracking-widest text-ink-dim uppercase"
              >
                {h}
              </span>
            ))}
          </div>
          {soldItems.length === 0 && (
            <div className="py-12 text-center">
              <p className="font-mono text-2xs tracking-editorial text-ink-dim uppercase">
                INGEN SALG ENDNU
              </p>
            </div>
          )}
          {soldItems.map((item, i) => (
            <div
              key={item.id}
              className={`flex sm:grid sm:grid-cols-[1fr_100px_100px_100px] items-center gap-4 px-5 py-4 flex-wrap ${
                i > 0 ? "border-t border-brown/10" : ""
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 bg-cream-deep border border-brown/10 shrink-0">
                  {item.product.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-mono text-[9px] tracking-widest text-ink-dim uppercase truncate">
                    {item.product.brand}
                  </p>
                  <p className="font-body text-sm font-medium text-ink truncate">
                    {item.product.title}
                  </p>
                  <p className="font-mono text-[9px] text-ink-dim mt-0.5">
                    {new Date(item.soldAt).toLocaleDateString("da-DK")}
                  </p>
                </div>
              </div>
              <span className="font-mono text-[11px] text-ink-mid">
                @{item.buyerUsername}
              </span>
              <span
                className="font-display font-semibold text-ink"
                style={{ fontSize: 15, letterSpacing: "-0.01em" }}
              >
                {formatPrice(item.product.price)}
              </span>
              <span
                className="font-display font-semibold text-brown"
                style={{ fontSize: 15, letterSpacing: "-0.01em" }}
              >
                {formatPrice(item.payout)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Drafts */}
      {tab === "drafts" && (
        <div className="border border-dashed border-brown/20 py-16 text-center">
          <p className="font-mono text-2xs tracking-editorial text-ink-dim uppercase mb-3">
            KLADDER
          </p>
          {draftCount > 0 ? (
            <>
              <p className="text-ink-mid text-sm">{draftCount} ufærdige annoncer</p>
              <button
                className="mt-4 font-mono text-[11px] tracking-wider text-brown underline underline-offset-2 uppercase"
                onClick={() => alert("Kladder (tilsluttes)")}
              >
                Fortsæt redigering
              </button>
            </>
          ) : (
            <p className="text-ink-mid text-sm">Ingen kladder</p>
          )}
        </div>
      )}
    </>
  );
}
