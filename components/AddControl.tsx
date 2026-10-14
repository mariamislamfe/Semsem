"use client";

import type { MenuItem } from "@/lib/types";
import { toArabicDigits } from "@/lib/format";
import { useOrder } from "./OrderContext";

/** "+ ضيف" that becomes a − n + stepper once the dish is in the order. */
export function AddControl({ item, tone = "light" }: { item: MenuItem; tone?: "light" | "dark" }) {
  const { qty, add, remove } = useOrder();
  const q = qty(item.id);
  if (!item.isAvailable) {
    return <span className="rounded-full bg-ink/40 px-4 py-1.5 text-sm text-cream">خلصت النهارده</span>;
  }
  if (item.price === null) return <span className="text-sm text-cream/80">السعر قريب</span>;
  const ring = tone === "light" ? "border-cream/70 text-cream" : "border-ink/40 text-ink";
  if (q === 0) {
    return (
      <button
        type="button"
        onClick={() => add(item.id)}
        aria-label={`ضيف ${item.nameAr} للطلب`}
        className="rounded-full bg-cream px-5 py-1.5 text-sm font-semibold text-cloth-deep transition-colors hover:bg-amber hover:text-ink"
      >
        + ضيف
      </button>
    );
  }
  return (
    <div className={`flex items-center gap-1 rounded-full border p-1 ${ring}`} role="group" aria-label={`كمية ${item.nameAr}`}>
      <button type="button" onClick={() => remove(item.id)} aria-label={`قلّل ${item.nameAr}`} className="h-8 w-8 rounded-full text-lg hover:bg-cream/15">
        −
      </button>
      <span className="min-w-6 text-center tabular-nums" aria-live="polite">
        {toArabicDigits(q)}
      </span>
      <button
        type="button"
        onClick={() => add(item.id)}
        aria-label={`زوّد ${item.nameAr}`}
        className="h-8 w-8 rounded-full bg-cream text-lg font-semibold text-cloth-deep hover:bg-amber hover:text-ink"
      >
        +
      </button>
    </div>
  );
}
