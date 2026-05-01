"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart, MessageCircle, ShoppingBag, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toggleFavorite } from "@/lib/actions/favorites";
import { startConversation, startConversationWithOffer } from "@/lib/actions/messages";
import { isSupabaseConfigured } from "@/lib/supabase/helpers";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types";

interface Props {
  product: Product;
  initialSaved: boolean;
}

export function ItemActions({ product, initialSaved }: Props) {
  const router = useRouter();
  const { t }  = useLanguage();

  const [saved,       setSaved]       = useState(initialSaved);
  const [showOffer,   setShowOffer]   = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [error,       setError]       = useState<string | null>(null);

  const [isPending,    startTransition]    = useTransition();
  const [msgPending,   startMsgTransition] = useTransition();
  const [offerPending, setOfferPending]    = useState(false);

  const handleFavorite = () => {
    if (!isSupabaseConfigured()) {
      setSaved((v) => !v);
      return;
    }
    startTransition(async () => {
      const result = await toggleFavorite(product.id);
      if (result.error) {
        router.push(`/login?redirect=/item/${product.id}`);
        return;
      }
      setSaved(result.saved);
    });
  };

  const handleMessage = () => {
    if (!isSupabaseConfigured()) {
      router.push("/messages/conv_001");
      return;
    }
    startMsgTransition(async () => {
      setError(null);
      const result = await startConversation(
        product.id,
        product.sellerId,
        "",
      );
      if (result.error) {
        if (result.error === "Ikke logget ind.") {
          router.push(`/login?redirect=/item/${product.id}`);
        } else if (result.error === "Du kan ikke sende besked til dig selv.") {
          setError("Dette er din egen annonce.");
        } else {
          setError(`Fejl: ${result.error}`);
        }
        return;
      }
      if (result.conversationId) {
        router.push(`/messages/${result.conversationId}`);
      }
    });
  };

  const handleOffer = async () => {
    const amount = parseInt(offerAmount, 10);
    if (!amount || amount <= 0) {
      setError("Indtast et gyldigt beløb.");
      return;
    }

    if (!isSupabaseConfigured()) {
      // Dev fallback
      router.push("/messages/conv_001");
      return;
    }

    setError(null);
    setOfferPending(true);

    const result = await startConversationWithOffer(
      product.id,
      product.sellerId,
      amount,
    );

    setOfferPending(false);

    if (result.error) {
      if (result.error === "Ikke logget ind.") {
        router.push(`/login?redirect=/item/${product.id}`);
        return;
      }
      setError(result.error);
      return;
    }

    if (result.conversationId) {
      router.push(`/messages/${result.conversationId}`);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p className="font-mono text-[10px] tracking-wider text-red-500 border border-red-200 bg-red-50 px-3 py-2">
          {error}
        </p>
      )}

      {/* Buy Now */}
      <Button
        size="lg"
        className="w-full text-base tracking-widest shadow-sm"
        onClick={() => alert("Stripe checkout tilsluttes snart.")}
      >
        <ShoppingBag size={16} />
        {t("buyNow")} · {formatPrice(product.price)}
      </Button>

      {/* Make Offer toggle */}
      <button
        onClick={() => { setShowOffer((v) => !v); setError(null); }}
        className="w-full h-12 border border-brown/30 font-mono text-[11px] tracking-widest text-brown uppercase hover:border-brown hover:bg-cream transition-colors flex items-center justify-center gap-2"
      >
        {t("makeOffer")}
        {showOffer ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>

      {/* Offer form */}
      {showOffer && (
        <div className="border border-brown/20 p-4 bg-cream flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[9px] tracking-widest text-ink-dim uppercase">
              Dit bud (DKK)
            </label>
            <div className="relative">
              <input
                type="number"
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleOffer()}
                placeholder={String(Math.round(product.price * 0.85))}
                className="w-full h-10 pl-3 pr-16 border border-brown/20 bg-paper font-body text-sm text-ink outline-none focus:border-brown/50 transition-colors"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-ink-dim">
                DKK
              </span>
            </div>
          </div>

          <button
            onClick={handleOffer}
            disabled={!offerAmount || offerPending}
            className="h-10 bg-brown text-cream font-mono text-[11px] tracking-widest uppercase hover:bg-brown-deep transition-colors disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
          >
            {offerPending ? (
              <><Loader2 size={13} className="animate-spin" /> SENDER...</>
            ) : (
              t("sendOffer")
            )}
          </button>

          <p className="font-mono text-[9px] tracking-wider text-ink-dim text-center">
            Listet til {formatPrice(product.price)} · Dit bud sendes direkte til sælger
          </p>
        </div>
      )}

      {/* Secondary actions */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleMessage}
          disabled={msgPending}
          className="h-11 border border-brown/20 font-mono text-[10px] tracking-widest text-ink-mid uppercase hover:border-brown hover:text-brown transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {msgPending ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <MessageCircle size={13} />
          )}
          {msgPending ? t("messaging") : t("sendMessage")}
        </button>

        <button
          onClick={handleFavorite}
          disabled={isPending}
          className="h-11 border border-brown/20 font-mono text-[10px] tracking-widest text-ink-mid uppercase hover:border-brown hover:text-brown transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Heart size={13} className={saved ? "text-brown fill-brown" : ""} />
          {saved ? t("saved") : t("save")}
        </button>
      </div>
    </div>
  );
}
