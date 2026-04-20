import { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Field({ label, hint, error, children, className }: { label?: ReactNode; hint?: ReactNode; error?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && <div className="label">{label}</div>}
      {children}
      {hint && !error && <div className="text-xs text-text-tertiary">{hint}</div>}
      {error && <div className="text-xs text-rose-600">{error}</div>}
    </div>
  );
}
