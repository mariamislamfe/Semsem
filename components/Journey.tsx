"use client";

import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import type { MotionValue } from "framer-motion";
import { useRef } from "react";
import { useMotionPref } from "./MotionPref";

/**
 * المشي جوّه الخيمة — the screen is the tent. As you scroll you walk forward
 * under a run of khayameya arches, each hung with a lantern; they rush past
 * you, the camera sways like a walking step, and the light at the end grows
 * until you step out onto the table.
 *
 * Everything is a transform or opacity on a handful of layers.
 */

const N = 8; // arches alive at once
const TRAVEL = 7.2; // arches that pass you over the whole scroll
const MIN_S = 0.05;
const MAX_S = 4.4;

const beats: Array<{ from: number; to: number; text: string; small?: string }> = [
  { from: 0.0, to: 0.2, text: "امشي معانا..", small: "الليلة لسه بدري" },
  { from: 0.2, to: 0.4, text: "عدّي من تحت الفوانيس", small: "كل واحد بيناديك" },
  { from: 0.4, to: 0.6, text: "الريحة سابقاك", small: "فول وطعمية وشاي على النار" },
  { from: 0.6, to: 0.8, text: "والضحك والحكاوي في كل مكان", small: "لسه شوية" },
  { from: 0.8, to: 1.0, text: "اتفضّل.. السفرة مفروشة" },
];

/** Outer rectangle with an arch-shaped hole (even-odd), in % so it scales with the screen. */
function archClip() {
  const pts: string[] = [];
  const cx = 50, cy = 46, rx = 35, ry = 32;
  pts.push(`${cx - rx}% 88%`, `${cx - rx}% ${cy}%`);
  for (let a = 180; a >= 0; a -= 15) {
    const r = (a * Math.PI) / 180;
    pts.push(`${(cx + rx * Math.cos(r)).toFixed(2)}% ${(cy - ry * Math.sin(r)).toFixed(2)}%`);
  }
  pts.push(`${cx + rx}% 88%`, `${cx - rx}% 88%`);
  return `polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${pts.join(", ")})`;
}

const CLIP = archClip();

function Arch({ i, t, clip }: { i: number; t: MotionValue<number>; clip: string }) {
  const z = (v: number) => (((i - v) % N) + N) % N;
  const transform = useTransform(t, (v) => {
    const s = MIN_S * Math.pow(MAX_S / MIN_S, 1 - z(v) / N);
    return `scale(${s.toFixed(4)})`;
  });
  const opacity = useTransform(t, (v) => {
    const zz = z(v);
    return Math.min(Math.max(N - zz, 0), 1) * Math.min(zz / 0.9, 1);
  });
  const hasLantern = i % 2 === 0;

  return (
    <motion.div aria-hidden className="absolute inset-0 will-change-transform" style={{ transform, opacity }}>
      <div
        className="khayameya absolute inset-0"
        style={{ clipPath: clip, backgroundSize: "9vmin 9vmin" }}
      />
      {/* arch edge: stitched rim */}
      <div
        className="absolute inset-0"
        style={{
          clipPath: clip,
          background: "linear-gradient(to bottom, rgba(0,0,0,.35), transparent 30%, rgba(0,0,0,.55))",
        }}
      />
      {hasLantern && <Lantern />}
    </motion.div>
  );
}

function Lantern() {
  return (
    <div className="absolute left-1/2 top-[14%] -translate-x-1/2" style={{ width: "7vmin" }}>
      <div className="mx-auto h-[8vmin] w-px bg-cream/60" />
      <svg viewBox="0 0 60 100" className="w-full overflow-visible" aria-hidden>
        <circle cx="30" cy="6" r="5" fill="none" stroke="#e0a33a" strokeWidth="2" />
        <path d="M18 18 L30 8 L42 18Z" fill="#2a1a12" stroke="#e0a33a" strokeWidth="1.5" />
        <path d="M14 20 H46 L50 78 H10Z" fill="#f2a93b" stroke="#6b3a1c" strokeWidth="2" />
        <path d="M30 20 V78 M22 20 L20 78 M38 20 L40 78" stroke="#6b3a1c" strokeWidth="1.6" />
        <path d="M8 78 H52 L46 90 H14Z" fill="#2a1a12" stroke="#e0a33a" strokeWidth="1.5" />
        <circle cx="30" cy="48" r="26" fill="url(#lg)" opacity=".5" />
        <defs>
          <radialGradient id="lg">
            <stop offset="0" stopColor="#ffd27a" />
            <stop offset="1" stopColor="#ffd27a" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}

function Beat({ b, p }: { b: (typeof beats)[number]; p: MotionValue<number> }) {
  const span = b.to - b.from;
  const opacity = useTransform(p, [b.from, b.from + span * 0.25, b.to - span * 0.25, b.to], [0, 1, 1, 0]);
  const y = useTransform(p, [b.from, b.from + span * 0.3, b.to], [34, 0, -34]);
  return (
    <motion.div
      className="absolute inset-x-0 bottom-[12%] z-30 px-6 text-center"
      style={{ opacity, y }}
    >
      <p className="font-display text-[clamp(2.4rem,8vw,6rem)] leading-[1.15] text-cream [text-shadow:0_2px_30px_rgba(0,0,0,.9)]">
        {b.text}
      </p>
      {b.small && (
        <p className="mt-2 font-poetic text-[clamp(1.1rem,2.4vw,1.7rem)] text-amber [text-shadow:0_1px_14px_rgba(0,0,0,.9)]">
          {b.small}
        </p>
      )}
    </motion.div>
  );
}

export function Journey() {
  const ref = useRef<HTMLElement>(null);
  const { reduced } = useMotionPref();

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const p = useSpring(scrollYProgress, { stiffness: 90, damping: 28, mass: 0.5, restDelta: 0.0005 });
  const t = useTransform(p, (v) => v * TRAVEL);

  // a walking step: tiny roll and bob
  const sway = useTransform(p, (v) =>
    reduced ? "none" : `translateY(${(Math.sin(v * 160) * 5).toFixed(2)}px) rotate(${(Math.sin(v * 70) * 0.7).toFixed(3)}deg)`,
  );
  // the light at the end of the tent
  const lightScale = useTransform(p, [0, 0.8, 1], [0.4, 1.6, 2.2]);
  const lightOpacity = useTransform(p, [0, 0.15, 0.85, 1], [0.35, 0.75, 1, 0]);
  const vignette = useTransform(p, [0, 1], [0.9, 0.35]);
  const cue = useTransform(p, [0, 0.06], [1, 0]);

  return (
    <section ref={ref} aria-label="المشي جوّه الخيمة" className="relative bg-ink" style={{ height: "520svh" }}>
      <div className="sticky top-0 h-svh w-full overflow-hidden bg-ink">
        {/* the light ahead */}
        <motion.div
          aria-hidden
          className="absolute left-1/2 top-[46%] h-[90vmax] w-[90vmax] -translate-x-1/2 -translate-y-1/2 rounded-full will-change-transform"
          style={{
            scale: lightScale,
            opacity: lightOpacity,
            background:
              "radial-gradient(circle, rgba(255,205,120,1) 0%, rgba(242,140,50,.85) 14%, rgba(155,42,28,.55) 34%, transparent 62%)",
          }}
        />

        {/* arches, walked through */}
        <motion.div aria-hidden className="absolute inset-0 will-change-transform" style={{ transform: sway }}>
          {Array.from({ length: N }, (_, i) => (
            <Arch key={i} i={i} t={t} clip={CLIP} />
          ))}
        </motion.div>

        {/* edges darken like the tent walls */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            opacity: vignette,
            background: "radial-gradient(ellipse at 50% 46%, transparent 38%, rgba(11,8,7,.95) 100%)",
          }}
        />

        {beats.map((b) => (
          <Beat key={b.text} b={b} p={p} />
        ))}

        <motion.div
          className="absolute inset-x-0 top-24 z-30 flex flex-col items-center gap-1 text-sm text-sand"
          style={{ opacity: cue }}
        >
          <span>كمّل سكرول وامشي</span>
          <svg width="18" height="26" viewBox="0 0 18 26" fill="none" className="motion-safe:animate-[nudge_1.8s_ease-in-out_infinite]">
            <path d="M9 2v20m0 0l-7-7m7 7l7-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>
      </div>
    </section>
  );
}
