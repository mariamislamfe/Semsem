"use client";

import { useMemo, useState, useTransition } from "react";
import { createOrder, type ActionResult } from "@/app/actions";
import { formatPrice, toArabicDigits } from "@/lib/format";
import { recommend } from "@/lib/recommend";
import { Sheet } from "./Sheet";
import { useOrder } from "./OrderContext";

export function CheckoutSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { categories, cart, lines, total, priced, count, add, remove, clear, notes, removeNote } = useOrder();
  const [seating, setSeating] = useState<"table" | "floor">("table");
  const [tableLabel, setTableLabel] = useState("");
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, start] = useTransition();

  const suggestions = useMemo(() => recommend(categories, cart), [categories, cart]);

  const close = () => {
    if (result?.ok) {
      clear();
      setResult(null);
      setNote("");
    }
    onClose();
  };

  const submit = () =>
    start(async () => {
      const res = await createOrder({
        lines: lines.map((l) => ({ id: l.item.id, qty: l.qty })),
        seating,
        tableLabel,
        name,
        note: [...notes, note].filter(Boolean).join(" — "),
      });
      setResult(res);
    });

  return (
    <Sheet
      open={open}
      onClose={close}
      title={result?.ok ? "وصل طلبك" : "طلبك"}
      footer={
        result?.ok ? (
          <button
            type="button"
            onClick={close}
            className="w-full rounded-full bg-amber py-3 font-semibold text-ink transition-colors hover:bg-cream"
          >
            تمام
          </button>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-sand">الإجمالي</p>
              <p className="font-display text-3xl text-amber">{priced ? formatPrice(total) : "—"}</p>
            </div>
            <button
              type="button"
              disabled={pending || lines.length === 0 || !priced}
              onClick={submit}
              className="rounded-full bg-amber px-8 py-3 font-semibold text-ink transition-colors hover:bg-cream disabled:opacity-50"
            >
              {pending ? "بنبعت.." : "ابعت الطلب"}
            </button>
          </div>
        )
      }
    >
      {result?.ok ? (
        <div className="py-8 text-center">
          <p className="font-display text-5xl text-amber">بالهنا والشفا</p>
          <p className="mt-4 text-cream">{result.summary}</p>
          {result.demo && (
            <p className="stitch mx-auto mt-6 max-w-sm rounded-xl bg-cloth/10 px-4 py-3 text-sm leading-7 text-cream">
              ده عرض تجريبي — الطلب ماتبعتش لأي حد لأن الموقع لسه مش متوصّل بقاعدة البيانات.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-6 pb-4">
          {lines.length === 0 ? (
            <p className="py-10 text-center text-sand">الطلب فاضي. افتح أي طبق من السفرة وضيف اللي يعجبك.</p>
          ) : (
            <ul className="divide-y divide-cream/10">
              {lines.map(({ item, qty }) => (
                <li key={item.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-cream">{item.nameAr}</p>
                    <p className="text-sm text-sand">{formatPrice(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-1 rounded-full border border-amber/70 p-1">
                    <button type="button" onClick={() => remove(item.id)} aria-label={`قلّل ${item.nameAr}`} className="h-8 w-8 rounded-full text-lg text-cream hover:bg-cream/10">
                      −
                    </button>
                    <span className="min-w-7 text-center tabular-nums text-cream">{toArabicDigits(qty)}</span>
                    <button type="button" onClick={() => add(item.id)} aria-label={`زوّد ${item.nameAr}`} className="h-8 w-8 rounded-full bg-amber text-lg font-semibold text-ink hover:bg-cream">
                      +
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {notes.length > 0 && (
            <ul className="space-y-2">
              {notes.map((n, i) => (
                <li key={`${n}-${i}`} className="flex items-center justify-between gap-3 rounded-xl bg-cream/5 px-4 py-2 text-sm text-cream">
                  <span>{n}</span>
                  <button type="button" onClick={() => removeNote(i)} className="text-sand hover:text-amber" aria-label={`شيل الملاحظة: ${n}`}>
                    شيل
                  </button>
                </li>
              ))}
            </ul>
          )}

          {suggestions.length > 0 && (
            <section aria-labelledby="sugg" className="rounded-2xl border border-amber/40 bg-amber/5 p-4">
              <h4 id="sugg" className="font-display text-2xl text-amber">
                ناقصك حاجة؟
              </h4>
              <ul className="mt-2 space-y-3">
                {suggestions.map(({ item, reason }) => (
                  <li key={item.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-cream">
                        {item.nameAr} <span className="text-sm font-normal text-sand">— {formatPrice(item.price)}</span>
                      </p>
                      <p className="text-sm text-sand">{reason}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => add(item.id)}
                      className="shrink-0 rounded-full border border-amber px-4 py-1.5 text-sm text-amber transition-colors hover:bg-amber hover:text-ink"
                    >
                      + ضيف
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {lines.length > 0 && (
            <fieldset className="space-y-4">
              <legend className="mb-2 text-sm text-sand">هتقعد فين؟</legend>
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    ["table", "على ترابيزة"],
                    ["floor", "على الأرض"],
                  ] as const
                ).map(([v, label]) => (
                  <label
                    key={v}
                    className={`cursor-pointer rounded-xl border px-4 py-3 text-center transition-colors ${
                      seating === v ? "border-amber bg-amber/10 text-cream" : "border-cream/20 text-sand"
                    }`}
                  >
                    <input type="radio" name="seating" value={v} checked={seating === v} onChange={() => setSeating(v)} className="sr-only" />
                    {label}
                  </label>
                ))}
              </div>
              {seating === "table" && (
                <input
                  value={tableLabel}
                  onChange={(e) => setTableLabel(e.target.value)}
                  maxLength={20}
                  placeholder="رقم الترابيزة (لو تعرفه)"
                  className="w-full rounded-xl border border-cream/20 bg-ink/60 px-4 py-3 text-cream placeholder:text-sand/60"
                />
              )}
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                placeholder="اسمك (اختياري)"
                className="w-full rounded-xl border border-cream/20 bg-ink/60 px-4 py-3 text-cream placeholder:text-sand/60"
              />
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={300}
                rows={2}
                placeholder="أي ملاحظة؟ (من غير بصل.. زيادة حرارة..)"
                className="w-full rounded-xl border border-cream/20 bg-ink/60 px-4 py-3 text-cream placeholder:text-sand/60"
              />
            </fieldset>
          )}

          {result && !result.ok && (
            <p role="alert" className="rounded-xl bg-cloth/30 px-4 py-3 text-cream">
              {result.error}
            </p>
          )}
          <p className="text-xs text-sand/70">{toArabicDigits(count)} صنف في الطلب.</p>
        </div>
      )}
    </Sheet>
  );
}
