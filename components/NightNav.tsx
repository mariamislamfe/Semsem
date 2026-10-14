"use client";

import { useMotionValueEvent, useScroll } from "framer-motion";
import { useState } from "react";
import { toArabicDigits } from "@/lib/format";

const links = [
  { href: "#sofra", label: "السفرة" },
  { href: "#shay", label: "الشاي" },
  { href: "#hekaya", label: "القعدة" },
  { href: "#makan", label: "المكان" },
];

/** The night runs from 11 pm to 4:30 am as you scroll down the page. */
function nightClock(progress: number) {
  const total = Math.round(23 * 60 + progress * 5.5 * 60) % (24 * 60);
  const h = Math.floor(total / 60) % 12 || 12;
  const m = total % 60;
  return `${toArabicDigits(h)}:${toArabicDigits(String(m).padStart(2, "0"))}`;
}

export function NightNav() {
  const { scrollYProgress } = useScroll();
  const [time, setTime] = useState(() => nightClock(0));
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const next = nightClock(Math.min(1, Math.max(0, v)));
    setTime((prev) => (prev === next ? prev : next));
  });

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 w-full max-w-[100vw] bg-gradient-to-b from-black/45 to-transparent">
      <div className="pointer-events-auto mx-auto flex max-w-[1500px] items-center justify-between gap-6 px-5 py-4 md:px-10">
        <a href="#top" className="font-display text-3xl leading-none text-cream" aria-label="سمسم، أول الصفحة">
          سمسم
        </a>
        <nav aria-label="أقسام الصفحة" className="hidden items-center gap-8 text-[0.95rem] text-cream md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="transition-opacity hover:opacity-60">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-5 text-cream">
          <span className="hidden tabular-nums opacity-70 sm:inline" title="ساعة الليلة: بتمشي مع السكرول">
            {time}
          </span>
          <a href="#ihgez" className="rounded-full border border-cream px-4 py-1.5 text-sm transition-colors hover:bg-cream hover:text-ink">
            احجز
          </a>
        </div>
      </div>
    </header>
  );
}
