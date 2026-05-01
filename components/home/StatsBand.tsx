import type { Stat } from "@/types";

interface StatsBandProps {
  stats: Stat[];
}

export function StatsBand({ stats }: StatsBandProps) {
  return (
    <section className="border-b border-brown/20">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {stats.map(({ value, label }, i) => (
            <div
              key={label}
              className={`py-8 px-5 ${i > 0 ? "border-l border-brown/20" : ""}`}
            >
              <div
                className="font-display font-semibold text-brown leading-none"
                style={{ fontSize: "clamp(32px, 4vw, 44px)", letterSpacing: "-0.03em" }}
              >
                {value}
              </div>
              <div className="font-mono text-2xs tracking-widest text-ink-dim mt-2 uppercase">
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
