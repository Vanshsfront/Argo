import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "neumorphic" | "neumorphic-sm" | "flat" | "stat-pill";

interface Props extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
}

export function Card({ className, variant = "neumorphic", ...rest }: Props) {
  const v =
    variant === "neumorphic"
      ? "neumorphic-card"
      : variant === "neumorphic-sm"
        ? "neumorphic-card-sm"
        : variant === "stat-pill"
          ? "stat-pill"
          : "bg-surface border border-border-light rounded-3xl";
  return <div className={cn(v, className)} {...rest} />;
}

export function CardHeader({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 py-4 border-b border-border-light", className)} {...rest} />;
}

export function CardContent({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 py-4", className)} {...rest} />;
}

export function CardFooter({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "px-5 py-3 bg-surface-secondary border-t border-border-light rounded-b-[inherit]",
        className,
      )}
      {...rest}
    />
  );
}
