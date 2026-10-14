"use client";

import dynamic from "next/dynamic";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import type { MotionValue } from "framer-motion";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Hero } from "../Hero";
import { Journey } from "../Journey";

// The whole 3D bundle (three + react-three-fiber) loads only when it will be used.
const TentCanvas = dynamic(() => import("./TentCanvas"), { ssr: false });

type Mode = "checking" | "high" | "low" | "fallback";

let cached: Mode | null = null;
function detect(): Mode {
  if (cached) return cached;
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2") ?? c.getContext("webgl");
    if (!gl) return (cached = "fallback");
    const small = window.matchMedia("(max-width: 820px)").matches;
    const weak = (navigator.hardwareConcurrency ?? 8) <= 4;
    const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
    if (mem <= 1) return (cached = "fallback");
    return (cached = small || weak || mem <= 2 ? "low" : "high");
  } catch {
    return (cached = "fallback");
  }
}
const subscribe = () => () => {};

/**
 * The arrival. One continuous shot, driven by scroll: you stand in the lane
 * outside the tent, the doors part, you walk the hall under the lanterns and
 * lower yourself onto the table. If WebGL is unavailable (or the device is too
 * small for it) the earlier CSS version takes over, so nobody gets a blank page.
 */
export function Arrival() {
  const mode = useSyncExternalStore<Mode>(subscribe, detect, () => "checking");
  if (mode === "fallback") {
    return (
      <>
        <Hero />
        <Journey />
      </>
    );
  }
  return <Shot quality={mode === "low" ? "low" : "high"} deferred={mode === "checking"} />;
}

const beats: Array<{ from: number; to: number; text: string; small?: string }> = [
  { from: 0.13, to: 0.27, text: "الشارع هدى..", small: "وفي ضوء بعيد بيناديك" },
  { from: 0.3, to: 0.44, text: "ادخل", small: "الستارة مفتوحة" },
  { from: 0.5, to: 0.64, text: "عدّي من تحت الفوانيس", small: "كل واحد بيناديك" },
  { from: 0.66, to: 0.78, text: "الريحة سابقاك", small: "فول وطعمية وشاي على النار" },
  { from: 0.82, to: 0.97, text: "اقعد.. السفرة مفروشة", small: "والليلة لسه طويلة" },
];

function Beat({ b, p }: { b: (typeof beats)[number]; p: MotionValue<number> }) {
  const span = b.to - b.from;
  const opacity = useTransform(p, [b.from, b.from + span * 0.25, b.to - span * 0.25, b.to], [0, 1, 1, 0]);
  const y = useTransform(p, [b.from, b.from + span * 0.3, b.to], [30, 0, -30]);
  return (
    <motion.div className="absolute inset-x-0 bottom-[11%] z-30 px-6 text-center" style={{ opacity, y }}>
      <p className="font-display text-[clamp(2.4rem,8vw,6rem)] leading-[1.15] text-cream [text-shadow:0_2px_30px_rgba(0,0,0,.95)]">
        {b.text}
      </p>
      {b.small && (
        <p className="mt-2 font-poetic text-[clamp(1.1rem,2.4vw,1.7rem)] text-amber [text-shadow:0_1px_14px_rgba(0,0,0,.95)]">
          {b.small}
        </p>
      )}
    </motion.div>
  );
}

function Shot({ quality, deferred }: { quality: "high" | "low"; deferred: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const [onScreen, setOnScreen] = useState(true);
  const [ready, setReady] = useState(false);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  // The scene smooths this again internally; this one irons out coarse wheel steps.
  const p = useSpring(scrollYProgress, { stiffness: 110, damping: 30, mass: 0.4, restDelta: 0.0004 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOnScreen(!!e?.isIntersecting), { rootMargin: "20% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const wordOpacity = useTransform(p, [0, 0.09], [1, 0]);
  const wordY = useTransform(p, [0, 0.09], [0, -40]);
  const cueOpacity = useTransform(p, [0, 0.05], [1, 0]);
  const scrim = useTransform(p, [0, 0.1, 0.9, 1], [0.0, 0.55, 0.55, 0.1]);

  return (
    <section ref={ref} aria-label="الوصول لخيمة سمسم" className="relative bg-ink" style={{ height: "800svh" }}>
      <div className="sticky top-0 h-svh w-full overflow-hidden bg-ink">
        <div className={`absolute inset-0 transition-opacity duration-1000 ${ready ? "opacity-100" : "opacity-0"}`}>
          {!deferred && <TentCanvas progress={p} quality={quality} active={onScreen} onReady={() => setReady(true)} />}
        </div>

        {/* legibility for the type that rides over the shot */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[55%] bg-gradient-to-t from-ink to-transparent"
          style={{ opacity: scrim }}
        />

        {/* the wordmark on the night street */}
        <motion.div
          className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-end px-6 pb-[16svh] text-center"
          style={{ opacity: wordOpacity, y: wordY }}
        >
          <h1 className="font-display text-[clamp(6rem,24vw,17rem)] leading-[0.9] text-cream [text-shadow:0_0_60px_rgba(242,169,59,.4),0_4px_30px_rgba(0,0,0,.9)]">
            سمسم
          </h1>
          <p className="-mt-1 font-latin text-[clamp(.8rem,1.8vw,1.1rem)] italic tracking-[0.55em] text-amber">SEMSEM</p>
          <p className="mt-5 text-[clamp(1.3rem,3.4vw,2.2rem)] font-light text-cream [text-shadow:0_2px_20px_rgba(0,0,0,.9)]">
            الليلة لسه مبدأتش
          </p>
        </motion.div>

        {beats.map((b) => (
          <Beat key={b.text} b={b} p={p} />
        ))}

        <motion.div
          className="pointer-events-none absolute inset-x-0 bottom-6 z-30 flex flex-col items-center gap-1 text-xs text-sand md:text-sm"
          style={{ opacity: cueOpacity }}
        >
          <span>حرّك الفانوس.. واسحب لتحت وادخل</span>
          <svg width="18" height="26" viewBox="0 0 18 26" fill="none" className="motion-safe:animate-[nudge_1.8s_ease-in-out_infinite]">
            <path d="M9 2v20m0 0l-7-7m7 7l7-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>
      </div>
    </section>
  );
}
