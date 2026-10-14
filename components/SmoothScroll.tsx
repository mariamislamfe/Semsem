"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useEffect } from "react";
import { setLenis } from "@/lib/lenis";
import { useMotionPref } from "./MotionPref";

gsap.registerPlugin(ScrollTrigger);

/**
 * One clock for scrolling and animation: Lenis glides the wheel, and GSAP's
 * ticker drives Lenis, so pinned/scrubbed ScrollTriggers never fight the
 * smooth scroll. Off only if the visitor switched motion off.
 */
export function SmoothScroll() {
  const { userOff } = useMotionPref();

  useEffect(() => {
    if (userOff) return;
    const lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
    setLenis(lenis);
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

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
      gsap.ticker.remove(tick);
      lenis.destroy();
      setLenis(null);
    };
  }, [userOff]);

  return null;
}
