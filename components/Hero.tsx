"use client";

import Image from "next/image";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import type { MotionValue } from "framer-motion";
import { useEffect, useRef } from "react";
import { assets } from "@/lib/assets";
import { useMotionPref } from "./MotionPref";

/**
 * The entrance. A black tent, closed. Your cursor (or finger, or — when idle —
 * a slow drift) is the only lantern; the stitched cloth lights up under it.
 * Scroll and the flaps part and you are inside.
 *
 * Performance: every moving part is a plain transform on its own layer
 * (no masks being re-rasterised, no blend modes, no filters, no layout).
 */
export function Hero() {
  const wrap = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const { reduced } = useMotionPref();

  // Scroll-linked on purpose; the spring irons out coarse mouse-wheel steps.
  const { scrollYProgress } = useScroll({ target: wrap, offset: ["start start", "end end"] });
  const p = useSpring(scrollYProgress, { stiffness: 130, damping: 30, mass: 0.4, restDelta: 0.0005 });

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    let w = el.clientWidth;
    let h = el.clientHeight;
    let tx = w / 2, ty = h * 0.46, x = tx, y = ty;
    let lastMove = -9999;
    let raf = 0;
    let visible = true;
    const t0 = performance.now();

    const onResize = () => {
      w = el.clientWidth;
      h = el.clientHeight;
    };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      tx = e.clientX - r.left;
      ty = e.clientY - r.top;
      lastMove = performance.now();
    };
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (!visible) return;
      if (!reduced && now - lastMove > 2200) {
        const t = (now - t0) / 1000;
        tx = w * (0.5 + Math.sin(t * 0.37) * 0.3);
        ty = h * (0.46 + Math.sin(t * 0.61 + 1.3) * 0.2);
      }
      const nx = x + (tx - x) * 0.08;
      const ny = y + (ty - y) * 0.08;
      if (Math.abs(nx - x) < 0.05 && Math.abs(ny - y) < 0.05) return;
      x = nx;
      y = ny;
      el.style.setProperty("--lx", `${x.toFixed(1)}px`);
      el.style.setProperty("--ly", `${y.toFixed(1)}px`);
      el.style.setProperty("--lxr", `${(x - w / 2).toFixed(1)}px`);
    };
    const io = new IntersectionObserver(([e]) => (visible = !!e?.isIntersecting));
    io.observe(el);
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
    };
  }, [reduced]);

  const flapL = useTransform(p, [0.04, 0.6], ["0%", "-100%"]);
  const flapR = useTransform(p, [0.04, 0.6], ["0%", "100%"]);
  const exteriorOpacity = useTransform(p, [0, 0.16], [1, 0]);
  const exteriorY = useTransform(p, [0, 0.16], [0, -50]);
  const exteriorEvents = useTransform(p, (v) => (v < 0.12 ? "auto" : "none"));
  const photoY = useTransform(p, [0, 1], ["4%", "-6%"]);
  const photoScale = useTransform(p, [0, 0.7], [1.12, 1]);
  const welcomeOpacity = useTransform(p, [0.42, 0.72], [0, 1]);
  const welcomeY = useTransform(p, [0.42, 0.72], [36, 0]);
  const welcomeEvents = useTransform(p, (v) => (v > 0.5 ? "auto" : "none"));
  const cueOpacity = useTransform(p, [0, 0.08], [1, 0]);

  return (
    <section ref={wrap} aria-label="مدخل الخيمة" className="relative" style={{ height: "220svh" }}>
      <div
        ref={stage}
        className="sticky top-0 h-svh w-full overflow-hidden bg-ink"
        style={{ ["--lx" as string]: "50vw", ["--ly" as string]: "46svh", ["--lxr" as string]: "0px" }}
      >
        {/* ── interior ── */}
        <motion.div
          className="absolute -inset-y-[8%] inset-x-0 will-change-transform"
          style={{ y: photoY, scale: photoScale }}
        >
          <Image
            src={assets.lantern.src}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[50%_65%] opacity-50"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/85" />

        <motion.div
          className="absolute inset-0 z-[5] flex flex-col items-center justify-center px-6 text-center"
          style={{ opacity: welcomeOpacity, y: welcomeY, pointerEvents: welcomeEvents }}
        >
          <p className="font-latin text-sm italic tracking-[0.3em] text-amber">SEMSEM · RAMADAN SUHOOR</p>
          <h2 className="mt-5 font-display text-[clamp(2.6rem,9vw,6.5rem)] leading-[1.15] text-cream [text-shadow:0_2px_24px_rgba(0,0,0,.7)]">
            اتفضّل.. الخيمة مفتوحة
          </h2>
          <p className="mt-5 max-w-md text-balance text-base leading-8 text-cream/85 [text-shadow:0_1px_12px_rgba(0,0,0,.8)] md:text-lg">
            السفرة اتفرشت، والشاي على النار. اقعد، واللي يجي يجي.
          </p>
          <a
            href="#hekaya"
            className="mt-9 rounded-full bg-amber px-8 py-3 text-base font-semibold text-ink transition-colors hover:bg-cream"
          >
            كمّل جوّه
          </a>
        </motion.div>

        {/* ── the cloth: two flaps ── */}
        <Flap side="left" x={flapL} />
        <Flap side="right" x={flapR} />

        {/* ── exterior wordmark + entrance ── */}
        <motion.div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6 text-center"
          style={{ opacity: exteriorOpacity, y: exteriorY, pointerEvents: exteriorEvents }}
        >
          <h1 className="font-display text-[clamp(7.5rem,32vw,23rem)] leading-[0.95] text-cream [text-shadow:0_0_50px_rgba(242,169,59,.35)]">
            سمسم
          </h1>
          <p className="-mt-1 font-latin text-[clamp(.8rem,1.8vw,1.1rem)] italic tracking-[0.55em] text-amber">
            SEMSEM
          </p>
          <p className="mt-8 text-[clamp(1.35rem,3.6vw,2.4rem)] font-light text-cream">الليلة لسه مبدأتش</p>
          <p className="mt-2 text-sm text-sand md:text-base">خيمة سحور رمضانية · لمّة وأكل وسهرة لحد الفجر</p>
        </motion.div>

        <motion.div
          className="absolute inset-x-0 bottom-7 z-20 flex flex-col items-center gap-2 text-xs text-sand md:text-sm"
          style={{ opacity: cueOpacity }}
        >
          <span>حرّك النور واكتشف الضلمة</span>
          <a href="#hekaya" className="flex flex-col items-center gap-1 text-cream" aria-label="انزل لتحت وافتح الخيمة">
            <span>اسحب لتحت وافتح الستارة</span>
            <svg width="18" height="26" viewBox="0 0 18 26" fill="none" className="motion-safe:animate-[nudge_1.8s_ease-in-out_infinite]">
              <path d="M9 2v20m0 0l-7-7m7 7l7-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  );
}

/**
 * One half of the tent door. The lit patch is a small window that follows the
 * lantern, with the pattern inside it counter-translated so the cloth stays
 * put under the light — two transforms, nothing re-painted.
 */
function Flap({ side, x }: { side: "left" | "right"; x: MotionValue<string> }) {
  const lx = side === "left" ? "var(--lx)" : "var(--lxr)";
  const R = 340; // half-size of the lit window
  return (
    <motion.div
      aria-hidden
      className="absolute inset-y-0 z-10 w-1/2 overflow-hidden bg-soot will-change-transform"
      style={{ x, [side === "left" ? "left" : "right"]: 0 }}
    >
      {/* closed, unlit cloth: the pattern only a rumour */}
      <div className="khayameya absolute inset-0 opacity-[0.1]" style={{ backgroundSize: "150px 150px" }} />

      {/* lit window */}
      <div
        className="absolute left-0 top-0 will-change-transform"
        style={{
          width: R * 2,
          height: R * 2,
          transform: `translate3d(calc(${lx} - ${R}px), calc(var(--ly) - ${R}px), 0)`,
          maskImage: "radial-gradient(circle, #000 0%, rgba(0,0,0,.65) 40%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(circle, #000 0%, rgba(0,0,0,.65) 40%, transparent 70%)",
          overflow: "hidden",
        }}
      >
        <div
          className="khayameya absolute left-0 top-0 will-change-transform"
          style={{
            width: "50vw",
            height: "100svh",
            backgroundSize: "150px 150px",
            transform: `translate3d(calc(${R}px - ${lx}), calc(${R}px - var(--ly)), 0)`,
          }}
        />
      </div>

      {/* drape + vignette (static) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "repeating-linear-gradient(90deg, rgba(0,0,0,.5) 0, rgba(0,0,0,0) 38px, rgba(0,0,0,.3) 76px), linear-gradient(to bottom, rgba(0,0,0,.5), transparent 40%, rgba(0,0,0,.7))",
        }}
      />
      {/* inner edge catches the light from inside */}
      <div
        className="absolute inset-y-0 w-8"
        style={{
          [side === "left" ? "right" : "left"]: 0,
          background: `linear-gradient(${side === "left" ? "270deg" : "90deg"}, rgba(255,170,70,.28), transparent)`,
        }}
      />
    </motion.div>
  );
}
