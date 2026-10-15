"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import type { CategoryWithItems } from "@/lib/types";
import { formatPrice, toArabicDigits } from "@/lib/format";
import { CheckoutSheet } from "./CheckoutSheet";
import { OrderProvider, useOrder } from "./OrderContext";
import { Sofra } from "./Sofra";
import { Stitch } from "./ScrollFX";
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
      <Sofra categories={categories.filter((c) => c.slug !== "drinks")} all={categories} isSample={isSample} />
      <Stitch className="bg-[#110a06]" tone="#e4a72e" />
      <TeaCorner />
      <CartBar onCheckout={() => setCheckout(true)} hidden={checkout} />
      <CheckoutSheet open={checkout} onClose={() => setCheckout(false)} />
    </OrderProvider>
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
