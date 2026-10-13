"use client";

import { useState } from "react";
import type { CategoryWithItems } from "@/lib/types";
import { toArabicDigits } from "@/lib/format";
import { ItemRow } from "./ItemRow";

/**
 * The plain, scannable menu: one category at a time (tabs), items in two
 * compact columns on wide screens — so it never turns into one long scroll.
 */
export function MenuList({ categories }: { categories: CategoryWithItems[] }) {
  const [active, setActive] = useState(categories[0]?.slug ?? "");
  const current = categories.find((c) => c.slug === active) ?? categories[0];
  if (!current) return null;

  return (
    <div className="mx-auto mt-10 max-w-4xl">
      <div
        role="tablist"
        aria-label="أقسام المنيو"
        className="no-scrollbar flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:justify-center"
      >
        {categories.map((c) => {
          const on = c.slug === current.slug;
          return (
            <button
              key={c.id}
              id={`tab-${c.slug}`}
              role="tab"
              type="button"
              aria-selected={on}
              aria-controls={`panel-${c.slug}`}
              onClick={() => setActive(c.slug)}
              className={`shrink-0 rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                on ? "bg-amber text-ink" : "border border-cream/20 text-cream hover:border-amber hover:text-amber"
              }`}
            >
              {c.nameAr}
              <span className={`ms-2 text-xs ${on ? "text-ink/70" : "text-sand"}`}>{toArabicDigits(c.items.length)}</span>
            </button>
          );
        })}
      </div>

      <section
        id={`panel-${current.slug}`}
        role="tabpanel"
        aria-labelledby={`tab-${current.slug}`}
        className="mt-6 rounded-3xl border border-cream/10 bg-char/50 px-5 py-4 md:px-8"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-display text-4xl text-amber">{current.nameAr}</h3>
          {current.blurbAr && <p className="text-sm text-sand">{current.blurbAr}</p>}
        </div>
        <ul className="mt-2 grid gap-x-10 divide-y divide-cream/10 md:grid-cols-2 md:divide-y-0">
          {current.items.map((it) => (
            <ItemRow key={it.id} item={it} compact />
          ))}
        </ul>
      </section>
    </div>
  );
}
