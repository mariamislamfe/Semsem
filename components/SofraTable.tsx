"use client";

import Image from "next/image";
import { AnimatePresence, motion, useInView, useMotionValue, useSpring, useTransform } from "framer-motion";
import type { MotionValue } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { CategoryWithItems } from "@/lib/types";
import { toArabicDigits } from "@/lib/format";
import { useMotionPref } from "./MotionPref";

/**
 * The suhoor table, seen from above. Every category is a plate on it — tap a
 * plate and its whole range opens. The cloth turns when you drag it (and very
 * slowly by itself until you do). It is flat 2D rotation only, so it costs
 * almost nothing to animate.
 */
export function SofraTable({
  categories,
  selected,
  onSelect,
}: {
  categories: CategoryWithItems[];
  selected: string | null;
  onSelect: (slug: string) => void;
}) {
  const n = categories.length;
  const step = 360 / Math.max(n, 1);
  const { reduced } = useMotionPref();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.3 });
  const [grabbed, setGrabbed] = useState(false);
  const touched = grabbed || selected !== null;
  const moved = useRef(false);

  const target = useMotionValue(reduced ? 0 : -80);
  const rot = useSpring(target, { stiffness: 110, damping: 20, mass: 0.8, restDelta: 0.05 });
  const discRotate = useTransform(rot, (r) => `rotate(${r}deg)`);

  // arrive turning, then settle
  useEffect(() => {
    target.set(0);
  }, [target]);

  // choosing a plate: one quick lap, ending with that plate facing the list on the left
  useEffect(() => {
    if (!selected) return;
    const i = categories.findIndex((c) => c.slug === selected);
    if (i < 0) return;
    const cur = target.get();
    const base = 270 - i * step;
    const lap = reduced ? 0 : 300;
    target.set(base + 360 * Math.ceil((cur + lap - base) / 360));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  // slow drift until the visitor takes hold of the table
  useEffect(() => {
    if (touched || reduced || !inView) return;
    let raf = 0;
    let last = performance.now();
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      target.set(target.get() + (t - last) * 0.004);
      last = t;
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [touched, reduced, inView, target]);

  return (
    <div className="relative mx-auto w-full max-w-[560px]">
      <motion.div
        ref={ref}
        className="relative mx-auto aspect-square w-full cursor-grab touch-pan-y select-none active:cursor-grabbing"
        style={{ containerType: "inline-size" }}
        onPointerDown={() => {
          moved.current = false;
        }}
        onPanStart={() => setGrabbed(true)}
        onPan={(_, info) => {
          if (Math.abs(info.offset.x) > 6) moved.current = true;
          target.set(target.get() + info.delta.x * 0.45);
        }}
        onPanEnd={(_, info) => target.set(target.get() + info.velocity.x * 0.08)}
      >
        {/* table top */}
        <div
          className="absolute inset-[3%] rounded-full shadow-[0_30px_70px_rgba(0,0,0,.85)]"
          style={{
            background: "#120d0b",
            border: "1.4cqw solid #2a0f0a",
            boxShadow: "0 0 0 0.6cqw rgba(224,163,58,.5), 0 3cqw 8cqw rgba(0,0,0,.85)",
          }}
        />
        <motion.div className="absolute inset-[3%] rounded-full" style={{ transform: discRotate }}>
          <div className="khayameya absolute inset-[1.4cqw] rounded-full opacity-90" style={{ backgroundSize: "14cqw 14cqw" }} />
          <div
            className="absolute inset-[1.4cqw] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(11,8,7,.92) 0 18%, rgba(11,8,7,.2) 46%, rgba(11,8,7,.55) 100%)",
            }}
          />
          <div className="absolute left-1/2 top-1/2 h-[22cqw] w-[22cqw] -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber/60 bg-[#241109]">
            <Star />
          </div>

          {categories.map((c, i) => (
            <Plate key={c.id} category={c} angle={i * step} rot={rot} selected={c.slug === selected} onOpen={() => !moved.current && onSelect(c.slug)} />
          ))}
        </motion.div>


      </motion.div>

      <div className="mt-3 flex min-h-10 justify-center">
        <AnimatePresence>
          {!touched && (
            <motion.p
              aria-hidden
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-full border border-amber/60 bg-ink/85 px-4 py-2 text-sm text-cream"
            >
              لفّ الترابيزة، واضغط على أي طبق
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Plate({
  category,
  angle,
  rot,
  selected,
  onOpen,
}: {
  category: CategoryWithItems;
  angle: number;
  rot: MotionValue<number>;
  selected: boolean;
  onOpen: () => void;
}) {
  const upright = useTransform(rot, (r) => `rotate(${-(angle + r)}deg)`);
  const cover = category.items.find((i) => i.imageUrl)?.imageUrl ?? null;
  return (
    <div
      className="absolute left-1/2 top-1/2 h-[27cqw] w-[27cqw]"
      style={{ transform: `translate(-50%,-50%) rotate(${angle}deg) translateY(-31cqw)` }}
    >
      <motion.button
        type="button"
        onClick={onOpen}
        aria-label={`${category.nameAr} — ${toArabicDigits(category.items.length)} أنواع، اضغط لعرضها`}
        aria-pressed={selected}
        className="group relative block h-full w-full rounded-full"
        style={{ transform: upright }}
      >
        <span className={`absolute inset-0 overflow-hidden rounded-full bg-char transition-transform duration-300 group-hover:scale-105 group-focus-visible:scale-105 ${
          selected
            ? "scale-110 shadow-[0_0_0_0.8cqw_#f2a93b,0_0_0_1.5cqw_#9b2a1c,0_1.5cqw_3cqw_rgba(0,0,0,.7)]"
            : "shadow-[0_0_0_0.8cqw_rgba(243,230,204,.95),0_0_0_1.3cqw_#9b2a1c,0_1.5cqw_3cqw_rgba(0,0,0,.7)]"
        }`}>
          {cover ? (
            <Image src={cover} alt="" fill sizes="180px" className="object-cover" />
          ) : (
            <span className="khayameya block h-full w-full" />
          )}
        </span>
        <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-[1.6cqw] -translate-x-1/2 whitespace-nowrap rounded-full bg-ink/90 px-[2.4cqw] py-[0.8cqw] text-center text-[max(12px,3.4cqw)] font-semibold leading-tight text-cream ring-1 ring-amber/60">
          {category.nameAr}
          <span className="ms-2 text-amber">{toArabicDigits(category.items.length)}</span>
        </span>
      </motion.button>
    </div>
  );
}

function Star() {
  return (
    <svg viewBox="-50 -50 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
      <g fill="none" stroke="#f3e6cc" strokeOpacity=".75" strokeWidth="1.4">
        <rect x="-26" y="-26" width="52" height="52" />
        <rect x="-26" y="-26" width="52" height="52" transform="rotate(45)" />
        <circle r="12" />
      </g>
      <circle r="4" fill="#f2a93b" />
    </svg>
  );
}
