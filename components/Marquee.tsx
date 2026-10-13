"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const words = ["فول", "طعمية", "بتنجان", "شاي بالنعناع", "لمّة", "سحور", "سهرة", "عيش سخن"];

/** One strip of big type that slides as you scroll past. Plain transform, solid colour. */
export function Marquee() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);
  const list = [...words, ...words];
  return (
    <div ref={ref} aria-hidden dir="ltr" className="select-none overflow-hidden whitespace-nowrap bg-ink py-4">
      <motion.div className="inline-flex gap-8 will-change-transform" style={{ x }}>
        {list.map((w, i) => (
          <span key={i} className="font-display text-[clamp(3rem,9vw,7rem)] leading-[1.3] text-cream/20">
            {w}
            <span className="mx-8 inline-block text-ember/60">✦</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}
