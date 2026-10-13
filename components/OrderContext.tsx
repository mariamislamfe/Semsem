"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { CategoryWithItems, MenuItem } from "@/lib/types";

export interface CartLine {
  item: MenuItem;
  qty: number;
}

interface Ctx {
  categories: CategoryWithItems[];
  cart: ReadonlyMap<string, number>;
  lines: CartLine[];
  count: number;
  total: number;
  /** true if every line has a price */
  priced: boolean;
  qty: (id: string) => number;
  add: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
}

const OrderCtx = createContext<Ctx | null>(null);
const MAX_QTY = 20;

export function OrderProvider({
  categories,
  children,
}: {
  categories: CategoryWithItems[];
  children: React.ReactNode;
}) {
  const [cart, setCart] = useState<ReadonlyMap<string, number>>(new Map());

  const index = useMemo(() => {
    const m = new Map<string, MenuItem>();
    for (const c of categories) for (const i of c.items) m.set(i.id, i);
    return m;
  }, [categories]);

  const add = useCallback(
    (id: string) =>
      setCart((prev) => {
        const item = index.get(id);
        if (!item || !item.isAvailable) return prev;
        const next = new Map(prev);
        next.set(id, Math.min(MAX_QTY, (prev.get(id) ?? 0) + 1));
        return next;
      }),
    [index],
  );
  const remove = useCallback(
    (id: string) =>
      setCart((prev) => {
        const cur = prev.get(id) ?? 0;
        if (cur === 0) return prev;
        const next = new Map(prev);
        if (cur <= 1) next.delete(id);
        else next.set(id, cur - 1);
        return next;
      }),
    [],
  );
  const clear = useCallback(() => setCart(new Map()), []);

  const value = useMemo<Ctx>(() => {
    const lines: CartLine[] = [];
    let total = 0;
    let count = 0;
    let priced = true;
    for (const [id, qty] of cart) {
      const item = index.get(id);
      if (!item) continue;
      lines.push({ item, qty });
      count += qty;
      if (item.price === null) priced = false;
      else total += item.price * qty;
    }
    return {
      categories,
      cart,
      lines,
      count,
      total,
      priced,
      qty: (id) => cart.get(id) ?? 0,
      add,
      remove,
      clear,
    };
  }, [cart, categories, index, add, remove, clear]);

  return <OrderCtx.Provider value={value}>{children}</OrderCtx.Provider>;
}

export function useOrder() {
  const ctx = useContext(OrderCtx);
  if (!ctx) throw new Error("useOrder must be used inside <OrderProvider>");
  return ctx;
}
