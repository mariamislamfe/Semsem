"use client";

import { motion, useMotionValueEvent, useScroll, useSpring } from "framer-motion";
import { useState } from "react";
import { toArabicDigits } from "@/lib/format";
import { useMotionPref } from "./MotionPref";

const links = [
  { href: "#hekaya", label: "الحكاية" },
  { href: "#sofra", label: "السفرة" },
  { href: "#shay", label: "الشاي" },
  { href: "#ihgez", label: "احجز" },
  { href: "#makan", label: "المكان" },
];

/** The night runs from 11:00 pm to 4:30 am while you scroll — suhoor is the middle of the page. */
function nightClock(progress: number) {
  const startMin = 23 * 60;
  const spanMin = 5.5 * 60;
  const total = Math.round(startMin + progress * spanMin) % (24 * 60);
  const h24 = Math.floor(total / 60);
  const m = total % 60;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const time = `${toArabicDigits(h12)}:${toArabicDigits(String(m).padStart(2, "0"))}`;
  const abs = progress * spanMin;
  const phase =
    abs < 90 ? "السهرة بدأت" : abs < 190 ? "قعدة حلوة" : abs < 290 ? "وقت السحور" : "الفجر قرّب";
  return { time, phase };
}

export function NightNav() {
  const { scrollYProgress } = useScroll();
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.4 });
  const [clock, setClock] = useState(() => nightClock(0));
  const { reduced, toggle } = useMotionPref();

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const next = nightClock(Math.min(1, Math.max(0, v)));
    setClock((prev) => (prev.time === next.time && prev.phase === next.phase ? prev : next));
  });

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 w-full max-w-[100vw] bg-gradient-to-b from-ink/95 via-ink/80 to-ink/30">
      <div className="pointer-events-auto mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-8">
        <a href="#top" className="font-display text-3xl leading-none text-cream" aria-label="سمسم — أول الصفحة">
          سمسم
        </a>

        <nav aria-label="أقسام الصفحة" className="hidden items-center gap-7 text-sm text-sand md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="transition hover:text-amber">
              {l.label}
            </a>
          ))}
        </nav>

        <button
          type="button"
          onClick={toggle}
          aria-pressed={!reduced}
          title={reduced ? "الحركة التلقائية مقفولة — اضغط لتشغيلها" : "اضغط لإيقاف الحركة التلقائية"}
          className="pointer-events-auto hidden rounded-full border border-cream/15 bg-ink/80 px-3 py-1.5 text-xs text-sand transition hover:text-amber sm:block"
        >
          {reduced ? "الحركة: مقفولة" : "الحركة: شغّالة"}
        </button>
        <div
          className="flex items-center gap-3 rounded-full border border-cream/15 bg-ink/80 px-4 py-1.5 text-xs"
          role="status"
          aria-live="off"
          title="ساعة الليلة — بتتحرك مع التمرير"
        >
          <span className="text-sand">{clock.phase}</span>
          <span className="font-semibold tabular-nums text-amber">{clock.time}</span>
        </div>
      </div>
      <motion.div
        aria-hidden
        className="h-[2px] origin-right bg-gradient-to-l from-amber via-ember to-cloth"
        style={{ scaleX: smooth }}
      />
    </header>
  );
}
