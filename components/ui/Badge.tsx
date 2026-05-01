import { cn } from "@/lib/utils";
import type { Condition } from "@/types";

// ─── Condition badge ─────────────────────────────────────────────────────────

const conditionConfig: Record<Condition, { label: string; className: string }> = {
  NY:      { label: "NY",      className: "bg-brown text-cream border-brown" },
  "SOM NY": { label: "SOM NY", className: "bg-cream text-brown border-brown" },
  GOD:     { label: "GOD",     className: "bg-paper text-ink-mid border-brown/30" },
  BRUGT:   { label: "BRUGT",   className: "bg-paper text-ink-dim border-brown/20" },
};

export function ConditionBadge({ condition }: { condition: Condition }) {
  const { label, className } = conditionConfig[condition];
  return (
    <span
      className={cn(
        "inline-flex items-center border px-2 py-0.5",
        "font-mono text-[10px] tracking-widest font-semibold uppercase",
        className,
      )}
    >
      {label}
    </span>
  );
}

// ─── Generic badge ───────────────────────────────────────────────────────────

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "brown" | "outline";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  const variants = {
    default: "bg-paper text-ink-mid border-brown/20",
    brown:   "bg-brown text-cream border-brown",
    outline: "bg-transparent text-brown border-brown",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center border px-2 py-0.5",
        "font-mono text-[10px] tracking-widest font-semibold uppercase",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

// ─── Star rating ─────────────────────────────────────────────────────────────

export function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const textSize = size === "md" ? "text-sm" : "text-xs";
  return (
    <span className={cn("font-mono text-brown font-semibold", textSize)}>
      {"★".repeat(Math.round(rating))}{"☆".repeat(5 - Math.round(rating))}
      <span className="text-ink-dim ml-1.5">{rating.toFixed(1)}</span>
    </span>
  );
}
