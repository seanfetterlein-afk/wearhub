"use client";

import { useEffect, useState } from "react";
import { Check, Clock, Package, Truck, Star, Loader2, Download, ExternalLink, Copy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/helpers";
import { formatPrice } from "@/lib/utils";
import { getShippingOption } from "@/lib/services/shippingService";
import type { Order, OrderStatus, Shipment } from "@/types";

interface Props {
  initialOrder:    Order;
  initialShipment: Shipment | null;
  myId:            string;
  isSeller:        boolean;
}

// ── Step definitions ──────────────────────────────────────────────────────────

type Step = { status: OrderStatus; label: string; icon: React.ReactNode };

const STEPS: Step[] = [
  { status: "awaiting_seller_shipping", label: "Afventer",  icon: <Clock   size={11} /> },
  { status: "shipped",                  label: "Sendt",     icon: <Truck   size={11} /> },
  { status: "delivered",                label: "Leveret",   icon: <Package size={11} /> },
  { status: "completed",                label: "Fuldført",  icon: <Star    size={11} /> },
];

// Map every possible status to a step index (-1 = terminal/off-track)
const STATUS_IDX: Record<OrderStatus, number> = {
  pending_payment:            -1,
  pending:                    -1,
  paid:                        0, // old flow → treat same as awaiting
  awaiting_seller_shipping:    0,
  label_created:               0,
  confirmed:                   0, // old flow
  shipped:                     1,
  in_transit:                  1,
  delivered:                   2,
  completed:                   3,
  cancelled:                  -1,
  refunded:                   -1,
  disputed:                   -1,
};

// For the optimistic "next status" when a button is pressed
const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  paid:                     "awaiting_seller_shipping",
  awaiting_seller_shipping: "shipped",
  label_created:            "shipped",
  confirmed:                "shipped",
  shipped:                  "delivered",
  delivered:                "completed",
};

// ── Deadline helpers ──────────────────────────────────────────────────────────

function formatDeadline(iso: string): string {
  const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
  if (diff < 0)  return "Overskredet";
  if (diff === 0) return "I dag";
  if (diff === 1) return "I morgen";
  return `${diff} dage`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("da-DK", { day: "numeric", month: "long" });
}

// ── Component ─────────────────────────────────────────────────────────────────

export function OrderStatusCard({ initialOrder, initialShipment, myId, isSeller }: Props) {
  const [order,    setOrder]    = useState<Order>(initialOrder);
  const [shipment, setShipment] = useState<Shipment | null>(initialShipment);
  const [loading,  setLoading]  = useState<string | null>(null);
  const [error,    setError]    = useState<string | null>(null);
  const [copied,   setCopied]   = useState(false);

  const isBuyer = !isSeller;

  // ── Realtime: orders ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    const channel  = supabase
      .channel(`order:${order.id}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "orders",
        filter: `id=eq.${order.id}`,
      }, (payload) => {
        const o = payload.new as any;
        setOrder((prev) => ({
          ...prev,
          status:           o.status,
          confirmedAt:      o.confirmed_at       ?? prev.confirmedAt,
          shippingDeadline: o.shipping_deadline  ?? prev.shippingDeadline,
          shippedAt:        o.shipped_at         ?? prev.shippedAt,
          deliveredAt:      o.delivered_at       ?? prev.deliveredAt,
          completedAt:      o.completed_at       ?? prev.completedAt,
        }));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [order.id]);

  // ── Realtime: shipments ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isSupabaseConfigured() || !shipment) return;
    const supabase = createClient();
    const channel  = supabase
      .channel(`shipment:${shipment.id}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "shipments",
        filter: `id=eq.${shipment.id}`,
      }, (payload) => {
        const s = payload.new as any;
        setShipment((prev) => prev ? {
          ...prev,
          status:    s.status,
          shippedAt: s.shipped_at ?? prev.shippedAt,
        } : prev);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [shipment?.id]);

  // ── Action handler with optimistic update ───────────────────────────────────
  const callAction = async (endpoint: string, label: string) => {
    const optimisticStatus = NEXT_STATUS[order.status];
    if (optimisticStatus) setOrder((prev) => ({ ...prev, status: optimisticStatus }));

    setLoading(label);
    setError(null);
    try {
      const res  = await fetch(endpoint, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ orderId: order.id }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (optimisticStatus) setOrder((prev) => ({ ...prev, status: order.status }));
        setError(json.error ?? "Noget gik galt.");
      }
    } catch {
      if (optimisticStatus) setOrder((prev) => ({ ...prev, status: order.status }));
      setError("Noget gik galt. Prøv igen.");
    } finally {
      setLoading(null);
    }
  };

  const copyTracking = async () => {
    if (!shipment?.trackingNumber) return;
    await navigator.clipboard.writeText(shipment.trackingNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentStep = STATUS_IDX[order.status];

  // ── Terminal states ─────────────────────────────────────────────────────────
  if (order.status === "cancelled" || order.status === "refunded") {
    return (
      <div className="border-b border-brown/15 bg-red-50 px-4 sm:px-0 py-3">
        <p className="font-mono text-[10px] tracking-widest text-red-600 uppercase text-center">
          {order.status === "cancelled" ? "Ordre annulleret" : "Refunderet"}
        </p>
      </div>
    );
  }

  const isAwaitingShip = ["awaiting_seller_shipping", "label_created", "confirmed", "paid"].includes(order.status);

  return (
    <div className="border-b border-brown/15 bg-cream/40 px-4 sm:px-0 py-4 flex flex-col gap-4">

      {/* ── Progress stepper ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-0">
        {STEPS.map((step, i) => {
          const stepIdx   = STATUS_IDX[step.status];
          const isDone    = currentStep > stepIdx;
          const isCurrent = currentStep === stepIdx;

          return (
            <div key={step.status} className="flex items-center flex-1 min-w-0">
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div className={`
                  w-6 h-6 rounded-full flex items-center justify-center transition-colors
                  ${isDone    ? "bg-brown text-cream" : ""}
                  ${isCurrent ? "bg-brown text-cream ring-2 ring-brown/30 ring-offset-1" : ""}
                  ${!isDone && !isCurrent ? "bg-cream-deep border border-brown/20 text-ink-dim" : ""}
                `}>
                  {step.icon}
                </div>
                <span className={`font-mono text-[8px] tracking-wider uppercase whitespace-nowrap ${
                  isCurrent ? "text-brown font-semibold" : isDone ? "text-ink-mid" : "text-ink-dim"
                }`}>
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-px flex-1 mx-1 mb-4 transition-colors ${
                  currentStep > stepIdx ? "bg-brown" : "bg-brown/15"
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Shipping deadline ─────────────────────────────────────────────────── */}
      {order.shippingDeadline && isAwaitingShip && (
        <div className="flex items-center gap-1.5">
          <Clock size={10} className="text-amber-500 shrink-0" />
          <p className="font-mono text-[9px] tracking-wider text-ink-dim">
            {isSeller
              ? `Send pakken senest: ${formatDate(order.shippingDeadline)} (${formatDeadline(order.shippingDeadline)})`
              : `Sælger sender pakken senest: ${formatDate(order.shippingDeadline)}`
            }
          </p>
        </div>
      )}

      {/* ── Shipping label info (for seller in awaiting state) ───────────────── */}
      {isSeller && isAwaitingShip && shipment && (
        <div className="border border-brown/20 bg-paper p-3 flex flex-col gap-2">
          <p className="font-mono text-[9px] tracking-widest text-ink-dim uppercase">
            Fragtlabel — {shipment.carrier}
          </p>

          {/* Delivery address */}
          {order.buyerName && (
            <div className="text-ink-mid">
              <p className="font-mono text-[10px] font-semibold text-ink">{order.buyerName}</p>
              {order.buyerAddress && (
                <p className="font-mono text-[9px]">{order.buyerAddress}</p>
              )}
              {(order.buyerZip || order.buyerCity) && (
                <p className="font-mono text-[9px]">{order.buyerZip} {order.buyerCity}</p>
              )}
            </div>
          )}

          {/* Package code */}
          {shipment.packageCode && (
            <div className="border border-dashed border-brown/30 p-2 text-center">
              <p className="font-mono text-[8px] tracking-widest text-ink-dim uppercase mb-1">
                Pakkekode
              </p>
              <p className="font-mono text-lg font-semibold tracking-[0.15em] text-ink">
                {shipment.packageCode}
              </p>
              {order.shippingCarrier && (
                <p className="font-mono text-[8px] text-ink-dim mt-1">
                  Brug denne kode ved {order.shippingCarrier} pakkeshop
                </p>
              )}
            </div>
          )}

          {/* Tracking number */}
          {shipment.trackingNumber && (
            <div className="flex items-center gap-2">
              <p className="font-mono text-[9px] text-ink-dim flex-1">
                Tracking: <span className="text-ink">{shipment.trackingNumber}</span>
              </p>
              <button
                onClick={copyTracking}
                className="flex items-center gap-1 font-mono text-[8px] tracking-wider text-ink-dim hover:text-ink active:scale-90 transition-[transform,color] duration-[80ms]"
              >
                <Copy size={10} />
                {copied ? "Kopieret!" : "Kopiér"}
              </button>
            </div>
          )}

          {/* Download label button */}
          <a
            href={shipment.labelUrl ?? `/api/shipping/label/${order.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 border border-brown px-3 py-2 font-mono text-[10px] tracking-widest text-brown uppercase hover:bg-brown hover:text-cream active:scale-[0.98] active:opacity-80 transition-[colors,transform,opacity] duration-[0ms,80ms,80ms]"
          >
            <Download size={11} />
            DOWNLOAD FRAGTLABEL
          </a>
        </div>
      )}

      {/* ── Tracking info (for buyer after shipped) ───────────────────────────── */}
      {isBuyer && order.status !== "completed" && shipment?.trackingNumber && (
        <div className="border border-brown/15 bg-paper p-3 flex flex-col gap-2">
          <p className="font-mono text-[9px] tracking-widest text-ink-dim uppercase">
            Pakkesporing — {shipment.carrier}
          </p>
          <div className="flex items-center justify-between gap-2">
            <p className="font-mono text-[10px] text-ink">
              {shipment.trackingNumber}
            </p>
            {shipment.trackingUrl && (
              <a
                href={shipment.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 font-mono text-[9px] tracking-wider text-brown hover:text-brown-deep active:scale-95 active:opacity-80 transition-[transform,opacity] duration-[80ms]"
              >
                <ExternalLink size={10} />
                FØLG PAKKE
              </a>
            )}
          </div>
        </div>
      )}

      {/* ── Error ────────────────────────────────────────────────────────────── */}
      {error && (
        <p className="font-mono text-[9px] tracking-wider text-red-500">{error}</p>
      )}

      {/* ── Action buttons ────────────────────────────────────────────────────── */}
      <div className="flex gap-2">

        {/* Old flow: seller confirm (paid → confirmed) */}
        {isSeller && order.status === "paid" && !shipment && (
          <button
            onClick={() => callAction("/api/orders/confirm", "confirm")}
            disabled={!!loading}
            className="flex-1 h-9 bg-brown text-cream font-mono text-[10px] tracking-widest uppercase hover:bg-brown-deep active:scale-[0.98] active:opacity-80 transition-[colors,transform,opacity] duration-[0ms,80ms,80ms] disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {loading === "confirm" ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
            BEKRÆFT ORDRE
          </button>
        )}

        {/* Seller: mark shipped (new + old flow) */}
        {isSeller && isAwaitingShip && (
          <button
            onClick={() => callAction("/api/orders/ship", "ship")}
            disabled={!!loading}
            className="flex-1 h-9 bg-brown text-cream font-mono text-[10px] tracking-widest uppercase hover:bg-brown-deep active:scale-[0.98] active:opacity-80 transition-[colors,transform,opacity] duration-[0ms,80ms,80ms] disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {loading === "ship" ? <Loader2 size={11} className="animate-spin" /> : <Truck size={11} />}
            MARKER SOM SENDT
          </button>
        )}

        {/* Buyer: confirm delivery */}
        {isBuyer && (order.status === "shipped" || order.status === "in_transit") && (
          <button
            onClick={() => callAction("/api/orders/deliver", "deliver")}
            disabled={!!loading}
            className="flex-1 h-9 bg-brown text-cream font-mono text-[10px] tracking-widest uppercase hover:bg-brown-deep active:scale-[0.98] active:opacity-80 transition-[colors,transform,opacity] duration-[0ms,80ms,80ms] disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {loading === "deliver" ? <Loader2 size={11} className="animate-spin" /> : <Package size={11} />}
            BEKRÆFT MODTAGELSE
          </button>
        )}

        {/* Buyer: complete */}
        {isBuyer && order.status === "delivered" && (
          <button
            onClick={() => callAction("/api/orders/complete", "complete")}
            disabled={!!loading}
            className="flex-1 h-9 border border-brown font-mono text-[10px] tracking-widest text-brown uppercase hover:bg-brown hover:text-cream active:scale-[0.98] active:opacity-80 transition-[colors,transform,opacity] duration-[0ms,80ms,80ms] disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {loading === "complete" ? <Loader2 size={11} className="animate-spin" /> : <Star size={11} />}
            HANDEL FULDFØRT
          </button>
        )}

        {/* Completed */}
        {order.status === "completed" && (
          <div className="flex-1 h-9 bg-green-50 border border-green-200 font-mono text-[10px] tracking-widest text-green-700 uppercase flex items-center justify-center gap-1.5">
            <Check size={11} /> HANDEL FULDFØRT
          </div>
        )}

        {/* Waiting states */}
        {isBuyer  && isAwaitingShip && (
          <div className="flex-1 h-9 border border-brown/20 font-mono text-[10px] tracking-widest text-ink-dim uppercase flex items-center justify-center">
            AFVENTER AFSENDELSE
          </div>
        )}
        {isSeller && (order.status === "shipped" || order.status === "in_transit") && (
          <div className="flex-1 h-9 border border-brown/20 font-mono text-[10px] tracking-widest text-ink-dim uppercase flex items-center justify-center">
            AFVENTER MODTAGELSE
          </div>
        )}
        {isSeller && order.status === "delivered" && (
          <div className="flex-1 h-9 border border-brown/20 font-mono text-[10px] tracking-widest text-ink-dim uppercase flex items-center justify-center">
            LEVERET — AFVENTER FULDFØRELSE
          </div>
        )}
      </div>

      {/* ── Price footer ─────────────────────────────────────────────────────── */}
      <p className="font-mono text-[9px] tracking-wider text-ink-dim text-center">
        {order.itemPrice
          ? `Vare ${formatPrice(order.itemPrice)} + fragt ${formatPrice(order.shippingPrice ?? 0)} = ${formatPrice(order.amount)} betalt · ${formatPrice(order.payout)} til sælger`
          : `${formatPrice(order.amount)} betalt · ${formatPrice(order.payout)} til sælger efter WearHub gebyr`
        }
      </p>
    </div>
  );
}
