import Link from "next/link";

interface SectionHeaderProps {
  num: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionHref?: string;
}

export function SectionHeader({
  num,
  title,
  subtitle,
  actionLabel,
  actionHref,
}: SectionHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-6 mb-7 pb-5 border-b border-brown/20">
      <div>
        <p className="font-mono text-2xs tracking-widest text-ink-dim mb-1.5 uppercase">
          SECTION / {num}
        </p>
        <h2
          className="font-display font-semibold text-brown leading-none"
          style={{ fontSize: "clamp(32px, 4vw, 52px)", letterSpacing: "-0.03em" }}
        >
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-ink-mid mt-2.5 max-w-xl">{subtitle}</p>
        )}
      </div>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="shrink-0 border border-brown text-brown font-body font-semibold text-[11px] tracking-wider uppercase px-[18px] py-2.5 hover:bg-brown hover:text-cream transition-colors whitespace-nowrap"
        >
          {actionLabel} →
        </Link>
      )}
    </div>
  );
}
