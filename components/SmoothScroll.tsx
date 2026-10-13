"use client";

import Lenis from "lenis";
import { useEffect } from "react";
import { setLenis } from "@/lib/lenis";
import { useMotionPref } from "./MotionPref";

/**
 * Inertial scrolling: wheel notches become one continuous glide, which is what
 * makes scroll-linked scenes (the tent flaps, parallax) read as smooth.
 * Off only if the visitor switched motion off in the nav.
 */
export function SmoothScroll() {
  const { userOff } = useMotionPref();

  useEffect(() => {
    if (userOff) return;
    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 1 });
    setLenis(lenis);
    let raf = 0;
    const loop = (t: number) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.('a[href^="#"]');
      const href = a?.getAttribute("href");
      if (!a || !href || href.length < 2) return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target as HTMLElement, { duration: 1.4 });
    };
    document.addEventListener("click", onClick);

    return () => {
      document.removeEventListener("click", onClick);
      cancelAnimationFrame(raf);
      lenis.destroy();
      setLenis(null);
    };
  }, [userOff]);

  return null;
}
