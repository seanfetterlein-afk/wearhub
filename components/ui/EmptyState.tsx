import Link from "next/link";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({ icon, title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-5 px-6">
      {icon && <div className="text-brown/25 mb-1">{icon}</div>}
      <div>
        <p className="font-mono text-2xs tracking-editorial text-ink-dim uppercase mb-3">
          INGEN RESULTATER
        </p>
        <h2
          className="font-display font-semibold text-brown"
          style={{ fontSize: "clamp(28px, 4vw, 48px)", letterSpacing: "-0.03em", lineHeight: 1 }}
        >
          {title}
        </h2>
        <p className="text-ink-mid text-sm mt-3 max-w-xs mx-auto">{description}</p>
      </div>
      {actionLabel && actionHref && (
        <Button size="lg" asChild>
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      )}
    </div>
  );
}
