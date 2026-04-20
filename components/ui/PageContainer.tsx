import { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { ChevronLeftIcon } from "./Icon";

interface Props {
  children: ReactNode;
  className?: string;
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  back?: { href: string; label?: string };
  /** Narrow reading width (3xl) vs wide work surfaces (kanban, tables). */
  size?: "narrow" | "wide";
}

export function PageContainer({ children, className, title, description, action, back, size = "narrow" }: Props) {
  const max = size === "wide" ? "max-w-[1400px]" : "max-w-5xl";
  return (
    <div className={cn("px-4 md:px-8 pt-6 md:pt-10 pb-8", className)}>
      <div className={cn("mx-auto w-full", max)}>
        {back && (
          <Link
            href={back.href}
            className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary mb-4 group"
          >
            <ChevronLeftIcon className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            {back.label || "Back"}
          </Link>
        )}
        {(title || action) && (
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4 mb-6">
            <div className="min-w-0">
              {title && (
                <h1 className="text-2xl md:text-[28px] font-semibold text-text-primary tracking-tight truncate">
                  {title}
                </h1>
              )}
              {description && (
                <p className="mt-1 text-sm text-text-secondary truncate">{description}</p>
              )}
            </div>
            {action && (
              <div className="flex items-center gap-2 flex-wrap md:flex-nowrap md:shrink-0">
                {action}
              </div>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function Section({ title, action, children, className }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("space-y-3", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 px-1">
          {title && <h2 className="text-sm font-semibold text-text-secondary tracking-tight">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
