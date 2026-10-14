"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useState } from "react";
import type { CategoryWithItems } from "@/lib/types";
import { formatPrice, toArabicDigits } from "@/lib/format";
import { scrollToEl } from "@/lib/lenis";
import { CheckoutSheet } from "./CheckoutSheet";
import { ItemRow } from "./ItemRow";
import { MenuList } from "./MenuList";
import { OrderProvider, useOrder } from "./OrderContext";
import { Reveal } from "./Reveal";
import { SofraTable } from "./SofraTable";
import { TeaCorner } from "./TeaCorner";

interface Props {
  categories: CategoryWithItems[];
  isSample: boolean;
}

/**
 * السفرة + ركن الشاي. The food lives on the table; drinks get their own corner
 * right after it. One shared order (cart, suggestions, checkout) spans both.
 */
export function MenuSection({ categories, isSample }: Props) {
  const [checkout, setCheckout] = useState(false);
  if (categories.length === 0) {
    return <p className="px-6 py-24 text-center text-sand">المنيو لسه بيتجهّز.. ارجع لنا قريب.</p>;
  }
  return (
    <OrderProvider categories={categories}>
      <Table categories={categories} isSample={isSample} />
      <TeaCorner />
      <CartBar onCheckout={() => setCheckout(true)} hidden={checkout} />
      <CheckoutSheet open={checkout} onClose={() => setCheckout(false)} />
    </OrderProvider>
  );
}

function Table({ categories, isSample }: Props) {
  const [view, setView] = useState<"table" | "list">("table");
  const [selected, setSelected] = useState<string | null>(null);
  // drinks have their own corner; everything else sits on the table
  const food = categories.filter((c) => c.slug !== "drinks");
  const current = food.find((c) => c.slug === selected) ?? null;

  const select = useCallback((slug: string) => {
    setSelected(slug);
    // on narrow screens the list lands under the table — bring it into view
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      window.setTimeout(() => {
        const el = document.getElementById("menu-panel");
        if (el) scrollToEl(el, -80);
      }, 650);
    }
  }, []);

  return (
    <section
      id="sofra"
      className="relative px-4 py-24 md:px-8 md:py-32"
      style={{
        // the tablecloth the camera landed on: bright at the top, settling into the night as you read
        backgroundColor: "#120d0b",
        backgroundImage:
          "linear-gradient(to bottom, rgba(18,13,11,.6) 0, rgba(18,13,11,.6) 6svh, rgba(18,13,11,.8) 24svh, rgba(18,13,11,.94) 62svh, #15100d 100%), url(/patterns/khayameya.svg)",
        backgroundSize: "100% 100%, 170px 170px",
      }}
    >
      <div className="mx-auto max-w-6xl">
        <Reveal as="header" className="mx-auto max-w-2xl text-center">
          <p className="font-latin text-sm italic tracking-[0.35em] text-amber">THE TABLE</p>
          <h2 className="mt-4 font-display text-[clamp(3rem,8vw,6rem)] leading-[1.1] text-cream">السفرة مفروشة</h2>
          <p className="mt-4 text-lg leading-8 text-sand">اضغط على أي طبق — الترابيزة هتلف وتفتحلك أنواعه.</p>
        </Reveal>

        {isSample && (
          <p className="stitch mx-auto mt-8 max-w-2xl rounded-xl bg-cloth/10 px-5 py-3 text-center text-sm leading-7 text-cream">
            <strong className="text-amber">منيو تجريبي:</strong> الأطباق والأسعار والصور هنا مؤقتة لعرض التصميم بس، ومش المنيو الرسمي لسمسم.
          </p>
        )}

        <div className="mt-8 flex justify-center">
          <div role="group" aria-label="طريقة العرض" className="flex rounded-full border border-cream/20 p-1 text-sm">
            {(
              [
                ["table", "على السفرة"],
                ["list", "منيو مكتوب"],
              ] as const
            ).map(([v, label]) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => setView(v)}
                className={`rounded-full px-4 py-1.5 transition-colors ${
                  view === v ? "bg-cream text-ink" : "text-sand hover:text-cream"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {view === "table" ? (
          <div className="mt-10 grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
            {/* first grid column = right side in RTL: the table */}
            <div>
              <SofraTable categories={food} selected={selected} onSelect={select} />
              {/* the same choices as plain buttons: keyboard, screen readers, quick taps */}
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {food.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={c.slug === selected}
                    onClick={() => select(c.slug)}
                    className={`rounded-full border px-5 py-2 text-sm transition-colors ${
                      c.slug === selected
                        ? "border-amber bg-amber text-ink"
                        : "border-cream/20 text-cream hover:border-amber hover:text-amber"
                    }`}
                  >
                    {c.nameAr}
                  </button>
                ))}
              </div>
            </div>

            {/* second column = left side: what you picked */}
            <div id="menu-panel" className="min-h-[360px]">
              <AnimatePresence mode="wait" initial={false}>
                {current ? (
                  <motion.div
                    key={current.id}
                    initial={{ opacity: 0, x: -40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="rounded-3xl border border-cream/10 bg-char/60 p-5 md:p-7"
                  >
                    <p className="font-latin text-xs italic tracking-[0.3em] text-amber">
                      {current.nameEn?.toUpperCase()} / {toArabicDigits(current.items.length)}
                    </p>
                    <h3 className="font-display text-5xl leading-tight text-cream">{current.nameAr}</h3>
                    {current.blurbAr && <p className="mt-1 text-sand">{current.blurbAr}</p>}
                    <ul data-lenis-prevent className="mt-2 max-h-[62svh] divide-y divide-cream/10 overflow-y-auto overscroll-contain px-1">
                      {current.items.map((it) => (
                        <ItemRow key={it.id} item={it} />
                      ))}
                    </ul>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="stitch flex min-h-[360px] flex-col items-center justify-center rounded-3xl px-8 text-center"
                  >
                    <svg width="44" height="24" viewBox="0 0 44 24" fill="none" className="hidden text-amber lg:block" aria-hidden>
                      <path d="M42 12H4m0 0l9-9m-9 9l9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="mt-3 font-display text-4xl text-cream">اختار طبق من الترابيزة</p>
                    <p className="mt-2 text-sand">وأنواعه هتظهر هنا، وتضيف اللي يعجبك للطلب.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <MenuList categories={categories} />
        )}
      </div>
    </section>
  );
}

function CartBar({ onCheckout, hidden }: { onCheckout: () => void; hidden: boolean }) {
  const { count, total, priced, categories, cart } = useOrder();
  const drinks = categories.find((c) => c.slug === "drinks");
  const missingDrink = !!drinks && !drinks.items.some((i) => (cart.get(i.id) ?? 0) > 0);
  return (
    <AnimatePresence>
      {count > 0 && !hidden && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 28 }}
          className="fixed inset-x-4 bottom-4 z-[60] mx-auto max-w-xl"
        >
          <button
            type="button"
            onClick={onCheckout}
            className="flex w-full items-center justify-between gap-4 rounded-2xl bg-amber px-5 py-3 text-ink shadow-[0_10px_40px_rgba(0,0,0,.6)] transition-colors hover:bg-cream"
          >
            <span className="text-start">
              <span className="block text-sm font-semibold sm:text-base">
                طلبك: {toArabicDigits(count)} صنف {priced && <>— {formatPrice(total)}</>}
              </span>
              {missingDrink && <span className="block text-xs sm:text-sm">ناقصك مشروب؟ شوف اقتراحاتنا</span>}
            </span>
            <span className="shrink-0 whitespace-nowrap rounded-full bg-ink px-4 py-1.5 text-sm font-semibold text-cream">كمّل ←</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
