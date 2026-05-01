"use client";

import { useState } from "react";
import {
  Users,
  Package,
  ShoppingBag,
  AlertTriangle,
  BarChart3,
  ShieldCheck,
  Trash2,
  Eye,
} from "lucide-react";
import { PageShell } from "@/components/ui/PageShell";
import { Tabs } from "@/components/ui/Tabs";
import { ConditionBadge } from "@/components/ui/Badge";
import { DUMMY_PRODUCTS } from "@/lib/data/products";
import { DUMMY_SELLERS } from "@/lib/data/users";
import { DUMMY_SOLD_ITEMS } from "@/lib/data/reviews";
import { formatPrice } from "@/lib/utils";

const ADMIN_TABS = [
  { key: "overview",  label: "Oversigt" },
  { key: "users",     label: "Brugere",   count: Object.keys(DUMMY_SELLERS).length },
  { key: "listings",  label: "Listings",  count: DUMMY_PRODUCTS.length },
  { key: "orders",    label: "Ordrer",    count: DUMMY_SOLD_ITEMS.length },
  { key: "reports",   label: "Rapporter", count: 3 },
];

const PLATFORM_STATS = [
  { label: "Aktive listings",    value: "12.4K", icon: Package },
  { label: "Registrerede brugere", value: "3.8K", icon: Users },
  { label: "Ordrer i dag",       value: "47",    icon: ShoppingBag },
  { label: "Åbne rapporter",     value: "3",     icon: AlertTriangle },
];

const DUMMY_REPORTS = [
  { id: "r1", type: "Falsk listing",       reporter: "nikekid_cph",    target: "Air Jordan 1 Bred",  createdAt: "2026-04-23", status: "ÅBEN" },
  { id: "r2", type: "Upassende besked",    reporter: "yeezy_dk",       target: "@spammer_user",      createdAt: "2026-04-22", status: "ÅBEN" },
  { id: "r3", type: "Falskt brand",        reporter: "supreme_sthlm",  target: "Off-White tee 001",  createdAt: "2026-04-21", status: "AFVIST" },
];

export default function AdminPage() {
  const [tab, setTab] = useState("overview");
  const sellers = Object.values(DUMMY_SELLERS);

  return (
    <PageShell>
      <div className="max-w-[1400px] mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck size={16} className="text-brown" />
          <p className="font-mono text-2xs tracking-editorial text-ink-dim uppercase">
            ADMIN PANEL
          </p>
        </div>
        <h1
          className="font-display font-semibold text-brown leading-none mb-8"
          style={{ fontSize: "clamp(28px, 4vw, 48px)", letterSpacing: "-0.03em" }}
        >
          KONTROLPANEL
        </h1>

        {/* Tabs */}
        <Tabs tabs={ADMIN_TABS} active={tab} onChange={setTab} className="mb-8" />

        {/* ── Overview ── */}
        {tab === "overview" && (
          <div className="flex flex-col gap-8">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 border border-brown/20 divide-x divide-brown/20 overflow-hidden">
              {PLATFORM_STATS.map(({ label, value, icon: Icon }) => (
                <div key={label} className="p-6">
                  <Icon size={15} className="text-ink-dim mb-3" />
                  <div
                    className="font-display font-semibold text-brown"
                    style={{ fontSize: "clamp(24px, 3vw, 36px)", letterSpacing: "-0.02em", lineHeight: 1 }}
                  >
                    {value}
                  </div>
                  <p className="font-mono text-[9px] tracking-widest text-ink-dim uppercase mt-1.5">
                    {label}
                  </p>
                </div>
              ))}
            </div>

            {/* Recent orders */}
            <div>
              <p className="font-mono text-2xs tracking-widest text-ink-dim uppercase mb-4">
                SENESTE ORDRER
              </p>
              <AdminTable
                headers={["ITEM", "SÆLGER", "PRIS", "DATO"]}
                rows={DUMMY_SOLD_ITEMS.map((item) => [
                  item.product.title,
                  `@${item.buyerUsername}`,
                  formatPrice(item.product.price),
                  new Date(item.soldAt).toLocaleDateString("da-DK"),
                ])}
              />
            </div>
          </div>
        )}

        {/* ── Users ── */}
        {tab === "users" && (
          <div className="border border-brown/20 overflow-hidden">
            <div className="hidden sm:grid grid-cols-[1fr_100px_80px_80px_100px] gap-4 px-5 py-3 bg-cream border-b border-brown/15">
              {["BRUGER", "LOKATION", "SALG", "RATING", ""].map((h) => (
                <span key={h} className="font-mono text-[9px] tracking-widest text-ink-dim uppercase">{h}</span>
              ))}
            </div>
            {sellers.map((seller, i) => (
              <div
                key={seller.id}
                className={`flex sm:grid sm:grid-cols-[1fr_100px_80px_80px_100px] items-center gap-4 px-5 py-4 flex-wrap ${i > 0 ? "border-t border-brown/10" : ""}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 bg-brown-deep flex items-center justify-center text-cream font-mono text-[10px] font-bold shrink-0">
                    {seller.displayName.split(" ").map(n => n[0]).join("").toUpperCase()}
                  </div>
                  <div>
                    <p className="font-body text-sm font-medium text-ink">{seller.displayName}</p>
                    <p className="font-mono text-[9px] text-ink-dim">@{seller.username}</p>
                  </div>
                  {seller.isVerified && <ShieldCheck size={11} className="text-brown shrink-0" />}
                </div>
                <span className="font-mono text-[11px] text-ink-dim truncate">{seller.location}</span>
                <span className="font-mono text-[11px] text-ink-mid">{seller.totalSales}</span>
                <span className="font-mono text-[11px] text-brown font-bold">{seller.rating.toFixed(1)}</span>
                <div className="flex gap-1 ml-auto sm:ml-0">
                  <AdminActionBtn title="Se profil"><Eye size={12} /></AdminActionBtn>
                  <AdminActionBtn title="Slet bruger" danger><Trash2 size={12} /></AdminActionBtn>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Listings ── */}
        {tab === "listings" && (
          <div className="border border-brown/20 overflow-hidden">
            <div className="hidden sm:grid grid-cols-[1fr_80px_100px_80px_80px] gap-4 px-5 py-3 bg-cream border-b border-brown/15">
              {["ITEM", "STAND", "PRIS", "VISNINGER", ""].map((h) => (
                <span key={h} className="font-mono text-[9px] tracking-widest text-ink-dim uppercase">{h}</span>
              ))}
            </div>
            {DUMMY_PRODUCTS.map((product, i) => (
              <div
                key={product.id}
                className={`flex sm:grid sm:grid-cols-[1fr_80px_100px_80px_80px] items-center gap-4 px-5 py-4 flex-wrap ${i > 0 ? "border-t border-brown/10" : ""}`}
              >
                <div className="min-w-0">
                  <p className="font-mono text-[9px] tracking-widest text-ink-dim uppercase">{product.brand}</p>
                  <p className="font-body text-sm font-medium text-ink truncate">{product.title}</p>
                </div>
                <ConditionBadge condition={product.condition} />
                <span className="font-display font-semibold text-brown" style={{ fontSize: 15 }}>
                  {formatPrice(product.price)}
                </span>
                <span className="font-mono text-[11px] text-ink-dim">{product.views ?? 0}</span>
                <div className="flex gap-1 ml-auto sm:ml-0">
                  <AdminActionBtn title="Se listing"><Eye size={12} /></AdminActionBtn>
                  <AdminActionBtn title="Fjern listing" danger><Trash2 size={12} /></AdminActionBtn>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Orders ── */}
        {tab === "orders" && (
          <AdminTable
            headers={["ITEM", "KØBER", "SALGSPRIS", "UDBETALT", "DATO"]}
            rows={DUMMY_SOLD_ITEMS.map((item) => [
              item.product.title,
              `@${item.buyerUsername}`,
              formatPrice(item.product.price),
              formatPrice(item.payout),
              new Date(item.soldAt).toLocaleDateString("da-DK"),
            ])}
          />
        )}

        {/* ── Reports ── */}
        {tab === "reports" && (
          <div className="border border-brown/20 overflow-hidden">
            <div className="hidden sm:grid grid-cols-[120px_1fr_120px_80px_80px] gap-4 px-5 py-3 bg-cream border-b border-brown/15">
              {["TYPE", "MÅL", "REPORTER", "DATO", "STATUS"].map((h) => (
                <span key={h} className="font-mono text-[9px] tracking-widest text-ink-dim uppercase">{h}</span>
              ))}
            </div>
            {DUMMY_REPORTS.map((report, i) => (
              <div
                key={report.id}
                className={`flex sm:grid sm:grid-cols-[120px_1fr_120px_80px_80px] items-center gap-4 px-5 py-4 flex-wrap ${i > 0 ? "border-t border-brown/10" : ""}`}
              >
                <span className="font-mono text-[10px] tracking-wider text-brown font-bold uppercase">
                  {report.type}
                </span>
                <span className="font-body text-sm text-ink">{report.target}</span>
                <span className="font-mono text-[10px] text-ink-dim">@{report.reporter}</span>
                <span className="font-mono text-[10px] text-ink-dim">{report.createdAt}</span>
                <span className={`font-mono text-[9px] tracking-wider font-bold uppercase px-2 py-0.5 border ${
                  report.status === "ÅBEN"
                    ? "border-brown text-brown"
                    : "border-brown/20 text-ink-dim"
                }`}>
                  {report.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function AdminTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  const cols = `repeat(${headers.length}, 1fr)`;
  return (
    <div className="border border-brown/20 overflow-hidden">
      <div
        className="hidden sm:grid gap-4 px-5 py-3 bg-cream border-b border-brown/15"
        style={{ gridTemplateColumns: cols }}
      >
        {headers.map((h) => (
          <span key={h} className="font-mono text-[9px] tracking-widest text-ink-dim uppercase">{h}</span>
        ))}
      </div>
      {rows.map((row, i) => (
        <div
          key={i}
          className="grid gap-4 px-5 py-3 text-sm"
          style={{ gridTemplateColumns: cols }}
        >
          {row.map((cell, j) => (
            <span key={j} className={j === 0 ? "font-body text-ink font-medium truncate" : "font-mono text-[11px] text-ink-mid"}>
              {cell}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

function AdminActionBtn({
  children,
  title,
  danger,
}: {
  children: React.ReactNode;
  title: string;
  danger?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={() => alert(`${title} (kræver backend)`)}
      className={`w-7 h-7 flex items-center justify-center transition-colors ${
        danger
          ? "text-ink-dim hover:text-red-500"
          : "text-ink-dim hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
