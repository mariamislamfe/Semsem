"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { lockScroll, unlockScroll } from "@/lib/lenis";

/** Bottom sheet: opacity/transform only, focus moves in, Esc and backdrop close. */
export function Sheet({
  open,
  onClose,
  title,
  eyebrow,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    lockScroll();
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      unlockScroll();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center">
          <motion.div
            className="absolute inset-0 bg-black/75"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="relative flex max-h-[88svh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-cream/10 bg-soot shadow-[0_-20px_60px_rgba(0,0,0,.6)]"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 32 }}
          >
            <div className="flex items-start justify-between gap-4 border-b border-cream/10 px-6 pb-4 pt-5">
              <div>
                {eyebrow && <p className="font-latin text-xs italic tracking-[0.3em] text-amber">{eyebrow}</p>}
                <h3 className="font-display text-4xl leading-tight text-cream">{title}</h3>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label="قفل"
                className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-cream/20 text-cream transition-colors hover:border-amber hover:text-amber"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
                  <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div data-lenis-prevent className="overflow-y-auto overscroll-contain px-6 py-2">
              {children}
            </div>
            {footer && <div className="border-t border-cream/10 bg-ink/60 px-6 py-4">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
