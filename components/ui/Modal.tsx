"use client";
import { ReactNode, useEffect } from "react";
import { cn } from "@/lib/cn";
import { CloseIcon } from "./Icon";

type Size = "sm" | "md" | "lg" | "xl";

const sizes: Record<Size, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
  xl: "max-w-3xl",
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: Size;
}) {
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className={cn(
            "relative w-full bg-surface rounded-3xl shadow-cal-xl border border-border-light",
            "max-h-[90vh] flex flex-col overflow-hidden",
            sizes[size],
          )}
        >
          {(title || description) && (
            <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4 border-b border-border-light">
              <div className="min-w-0">
                {title && (
                  <div className="text-base font-semibold text-text-primary tracking-tight truncate">{title}</div>
                )}
                {description && (
                  <div className="mt-0.5 text-xs text-text-secondary truncate">{description}</div>
                )}
              </div>
              <button
                aria-label="Close"
                className="shrink-0 w-8 h-8 rounded-full text-text-tertiary hover:text-text-primary hover:bg-surface-secondary flex items-center justify-center transition-colors"
                onClick={onClose}
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="flex-1 overflow-auto px-5 py-5">{children}</div>
          {footer && (
            <div className="px-5 py-4 border-t border-border-light bg-surface-secondary flex items-center justify-end gap-2 rounded-b-3xl">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
