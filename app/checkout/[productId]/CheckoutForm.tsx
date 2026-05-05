"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Package, Home } from "lucide-react";
import { createCheckoutSession } from "@/lib/actions/checkout";
import {
  SHIPPING_OPTIONS,
  calculateShippingPrice,
  calculatePlatformFee,
  type ShippingCarrier,
} from "@/lib/services/shippingService";
import { formatPrice } from "@/lib/utils";

interface Props {
  product: {
    id:    string;
    price: number;
    brand: string;
    title: string;
  };
  defaultName?: string;
  defaultCity?: string;
}

export function CheckoutForm({ product, defaultName = "", defaultCity = "" }: Props) {
  const router = useRouter();

  const [carrier, setCarrier] = useState<ShippingCarrier>("DAO");
  const [name,    setName]    = useState(defaultName);
  const [addr,    setAddr]    = useState("");
  const [zip,     setZip]     = useState("");
  const [city,    setCity]    = useState(defaultCity);
  const [error,   setError]   = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const option       = SHIPPING_OPTIONS.find((o) => o.carrier === carrier)!;
  const shippingPrice = calculateShippingPrice(carrier);
  const platformFee  = calculatePlatformFee(product.price);
  const total        = product.price + shippingPrice + platformFee;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createCheckoutSession(product.id, carrier, {
        name, addressLine: addr, city, zip,
      });
      if (result.error === "login") {
        router.push(`/login?redirect=/checkout/${product.id}`);
        return;
      }
      if (result.error) { setError(result.error); return; }
      if (result.url)   window.location.href = result.url;
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-7">

      {/* ── Leveringsadresse ─────────────────────────────────────────────────── */}
      <section>
        <p className="font-mono text-[9px] tracking-widest text-ink-dim uppercase mb-3">
          LEVERINGSADRESSE
        </p>
        <div className="flex flex-col gap-3">
          <Field label="Fulde navn">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dit fulde navn"
              required
              className={inputCls}
            />
          </Field>
          <Field label="Adresse">
            <input
              type="text"
              value={addr}
              onChange={(e) => setAddr(e.target.value)}
              placeholder="Gadenavn og husnummer"
              required
              className={inputCls}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Postnummer">
              <input
                type="text"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                placeholder="2100"
                required
                className={inputCls}
              />
            </Field>
            <Field label="By">
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="København"
                required
                className={inputCls}
              />
            </Field>
          </div>
        </div>
        <p className="font-mono text-[8px] tracking-wider text-ink-dim mt-2">
          {option.methodType === "pakkeshop"
            ? `Pakken leveres til den nærmeste ${carrier} ${option.methodType === "pakkeshop" ? "pakkeshop" : "adresse"} nær din adresse.`
            : "Pakken leveres direkte til din adresse."}
        </p>
      </section>

      {/* ── Fragtmetode ──────────────────────────────────────────────────────── */}
      <section>
        <p className="font-mono text-[9px] tracking-widest text-ink-dim uppercase mb-3">
          FRAGTMETODE
        </p>
        <div className="flex flex-col gap-2">
          {SHIPPING_OPTIONS.map((opt) => {
            const isSelected = carrier === opt.carrier;
            return (
              <button
                key={opt.carrier}
                type="button"
                onClick={() => setCarrier(opt.carrier)}
                className={`flex items-center gap-3 p-3 border text-left transition-colors select-none active:scale-[0.99] active:opacity-90 ${
                  isSelected
                    ? "border-black bg-black/3"
                    : "border-brown/20 hover:border-brown/50"
                }`}
              >
                {/* Radio dot */}
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  isSelected ? "border-black" : "border-brown/30"
                }`}>
                  {isSelected && <div className="w-2 h-2 rounded-full bg-black" />}
                </div>

                {/* Icon */}
                {opt.methodType === "home"
                  ? <Home size={14} className={isSelected ? "text-ink" : "text-ink-dim"} />
                  : <Package size={14} className={isSelected ? "text-ink" : "text-ink-dim"} />
                }

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className={`font-body text-sm font-medium ${isSelected ? "text-ink" : "text-ink-mid"}`}>
                    {opt.label}
                  </p>
                  <p className="font-mono text-[9px] tracking-wider text-ink-dim mt-0.5">
                    {opt.description} · {opt.estimatedDays}
                  </p>
                </div>

                {/* Price */}
                <p className={`font-mono text-[11px] font-semibold shrink-0 ${isSelected ? "text-ink" : "text-ink-mid"}`}>
                  {formatPrice(opt.price)}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Prisoversigt ─────────────────────────────────────────────────────── */}
      <section className="border border-brown/15 bg-cream/40 p-4">
        <p className="font-mono text-[9px] tracking-widest text-ink-dim uppercase mb-3">
          PRISOVERSIGT
        </p>
        <div className="flex flex-col gap-1.5">
          <PriceRow label={`${product.brand} — ${product.title}`} value={formatPrice(product.price)} />
          <PriceRow label={`Fragt — ${option.label}`}             value={formatPrice(shippingPrice)} />
          <PriceRow label="Køberbeskyttelse"                       value={formatPrice(platformFee)}   dim />
        </div>
        <div className="border-t border-brown/15 mt-3 pt-3 flex justify-between items-baseline">
          <span className="font-mono text-[11px] font-semibold tracking-wider uppercase text-ink">
            Total
          </span>
          <span
            className="font-display font-semibold text-brown"
            style={{ fontSize: 20, letterSpacing: "-0.01em" }}
          >
            {formatPrice(total)}
          </span>
        </div>
        <p className="font-mono text-[8px] tracking-wider text-ink-dim mt-3 leading-relaxed">
          Køberbeskyttelse dækker dig hvis varen ikke ankommer eller ikke svarer til beskrivelsen.
        </p>
      </section>

      {/* ── Fejl ─────────────────────────────────────────────────────────────── */}
      {error && (
        <p className="font-mono text-[10px] tracking-wider text-red-500 border border-red-200 bg-red-50 px-3 py-2">
          {error}
        </p>
      )}

      {/* ── Betal ────────────────────────────────────────────────────────────── */}
      <button
        type="submit"
        disabled={pending}
        className="w-full h-14 bg-black text-white font-mono text-[12px] tracking-widest uppercase hover:bg-black/85 active:scale-[0.98] active:opacity-80 transition-[colors,transform,opacity] duration-[0ms,80ms,80ms] disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {pending ? (
          <><Loader2 size={16} className="animate-spin" /> BEHANDLER...</>
        ) : (
          `BETAL ${formatPrice(total)}`
        )}
      </button>

      <p className="font-mono text-[8px] tracking-wider text-ink-dim text-center -mt-3">
        Du sendes til Stripe for sikker betaling · Ordre + fragtlabel oprettes automatisk
      </p>
    </form>
  );
}

const inputCls =
  "h-11 px-3.5 border border-brown/20 bg-transparent font-body text-sm text-ink placeholder:text-ink-dim outline-none focus:border-brown/50 transition-colors w-full";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="font-mono text-[9px] tracking-widest text-ink-dim uppercase">{label}</label>
      {children}
    </div>
  );
}

function PriceRow({ label, value, dim }: { label: string; value: string; dim?: boolean }) {
  return (
    <div className="flex justify-between items-baseline gap-2">
      <span className={`font-mono tracking-wider truncate ${dim ? "text-[9px] text-ink-dim" : "text-[10px] text-ink-mid"}`}>
        {label}
      </span>
      <span className={`font-mono shrink-0 ${dim ? "text-[9px] text-ink-dim" : "text-[10px] text-ink-mid"}`}>
        {value}
      </span>
    </div>
  );
}
