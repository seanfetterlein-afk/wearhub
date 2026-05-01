import Link from "next/link";
import { ShieldCheck, MessageSquare, Star } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import type { User } from "@/types";

interface SellerCardProps {
  seller: User;
}

export function SellerCard({ seller }: SellerCardProps) {
  return (
    <div className="border border-brown/20 p-5">
      {/* Header */}
      <p className="font-mono text-2xs tracking-widest text-ink-dim uppercase mb-4">SÆLGER</p>

      <div className="flex items-center gap-3 mb-4">
        <Avatar name={seller.displayName} size="md" />
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-body font-semibold text-ink text-sm">
              {seller.displayName}
            </span>
            {seller.isVerified && (
              <ShieldCheck size={13} className="text-brown" />
            )}
          </div>
          <span className="font-mono text-2xs tracking-wider text-ink-dim">
            @{seller.username}
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 border border-brown/10 divide-x divide-brown/10 mb-4">
        {[
          { val: seller.rating.toFixed(1), lbl: "Rating" },
          { val: seller.totalSales,        lbl: "Solgt" },
          { val: `${seller.responseRate}%`, lbl: "Svar" },
        ].map(({ val, lbl }) => (
          <div key={lbl} className="py-2.5 text-center">
            <div className="font-display font-semibold text-brown text-lg" style={{ letterSpacing: "-0.02em" }}>
              {val}
            </div>
            <div className="font-mono text-[9px] tracking-widest text-ink-dim uppercase mt-0.5">
              {lbl}
            </div>
          </div>
        ))}
      </div>

      {/* Star rating */}
      <div className="flex items-center gap-1.5 mb-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={12}
            className={i < Math.round(seller.rating) ? "text-brown fill-brown" : "text-brown/20"}
          />
        ))}
        <span className="font-mono text-[10px] text-ink-dim ml-1">
          {seller.rating.toFixed(1)} / 5
        </span>
      </div>

      <p className="text-ink-dim text-xs font-mono tracking-wider">
        {seller.location} · Medlem siden {new Date(seller.memberSince).getFullYear()}
      </p>

      {seller.bio && (
        <p className="text-ink-mid text-sm mt-3 leading-relaxed border-t border-brown/10 pt-3">
          {seller.bio}
        </p>
      )}

      {/* CTA */}
      <Link
        href={`/messages/new?to=${seller.id}`}
        className="mt-4 flex items-center justify-center gap-2 h-10 w-full border border-brown text-brown font-body font-semibold text-[11px] tracking-wider uppercase hover:bg-brown hover:text-cream transition-colors"
      >
        <MessageSquare size={13} />
        SKRIV TIL SÆLGER
      </Link>

      <Link
        href={`/profile/${seller.username}`}
        className="mt-2 block text-center font-mono text-[10px] tracking-widest text-ink-dim hover:text-ink-mid uppercase underline-offset-2 hover:underline transition-colors"
      >
        SE PROFIL →
      </Link>
    </div>
  );
}
