"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useMotionPref } from "./MotionPref";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * One place that gives the page its entrances, driven by data attributes so
 * sections stay plain markup:
 *
 *   data-anim="heading"  rises out of a mask, whole (never split — Arabic shaping)
 *   data-anim="fade"     lifts in
 *   data-anim="stagger"  its children arrive one after another
 *   data-anim="spin"     turns and settles into place (trays)
 *   data-anim="stitch"   an SVG thread that sews itself across as you scroll
 *
 * Everything is visible in the HTML; motion is only added on the client, and
 * not at all when the visitor prefers reduced motion.
 */
export function ScrollFX() {
  const { reduced } = useMotionPref();

  useGSAP(
    () => {
      if (reduced) return;
      const once = (el: Element, start = "top 85%") => ({ trigger: el, start, once: true });

      // The heading is revealed whole, through a mask that opens upward. It is never split:
      // the Ruq'ah display face draws its dots with font features that splitting breaks.
      document.querySelectorAll<HTMLElement>('[data-anim="heading"]').forEach((el) => {
        gsap.fromTo(
          el,
          { clipPath: "inset(0% 0% 100% 0%)", y: 50 },
          { clipPath: "inset(-20% -5% -20% -5%)", y: 0, duration: 1.15, ease: "expo.out", scrollTrigger: once(el) },
        );
      });

      document.querySelectorAll<HTMLElement>('[data-anim="fade"]').forEach((el) => {
        gsap.from(el, { y: 36, autoAlpha: 0, duration: 0.9, ease: "power3.out", scrollTrigger: once(el) });
      });

      document.querySelectorAll<HTMLElement>('[data-anim="stagger"]').forEach((el) => {
        gsap.from(el.children, { y: 40, autoAlpha: 0, duration: 0.8, ease: "power3.out", stagger: 0.09, scrollTrigger: once(el, "top 88%") });
      });

      document.querySelectorAll<SVGElement>('[data-anim="spin"]').forEach((el) => {
        gsap.from(el, { rotate: -28, scale: 0.88, autoAlpha: 0, duration: 1.4, ease: "expo.out", transformOrigin: "50% 50%", scrollTrigger: once(el, "top 80%") });
      });

      document.querySelectorAll<SVGPathElement>('[data-anim="stitch"] [data-draw]').forEach((path) => {
        const len = path.getTotalLength();
        gsap.fromTo(
          path,
          { strokeDasharray: len, strokeDashoffset: len },
          { strokeDashoffset: 0, ease: "none", scrollTrigger: { trigger: path.closest("svg"), start: "top 95%", end: "bottom 45%", scrub: 0.6 } },
        );
      });

      // fonts change line breaks: re-measure once they are in
      document.fonts?.ready.then(() => ScrollTrigger.refresh());
    },
    { dependencies: [reduced], revertOnUpdate: true },
  );

  return null;
}

/** A khayameya seam between two sections: a wavy line with running stitches, sewn as you scroll. */
export function Stitch({ tone = "#c9a265", className = "" }: { tone?: string; className?: string }) {
  const wave = "M0 20 C 100 2, 200 38, 300 20 S 500 2, 600 20 S 800 38, 900 20 S 1100 2, 1200 20";
  return (
    <div aria-hidden className={`pointer-events-none relative h-10 w-full overflow-hidden ${className}`}>
      <svg data-anim="stitch" viewBox="0 0 1200 40" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <defs>
          <mask id={`stitch-${tone.slice(1)}`}>
            <path data-draw d={wave} fill="none" stroke="#fff" strokeWidth="10" />
          </mask>
        </defs>
        <g mask={`url(#stitch-${tone.slice(1)})`}>
          <path d={wave} fill="none" stroke={tone} strokeWidth="2" strokeDasharray="10 8" strokeLinecap="round" />
          {Array.from({ length: 12 }, (_, i) => (
            <circle key={i} cx={50 + i * 100} cy={i % 2 ? 31 : 9} r="3" fill={tone} />
          ))}
        </g>
      </svg>
    </div>
  );
}
