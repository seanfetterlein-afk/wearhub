"use client";

import { cn } from "@/lib/utils";

interface Tab {
  key: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (key: string) => void;
  className?: string;
}

export function Tabs({ tabs, active, onChange, className }: TabsProps) {
  return (
    <div className={cn("flex border-b border-brown/20 overflow-x-auto", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            "shrink-0 px-5 py-3 font-mono text-[11px] tracking-widest uppercase transition-colors",
            "border-b-2 -mb-px",
            active === tab.key
              ? "border-brown text-brown font-bold"
              : "border-transparent text-ink-dim hover:text-ink-mid",
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span
              className={cn(
                "ml-2 font-mono text-[10px] px-1.5 py-0.5",
                active === tab.key
                  ? "bg-brown text-cream"
                  : "bg-brown/10 text-ink-mid",
              )}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
