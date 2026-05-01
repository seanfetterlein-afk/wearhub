"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { toggleFavorite } from "@/lib/actions/favorites";
import { isSupabaseConfigured } from "@/lib/supabase/helpers";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types";

interface Props {
  initialProducts: Product[];
}

export function FavoritesClient({ initialProducts }: Props) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [removing, setRemoving] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const remove = (id: string) => {
    if (!isSupabaseConfigured()) {
      setProducts((ps) => ps.filter((p) => p.id !== id));
      return;
    }
    setRemoving(id);
    startTransition(async () => {
      await toggleFavorite(id);
      setProducts((ps) => ps.filter((p) => p.id !== id));
      setRemoving(null);
      router.refresh();
    });
  };

  const clearAll = () => {
    if (!isSupabaseConfigured()) {
      setProducts([]);
      return;
    }
    startTransition(async () => {
      await Promise.all(products.map((p) => toggleFavorite(p.id)));
      setProducts([]);
      router.refresh();
    });
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-end justify-between mb-8 pb-5 border-b border-brown/20 flex-wrap gap-4">
        <div>
          <p className="font-mono text-2xs tracking-editorial text-ink-dim uppercase mb-1">
            SECTION / 04
          </p>
          <h1
            className="font-display font-semibold text-brown leading-none"
            style={{ fontSize: "clamp(28px, 4vw, 48px)", letterSpacing: "-0.03em" }}
          >
            FAVORITTER
          </h1>
          {products.length > 0 && (
            <p className="text-ink-mid text-sm mt-2">
              {products.length} gemte item{products.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        {products.length > 0 && (
          <button
            onClick={clearAll}
            className="font-mono text-[10px] tracking-widest text-ink-dim hover:text-brown uppercase underline-offset-2 hover:underline"
          >
            RYD ALLE
          </button>
        )}
      </div>

      {/* Empty state */}
      {products.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-5">
          <Heart size={48} className="text-brown/20" />
          <div>
            <p className="font-mono text-2xs tracking-editorial text-ink-dim uppercase mb-3">
              INGEN FAVORITTER
            </p>
            <h2
              className="font-display font-semibold text-brown"
              style={{ fontSize: "clamp(28px, 4vw, 48px)", letterSpacing: "-0.03em", lineHeight: 1 }}
            >
              INTET GEMT
            </h2>
            <p className="text-ink-mid text-sm mt-3 max-w-xs">
              Tryk på hjertet på et produkt for at gemme det til senere.
            </p>
          </div>
          <Button size="lg" asChild>
            <Link href="/shop">BROWSE ITEMS</Link>
          </Button>
        </div>
      )}

      {/* Grid */}
      {products.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-8">
          {products.map((product) => (
            <div key={product.id} className="relative group">
              <button
                onClick={() => remove(product.id)}
                disabled={removing === product.id}
                aria-label="Fjern fra favoritter"
                className="absolute top-2.5 right-2.5 z-10 w-7 h-7 bg-white flex items-center justify-center border border-brown/20 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-cream disabled:opacity-40"
              >
                <X size={12} className="text-ink-mid" />
              </button>

              <Link href={`/item/${product.id}`} className="block">
                <div className="relative aspect-[4/5] bg-cream-deep border border-brown/10">
                  {product.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center font-mono text-[10px] tracking-wider text-ink-dim">
                      PRODUCT IMG
                    </div>
                  )}
                  <Heart
                    size={11}
                    className="absolute bottom-2.5 right-2.5 text-brown fill-brown opacity-70"
                  />
                </div>
                <div className="mt-2.5 flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] tracking-wider text-ink-dim uppercase truncate">
                      {product.brand}
                    </p>
                    <p className="font-body text-sm text-ink font-medium mt-0.5 line-clamp-2">
                      {product.title}
                    </p>
                  </div>
                  <p
                    className="font-display font-semibold text-brown whitespace-nowrap shrink-0"
                    style={{ fontSize: 15, letterSpacing: "-0.01em" }}
                  >
                    {formatPrice(product.price)}
                  </p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
