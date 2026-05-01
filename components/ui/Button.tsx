import React from "react";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "outline" | "ghost" | "inverse";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Render styles onto the single child element instead of a <button> */
  asChild?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-brown text-cream border border-brown hover:bg-brown-deep hover:border-brown-deep",
  outline: "bg-transparent text-brown border border-brown hover:bg-brown hover:text-cream",
  ghost:   "bg-transparent text-ink border border-brown/20 hover:border-brown/40",
  inverse: "bg-cream text-brown border border-cream hover:bg-cream-deep hover:border-cream-deep",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-[34px] px-3.5 text-[11px]",
  md: "h-11 px-5 text-[13px]",
  lg: "h-[52px] px-6 text-sm",
};

const BASE =
  "inline-flex items-center justify-center gap-2 font-body font-semibold tracking-wider uppercase transition-colors duration-150 disabled:opacity-40 disabled:pointer-events-none";

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  asChild = false,
  ...props
}: ButtonProps) {
  const composedClass = cn(
    BASE,
    variantClasses[variant],
    sizeClasses[size],
    className,
  );

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ className?: string }>, {
      className: cn(
        composedClass,
        (children as React.ReactElement<{ className?: string }>).props.className,
      ),
    });
  }

  return (
    <button className={composedClass} {...props}>
      {children}
    </button>
  );
}
