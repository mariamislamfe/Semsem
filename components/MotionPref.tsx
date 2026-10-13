"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/**
 * Motion preference.
 *
 * Scroll-linked motion (the tent flaps, parallax, text lighting up) is driven
 * by the visitor's own scrolling and is always on — it IS the experience, and
 * hiding it is what made the curtain look "broken" on machines where the OS
 * has animations switched off.
 *
 * `reduced` only governs motion that plays by itself (idle lantern drift, steam,
 * flicker, the table spinning in). It follows the system setting, and the
 * visitor can override it with the toggle in the nav.
 */
interface Ctx {
  reduced: boolean;
  /** true when the OS asks for reduced motion and the visitor hasn't overridden it */
  fromSystem: boolean;
  /** the visitor explicitly switched motion off */
  userOff: boolean;
  toggle: () => void;
}

const MotionCtx = createContext<Ctx>({ reduced: false, fromSystem: false, userOff: false, toggle: () => {} });
const KEY = "semsem-motion";

export function MotionPrefProvider({ children }: { children: React.ReactNode }) {
  const [system, setSystem] = useState(false);
  const [override, setOverride] = useState<"on" | "off" | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setSystem(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    try {
      const saved = localStorage.getItem(KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reading browser storage after mount
      if (saved === "on" || saved === "off") setOverride(saved);
    } catch {
      /* storage may be blocked */
    }
    return () => mq.removeEventListener("change", sync);
  }, []);

  const reduced = override ? override === "off" : system;

  useEffect(() => {
    document.documentElement.dataset.motion = reduced ? "reduced" : "full";
  }, [reduced]);

  const toggle = useCallback(() => {
    const next = reduced ? "on" : "off";
    setOverride(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* ignore */
    }
  }, [reduced]);

  const value = useMemo(
    () => ({ reduced, fromSystem: system && override === null, userOff: override === "off", toggle }),
    [reduced, system, override, toggle],
  );
  return <MotionCtx.Provider value={value}>{children}</MotionCtx.Provider>;
}

export const useMotionPref = () => useContext(MotionCtx);
