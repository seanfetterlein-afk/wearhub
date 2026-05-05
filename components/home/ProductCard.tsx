"use client";

import { memo, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export const ProductCard = memo(function ProductCard({ product, priority }: ProductCardProps) {
  const { id, title, brand, price, imageUrl, favorites, size, condition } = product;
  const [pressed, setPressed] = useState(false);

  return (
    <Link
      href={`/item/${id}`}
      prefetch
      className="group block select-none"
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      <div
        className="relative aspect-[3/4] border border-black/12 overflow-hidden bg-[#F2F2F2]"
        style={{
          opacity: pressed ? 0.75 : 1,
          transform: pressed ? "scale(0.98)" : "scale(1)",
          transition: "opacity 80ms ease, transform 80ms ease",
        }}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={title}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={priority ? "high" : "auto"}
            className="w-full h-full object-cover transition-transform duration-200 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[11px] tracking-widest text-[#AAAAAA]">
            —
          </div>
        )}

        {typeof favorites === "number" && favorites > 0 && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 shadow-sm pointer-events-none">
            <Heart size={11} className="text-black" />
            <span className="font-mono text-[10px] text-black leading-none">{favorites}</span>
          </div>
        )}
      </div>

      <div className="mt-2">
        <p className="text-[12px] text-[#555] font-body">{brand}</p>
        <p className="text-[11px] text-[#AAAAAA] font-body">{size} · {condition}</p>
        <p className="text-base tracking-wide mt-0.5" style={{ fontFamily: "var(--font-bebas-neue)" }}>{formatPrice(price)}</p>
      </div>
    </Link>
  );
});
