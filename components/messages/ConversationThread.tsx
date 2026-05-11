"use client";

import { useState, useRef, useEffect, useTransition, useCallback } from "react";
import { Send, Tag, Check, X, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { sendMessage, makeOffer, respondToOffer } from "@/lib/actions/messages";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/helpers";
import { formatPrice, cn } from "@/lib/utils";
import type { Message, Offer, OfferStatus } from "@/types";

interface Props {
  conversationId: string;
  initialMessages: Message[];
  initialOffers: Record<string, Offer>;
  myId: string;
  isSeller: boolean;
  participantName: string;
  myName: string;
  listingPrice: number;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("da-DK", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("da-DK", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

const STATUS_LABELS: Record<OfferStatus, string> = {
  pending:  "AFVENTER",
  accepted: "ACCEPTERET",
  rejected: "AFVIST",
};

const STATUS_COLORS: Record<OfferStatus, string> = {
  pending:  "text-ink-mid bg-cream-deep border-brown/20",
  accepted: "text-green-700 bg-green-50 border-green-200",
  rejected: "text-red-600 bg-red-50 border-red-200",
};

interface OfferCardProps {
  offer: Offer | undefined;
  isSeller: boolean;
  isMine: boolean;
  onRespond: (offerId: string, response: "accepted" | "rejected") => void;
  respondingId: string | null;
}

function OfferCard({ offer, isSeller, isMine, onRespond, respondingId }: OfferCardProps) {
  if (!offer) return null;

  const isResponding = respondingId === offer.id;
  const canRespond   = isSeller && !isMine && offer.status === "pending";

  return (
    <div className={cn(
      "border px-4 py-3 min-w-[220px] max-w-[280px]",
      isMine ? "border-brown/30 bg-brown/5" : "border-brown/20 bg-cream",
    )}>
      <div className="flex items-center gap-1.5 mb-2">
        <Tag size={10} className="text-ink-dim" />
        <span className="font-mono text-[9px] tracking-widest text-ink-dim uppercase">
          BUD
        </span>
      </div>

      <p
        className="font-display font-bold text-brown leading-none mb-3"
        style={{ fontSize: 22, letterSpacing: "-0.02em" }}
      >
        {formatPrice(offer.amount)}
      </p>

      <span className={cn(
        "inline-block font-mono text-[9px] tracking-widest uppercase px-2 py-0.5 border",
        STATUS_COLORS[offer.status],
      )}>
        {STATUS_LABELS[offer.status]}
      </span>

      {canRespond && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => onRespond(offer.id, "accepted")}
            disabled={isResponding}
            className="flex-1 h-8 bg-brown text-cream font-mono text-[9px] tracking-widest uppercase flex items-center justify-center gap-1.5 hover:bg-brown-deep transition-colors disabled:opacity-50"
          >
            {isResponding ? (
              <Loader2 size={11} className="animate-spin" />
            ) : (
              <><Check size={11} /> ACCEPTER</>
            )}
          </button>
          <button
            onClick={() => onRespond(offer.id, "rejected")}
            disabled={isResponding}
            className="flex-1 h-8 border border-brown/30 text-ink-mid font-mono text-[9px] tracking-widest uppercase flex items-center justify-center gap-1.5 hover:border-brown hover:text-brown transition-colors disabled:opacity-50"
          >
            {isResponding ? (
              <Loader2 size={11} className="animate-spin" />
            ) : (
              <><X size={11} /> AFVIS</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export function ConversationThread({
  conversationId,
  initialMessages,
  initialOffers,
  myId,
  isSeller,
  participantName,
  myName,
  listingPrice,
}: Props) {
  const [messages,     setMessages]     = useState<Message[]>(initialMessages);
  const [offers,       setOffers]       = useState<Record<string, Offer>>(initialOffers);
  const [input,        setInput]        = useState("");
  const [error,        setError]        = useState<string | null>(null);
  const [isPending,    startTransition] = useTransition();

  // Offer form state
  const [showOffer,    setShowOffer]    = useState(false);
  const [offerAmount,  setOfferAmount]  = useState("");
  const [offerPending, setOfferPending] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Supabase real-time ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`conv:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event:  "INSERT",
          schema: "public",
          table:  "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const m = payload.new as any;
          setMessages((prev) => {
            if (prev.some((x) => x.id === m.id)) return prev;
            return [
              ...prev,
              {
                id:          m.id,
                senderId:    m.sender_id,
                text:        m.text,
                createdAt:   m.created_at,
                messageType: m.message_type ?? "text",
                offerId:     m.offer_id ?? null,
              },
            ];
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event:  "INSERT",
          schema: "public",
          table:  "offers",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const o = payload.new as any;
          setOffers((prev) => ({
            ...prev,
            [o.id]: {
              id:             o.id,
              conversationId: o.conversation_id,
              buyerId:        o.buyer_id,
              sellerId:       o.seller_id,
              amount:         o.amount,
              status:         o.status,
              createdAt:      o.created_at,
            },
          }));
        },
      )
      .on(
        "postgres_changes",
        {
          event:  "UPDATE",
          schema: "public",
          table:  "offers",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const o = payload.new as any;
          setOffers((prev) => ({
            ...prev,
            [o.id]: { ...prev[o.id], status: o.status },
          }));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  // ── Send text message ───────────────────────────────────────────────────────
  const send = useCallback(() => {
    const text = input.trim();
    if (!text) return;

    const optimistic: Message = {
      id:          `opt_${Date.now()}`,
      senderId:    myId,
      text,
      createdAt:   new Date().toISOString(),
      messageType: "text",
    };

    setMessages((prev) => [...prev, optimistic]);
    setInput("");
    setError(null);

    if (!isSupabaseConfigured()) return;

    startTransition(async () => {
      const result = await sendMessage(conversationId, text);
      if (result.error) {
        setError(result.error);
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      } else if (result.message) {
        // Swap optimistic placeholder with the real DB id + timestamp so the
        // real-time subscriber won't add a duplicate when it arrives.
        setMessages((prev) =>
          prev.map((m) =>
            m.id === optimistic.id
              ? { ...m, id: result.message!.id, createdAt: result.message!.createdAt }
              : m,
          ),
        );
      }
    });
  }, [input, myId, conversationId]);

  // ── Submit offer ────────────────────────────────────────────────────────────
  const submitOffer = async () => {
    const amount = parseInt(offerAmount, 10);
    if (!amount || amount <= 0) {
      setError("Indtast et gyldigt beløb.");
      return;
    }
    setError(null);
    setOfferPending(true);

    const result = await makeOffer(conversationId, amount);
    setOfferPending(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setOfferAmount("");
    setShowOffer(false);
  };

  // ── Accept / reject offer ───────────────────────────────────────────────────
  const handleRespond = useCallback(
    async (offerId: string, response: "accepted" | "rejected") => {
      setRespondingId(offerId);
      // Optimistic status update
      setOffers((prev) => ({
        ...prev,
        [offerId]: { ...prev[offerId], status: response },
      }));

      const result = await respondToOffer(offerId, response);
      setRespondingId(null);

      if (result.error) {
        // Revert
        setOffers((prev) => ({
          ...prev,
          [offerId]: { ...prev[offerId], status: "pending" },
        }));
        setError(result.error);
      }
    },
    [],
  );

  const isBuyer = !isSeller;

  return (
    <>
      {/* ── Message thread ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2 px-4 sm:px-0 py-6 min-h-[400px] max-h-[60vh]">
        {messages.map((msg, i) => {
          const isMine   = msg.senderId === myId;
          const isFirst  = i === 0 || messages[i - 1].senderId !== msg.senderId;
          const showDate =
            i === 0 ||
            new Date(msg.createdAt).toDateString() !==
              new Date(messages[i - 1].createdAt).toDateString();

          return (
            <div key={msg.id}>
              {showDate && (
                <div className="text-center my-3">
                  <span className="font-mono text-[9px] tracking-widest text-ink-dim uppercase bg-paper px-3">
                    {formatDate(msg.createdAt)}
                  </span>
                </div>
              )}

              {/* ── System message ────────────────────────────────────────── */}
              {(msg.messageType === "system" || msg.messageType === "order_update") ? (
                <div className="flex justify-center my-1">
                  <span className="font-mono text-[9px] tracking-wider text-ink-dim uppercase bg-cream border border-brown/10 px-3 py-1.5 text-center max-w-[85%]">
                    {msg.text}
                  </span>
                </div>
              ) : /* ── Offer message ──────────────────────────────────────── */
              msg.messageType === "offer" && msg.offerId ? (
                <div className={cn(
                  "flex gap-2",
                  isMine ? "justify-end" : "justify-start",
                )}>
                  {!isMine && isFirst && (
                    <Avatar name={participantName} size="xs" className="mt-auto mb-1 shrink-0" />
                  )}
                  {!isMine && !isFirst && <div className="w-6 shrink-0" />}

                  <div className="flex flex-col gap-1">
                    <OfferCard
                      offer={offers[msg.offerId]}
                      isSeller={isSeller}
                      isMine={isMine}
                      onRespond={handleRespond}
                      respondingId={respondingId}
                    />
                    <p className={cn(
                      "font-mono text-[9px] tracking-wider text-ink-dim",
                      isMine ? "text-right" : "",
                    )}>
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>

                  {isMine && isFirst && (
                    <Avatar name={myName} size="xs" className="mt-auto mb-1 shrink-0" />
                  )}
                  {isMine && !isFirst && <div className="w-6 shrink-0" />}
                </div>
              ) : (
                /* ── Text message ────────────────────────────────────────── */
                <div className={cn(
                  "flex gap-2",
                  isMine ? "justify-end" : "justify-start",
                  !isFirst && !showDate ? (isMine ? "mr-9" : "ml-9") : "",
                )}>
                  {!isMine && isFirst && (
                    <Avatar name={participantName} size="xs" className="mt-auto mb-1 shrink-0" />
                  )}
                  {!isMine && !isFirst && <div className="w-6 shrink-0" />}

                  <div className={cn(
                    "max-w-[75%] px-4 py-2.5",
                    isMine
                      ? "bg-brown text-cream"
                      : "bg-cream border border-brown/15 text-ink",
                  )}>
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                    <p className={cn(
                      "font-mono text-[9px] tracking-wider mt-1",
                      isMine ? "text-cream/60 text-right" : "text-ink-dim",
                    )}>
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>

                  {isMine && isFirst && (
                    <Avatar name={myName} size="xs" className="mt-auto mb-1 shrink-0" />
                  )}
                  {isMine && !isFirst && <div className="w-6 shrink-0" />}
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* ── Offer form (buyer only) ─────────────────────────────────────────── */}
      {isBuyer && showOffer && (
        <div className="border-t border-brown/20 px-4 sm:px-0 py-4 bg-cream-deep">
          <p className="font-mono text-[9px] tracking-widest text-ink-dim uppercase mb-3">
            Nyt bud
          </p>
          <div className="flex gap-2 items-stretch">
            <div className="relative flex-1">
              <input
                type="number"
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitOffer();
                  if (e.key === "Escape") setShowOffer(false);
                }}
                placeholder={String(Math.round(listingPrice * 0.85))}
                className="w-full h-11 pl-4 pr-16 border border-brown/20 bg-paper font-body text-sm text-ink outline-none focus:border-brown/50 transition-colors"
                autoFocus
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-ink-dim">
                DKK
              </span>
            </div>
            <button
              onClick={submitOffer}
              disabled={offerPending || !offerAmount}
              className="h-11 px-5 bg-brown text-cream font-mono text-[9px] tracking-widest uppercase hover:bg-brown-deep transition-colors disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5"
            >
              {offerPending ? <Loader2 size={11} className="animate-spin" /> : "SEND BUD"}
            </button>
            <button
              onClick={() => { setShowOffer(false); setOfferAmount(""); }}
              className="h-11 w-11 flex items-center justify-center border border-brown/20 text-ink-mid hover:text-brown hover:border-brown transition-colors"
            >
              <X size={14} />
            </button>
          </div>
          <p className="font-mono text-[9px] tracking-wider text-ink-dim mt-2">
            Listet til {formatPrice(listingPrice)}
          </p>
        </div>
      )}

      {/* ── Input bar ───────────────────────────────────────────────────────── */}
      <div className="border-t border-brown/20 px-4 sm:px-0 py-4 bg-paper">
        {error && (
          <p className="font-mono text-[9px] tracking-wider text-red-500 mb-2">{error}</p>
        )}

        <div className="flex gap-2">
          {/* Offer toggle — buyer only */}
          {isBuyer && (
            <button
              onClick={() => { setShowOffer((v) => !v); setError(null); }}
              title="Giv bud"
              className={cn(
                "h-11 w-11 border flex items-center justify-center transition-colors shrink-0",
                showOffer
                  ? "bg-brown text-cream border-brown"
                  : "border-brown/20 text-ink-mid hover:border-brown hover:text-brown",
              )}
            >
              <Tag size={14} />
            </button>
          )}

          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Skriv en besked..."
            disabled={isPending}
            className="flex-1 h-11 px-4 border border-brown/20 bg-paper font-body text-sm text-ink placeholder:text-ink-dim outline-none focus:border-brown/50 transition-colors disabled:opacity-60"
          />

          <button
            onClick={send}
            disabled={!input.trim() || isPending}
            className="h-11 px-4 bg-brown text-cream flex items-center justify-center gap-2 font-body font-semibold text-[12px] tracking-wider uppercase hover:bg-brown-deep transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            <Send size={14} />
            <span className="hidden sm:inline">SEND</span>
          </button>
        </div>

        <p className="font-mono text-[9px] tracking-wider text-ink-dim mt-2">
          Del aldrig betalingsoplysninger i beskeder · Nord Studios verificerer alle transaktioner
        </p>
      </div>
    </>
  );
}
