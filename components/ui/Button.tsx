import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "xs" | "sm" | "md" | "lg";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  pill?: boolean;
  isLoading?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus:outline-none focus-ring disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary: "bg-text-primary text-background hover:opacity-90 shadow-cal-sm",
  secondary: "bg-surface-secondary text-text-primary border border-border-light hover:bg-surface",
  outline: "bg-surface text-text-primary border border-border hover:bg-surface-secondary",
  ghost: "bg-transparent text-text-primary hover:bg-surface-secondary",
  danger: "bg-rose-600 text-white hover:bg-rose-700",
};

const sizes: Record<Size, string> = {
  xs: "px-2.5 py-1 text-xs",
  sm: "px-3.5 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "outline", size = "md", pill = true, className, isLoading, disabled, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(base, variants[variant], sizes[size], pill ? "rounded-full" : "rounded-2xl", className)}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading ? <Spinner /> : children}
    </button>
  );
});

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M22 12a10 10 0 01-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
