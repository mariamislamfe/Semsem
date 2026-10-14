"use client";

import Image from "next/image";
import type { MenuItem } from "@/lib/types";
import { formatPrice, toArabicDigits } from "@/lib/format";
import { useOrder } from "./OrderContext";

/** One dish: photo, name, description, tags, price, availability and a quantity stepper. */
export function ItemRow({ item, note, compact = false }: { item: MenuItem; note?: string; compact?: boolean }) {
  const { qty, add, remove } = useOrder();
  const q = qty(item.id);
  const orderable = item.isAvailable && item.price !== null;

  return (
    <li className={`flex items-start ${compact ? "gap-3 py-3" : "gap-4 py-5"}`}>
      <div className={`relative shrink-0 overflow-hidden rounded-full bg-char ring-2 ring-cream/80 ${compact ? "h-14 w-14" : "h-20 w-20"}`}>
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt=""
            fill
            sizes="80px"
            className={`object-cover ${item.isAvailable ? "" : "grayscale"}`}
          />
        ) : (
          <div className="khayameya h-full w-full" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-3">
          <h4 className={`font-semibold text-cream ${compact ? "text-base" : "text-lg"}`}>{item.nameAr}</h4>
          {item.nameEn && <span className="text-sm text-sand/70">{item.nameEn}</span>}
        </div>
        {note && <p className="mt-0.5 text-sm text-amber">{note}</p>}
        {item.descriptionAr && (
          <p className={`mt-1 text-sand ${compact ? "line-clamp-1 text-sm leading-6" : "leading-7"}`}>{item.descriptionAr}</p>
        )}
        {!compact && item.tags.length > 0 && (
          <p className="mt-2 flex flex-wrap gap-2">
            {item.tags.map((t) => (
              <span key={t} className="rounded-full border border-cream/15 px-2.5 py-0.5 text-xs text-sand">
                {t}
              </span>
            ))}
          </p>
        )}

        <div className={`flex items-center justify-between gap-3 ${compact ? "mt-1.5" : "mt-3"}`}>
          <span
            className={`font-display ${compact ? "text-xl" : "text-2xl"} ${item.isAvailable ? "text-amber" : "text-sand/50 line-through"}`}
          >
            {formatPrice(item.price)}
          </span>

          {!item.isAvailable ? (
            <span className="rounded-full bg-cloth/30 px-3 py-1 text-sm text-cream">خلصت النهارده</span>
          ) : !orderable ? (
            <span className="text-sm text-sand">السعر قريب</span>
          ) : q === 0 ? (
            <button
              type="button"
              onClick={() => add(item.id)}
              className="rounded-full bg-amber px-5 py-1.5 text-sm font-semibold text-ink transition-colors hover:bg-cream"
              aria-label={`ضيف ${item.nameAr} للطلب`}
            >
              + ضيف
            </button>
          ) : (
            <div className="flex items-center gap-1 rounded-full border border-amber/70 p-1" role="group" aria-label={`كمية ${item.nameAr}`}>
              <button
                type="button"
                onClick={() => remove(item.id)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-cream transition-colors hover:bg-cream/10"
                aria-label={`قلّل ${item.nameAr}`}
              >
                −
              </button>
              <span className="min-w-7 text-center tabular-nums text-cream" aria-live="polite">
                {toArabicDigits(q)}
              </span>
              <button
                type="button"
                onClick={() => add(item.id)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-amber text-lg font-semibold text-ink transition-colors hover:bg-cream"
                aria-label={`زوّد ${item.nameAr}`}
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
