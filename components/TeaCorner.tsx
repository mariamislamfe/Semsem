"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import type { MenuItem } from "@/lib/types";
import { formatPrice, toArabicDigits } from "@/lib/format";
import { useMotionPref } from "./MotionPref";
import { useOrder } from "./OrderContext";

/**
 * صينية الشاي — drinks are ordered for the whole sitting, not one by one.
 * Say how many of each and the glasses appear on a brass tray around the
 * teapot, each drawn from above as what it is (tea, tea with mint leaves,
 * coffee in its cup, soda with ice). Tap a glass to take it off. Then the
 * whole tray goes into the order at once.
 */

type Kind = "tea" | "mint" | "coffee" | "soda";
const MAX = 12;
const SIZE = 440; // svg viewBox
const C = SIZE / 2;
const RING = 140;

function kindOf(d: MenuItem): Kind {
  const n = `${d.nameAr} ${d.nameEn ?? ""}`.toLowerCase();
  if (/نعناع|mint/.test(n)) return "mint";
  if (/قهوة|coffee/.test(n)) return "coffee";
  if (/بيبسي|كولا|غازي|soda|cola|pepsi/.test(n)) return "soda";
  return "tea";
}

export function TeaCorner() {
  const { categories, add } = useOrder();
  const { reduced } = useMotionPref();
  const drinks = useMemo(() => (categories.find((c) => c.slug === "drinks")?.items ?? []).filter((d) => d.isAvailable && d.price !== null), [categories]);
  const [tray, setTray] = useState<Record<string, number>>({});
  const [sent, setSent] = useState<string | null>(null);

  const total = drinks.reduce((n, d) => n + (tray[d.id] ?? 0), 0);
  const price = drinks.reduce((n, d) => n + (tray[d.id] ?? 0) * (d.price ?? 0), 0);

  // one entry per glass, in menu order; keys stay stable as you add/remove
  const glasses = drinks.flatMap((d) => Array.from({ length: tray[d.id] ?? 0 }, (_, k) => ({ key: `${d.id}-${k}`, drink: d, kind: kindOf(d) })));

  const change = (id: string, delta: number) => {
    setSent(null);
    setTray((t) => {
      const cur = t[id] ?? 0;
      const next = Math.max(0, cur + delta);
      if (delta > 0 && total >= MAX) return t;
      return { ...t, [id]: next };
    });
  };

  const summary = drinks
    .filter((d) => (tray[d.id] ?? 0) > 0)
    .map((d) => `${toArabicDigits(tray[d.id]!)} ${d.nameAr}`)
    .join("، ");

  const send = () => {
    for (const d of drinks) for (let k = 0; k < (tray[d.id] ?? 0); k++) add(d.id);
    setSent(summary);
    setTray({});
  };

  return (
    <section
      id="shay"
      aria-label="صينية الشاي"
      className="relative overflow-hidden px-5 py-24 md:px-10 md:py-28"
      style={{ background: "radial-gradient(ellipse 55% 60% at 30% 55%, rgba(201,134,60,.22), transparent 70%), #110a06" }}
    >
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <div>
          <h2 className="font-display text-[clamp(3rem,8vw,5.5rem)] leading-[1.05] text-cream">صينية الشاي</h2>
          <p className="mt-3 max-w-[40ch] text-lg leading-8 text-sand">
            القعدة كام واحد؟ كل واحد يختار كوبايته، والصينية تيجي لحد عندكم.
          </p>

          <ul className="mt-6 divide-y divide-cream/10 border-y border-cream/10 lg:mt-8">
            {drinks.map((d) => {
              const q = tray[d.id] ?? 0;
              return (
                <li key={d.id} className="flex items-center gap-4 py-3">
                  <svg viewBox="-30 -30 60 60" className="h-11 w-11 shrink-0" aria-hidden>
                    <GlassTop kind={kindOf(d)} />
                  </svg>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-cream">{d.nameAr}</p>
                    <p className="text-sm text-sand">{formatPrice(d.price)}</p>
                  </div>
                  <div className="flex items-center gap-1 rounded-full border border-cream/25 p-1" role="group" aria-label={`عدد ${d.nameAr} على الصينية`}>
                    <button type="button" onClick={() => change(d.id, -1)} disabled={q === 0} aria-label={`شيل ${d.nameAr}`} className="h-9 w-9 rounded-full text-lg text-cream hover:bg-cream/10 disabled:opacity-30">
                      −
                    </button>
                    <span className="min-w-7 text-center tabular-nums text-cream" aria-live="polite">
                      {toArabicDigits(q)}
                    </span>
                    <button type="button" onClick={() => change(d.id, 1)} disabled={total >= MAX} aria-label={`حط ${d.nameAr}`} className="h-9 w-9 rounded-full bg-amber text-lg font-semibold text-ink hover:bg-cream disabled:opacity-40">
                      +
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 min-h-24">
            {total > 0 ? (
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-cream">
                  {summary}
                  <span className="ms-3 font-display text-2xl text-amber">{formatPrice(price)}</span>
                </p>
                <button type="button" onClick={send} className="rounded-full bg-amber px-7 py-3 font-semibold text-ink transition-colors hover:bg-cream">
                  ضيف الصينية للطلب
                </button>
              </div>
            ) : sent ? (
              <p className="text-[#a4b862]" aria-live="polite">
                الصينية جاية: {sent}. اتضافت لطلبك.
              </p>
            ) : (
              <p className="text-sand/70">الصينية لسه فاضية.. حط عليها اللي هتشربوه.</p>
            )}
          </div>
        </div>

        {/* the tray, from above */}
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="order-first mx-auto w-full max-w-[270px] sm:max-w-[400px] lg:order-none lg:max-w-[540px]" role="img" aria-label={total ? `صينية عليها ${summary}` : "صينية شاي فاضية"}>
          <defs>
            <radialGradient id="brass-top" cx=".42" cy=".38" r=".75">
              <stop offset="0" stopColor="#f3cd8a" />
              <stop offset=".5" stopColor="#c58a40" />
              <stop offset="1" stopColor="#6b3c14" />
            </radialGradient>
            <radialGradient id="tray-light" cx=".38" cy=".32" r=".6">
              <stop offset="0" stopColor="#fff6dc" stopOpacity=".35" />
              <stop offset="1" stopColor="#fff6dc" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx={C + 6} cy={C + 12} r="206" fill="#000" opacity=".45" />
          <circle cx={C} cy={C} r="206" fill="url(#brass-top)" />
          <circle cx={C} cy={C} r="196" fill="none" stroke="#7a4516" strokeWidth="3" />
          <circle cx={C} cy={C} r="186" fill="none" stroke="#f6d59a" strokeOpacity=".55" strokeDasharray="3 6" />
          <circle cx={C} cy={C} r="96" fill="none" stroke="#8a4f1c" strokeOpacity=".5" />
          {/* engraved petals around the centre */}
          {Array.from({ length: 16 }, (_, i) => (
            <path key={i} d={`M${C} ${C - 100} q 10 -14 0 -26 q -10 12 0 26`} fill="none" stroke="#7a4516" strokeOpacity=".5" transform={`rotate(${i * 22.5} ${C} ${C})`} />
          ))}
          <circle cx={C} cy={C} r="206" fill="url(#tray-light)" />

          <Teapot reduced={reduced} />

          <AnimatePresence>
            {glasses.map((g, i) => {
              const a = -Math.PI / 2 + (i / MAX) * Math.PI * 2;
              const x = C + RING * Math.cos(a);
              const y = C + RING * Math.sin(a);
              return (
                <motion.g
                  key={g.key}
                  role="button"
                  tabIndex={0}
                  aria-label={`شيل ${g.drink.nameAr} من الصينية`}
                  className="cursor-pointer outline-none"
                  onClick={() => change(g.drink.id, -1)}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && change(g.drink.id, -1)}
                  initial={reduced ? false : { x: C + 260 * Math.cos(a), y: C + 260 * Math.sin(a), opacity: 0, scale: 1.3 }}
                  animate={{ x, y, opacity: 1, scale: 1 }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
                  transition={{ type: "spring", stiffness: 160, damping: 18 }}
                >
                  <GlassTop kind={g.kind} />
                </motion.g>
              );
            })}
          </AnimatePresence>
        </svg>
      </div>
    </section>
  );
}

/** A teapot (براد) seen from above: body, lid, knob, spout and handle. */
function Teapot({ reduced }: { reduced: boolean }) {
  return (
    <g>
      <ellipse cx={C + 4} cy={C + 8} rx="64" ry="62" fill="#000" opacity=".35" />
      <path d={`M${C + 46} ${C - 18} Q ${C + 76} ${C - 24} ${C + 84} ${C - 48} L ${C + 94} ${C - 42} Q ${C + 84} ${C - 10} ${C + 50} ${C + 4} Z`} fill="#b9b2a3" stroke="#6f6a5f" />
      <path d={`M${C - 56} ${C - 22} Q ${C - 92} ${C} ${C - 56} ${C + 22}`} fill="none" stroke="#6f6a5f" strokeWidth="9" strokeLinecap="round" />
      <circle cx={C} cy={C} r="58" fill="#d9d3c4" stroke="#7d776a" strokeWidth="2" />
      <circle cx={C} cy={C} r="46" fill="#c9c2b2" />
      <circle cx={C} cy={C} r="34" fill="#e4dfd2" stroke="#8e887a" />
      <circle cx={C} cy={C} r="10" fill="#7d776a" />
      <ellipse cx={C - 16} cy={C - 20} rx="16" ry="8" fill="#fff" opacity=".45" transform={`rotate(-30 ${C - 16} ${C - 20})`} />
      {!reduced &&
        [0, 1, 2].map((i) => (
          <ellipse key={i} className="steam" cx={C + 86 + i * 6} cy={C - 64} rx="6" ry="14" fill="rgba(243,227,195,.35)" style={{ animationDelay: `${i * 0.9}s`, transformBox: "fill-box" }} />
        ))}
    </g>
  );
}

/** One glass seen from above, centred on 0,0. */
function GlassTop({ kind }: { kind: Kind }) {
  if (kind === "coffee") {
    return (
      <g>
        <circle r="27" fill="#efe6d4" stroke="#b9a98a" />
        <circle r="19" fill="#fbf6ec" stroke="#cbbd9f" />
        <circle r="15" fill="#3a2214" />
        <circle r="15" fill="none" stroke="#a0703e" strokeWidth="3" opacity=".9" />
        <circle cx="-4" cy="-3" r="3" fill="#7a4e28" opacity=".7" />
        <path d="M18 -6 Q 30 0 18 6" fill="none" stroke="#cbbd9f" strokeWidth="4" strokeLinecap="round" />
      </g>
    );
  }
  const liquid = kind === "soda" ? "#2b1408" : "#b5481c";
  return (
    <g>
      <circle r="22" fill="rgba(243,227,195,.12)" stroke="rgba(255,250,235,.85)" strokeWidth="2.2" />
      <circle r="18" fill={liquid} />
      <circle r="18" fill="none" stroke={kind === "soda" ? "#5a3a24" : "#e1955a"} strokeWidth="2" opacity=".8" />
      {kind !== "soda" && <ellipse cx="-6" cy="-7" rx="7" ry="3" fill="#ffd9a0" opacity=".35" transform="rotate(-30 -6 -7)" />}
      {kind === "mint" && (
        <g>
          <path d="M-12 -2 Q -2 -12 8 -4 Q -2 6 -12 -2Z" fill="#5f9f3f" stroke="#3f7a2a" />
          <path d="M-2 4 Q 8 -4 14 6 Q 4 12 -2 4Z" fill="#6fb34a" stroke="#3f7a2a" />
        </g>
      )}
      {kind === "soda" && (
        <g>
          <rect x="-11" y="-10" width="9" height="9" rx="2" fill="#e8f0f4" opacity=".75" transform="rotate(15 -6 -5)" />
          <rect x="1" y="-2" width="9" height="9" rx="2" fill="#e8f0f4" opacity=".65" transform="rotate(-20 5 2)" />
          {[[-6, 8], [8, -9], [-12, 3], [10, 10]].map(([x, y]) => (
            <circle key={`${x}${y}`} cx={x} cy={y} r="1.4" fill="#fff" opacity=".7" />
          ))}
        </g>
      )}
    </g>
  );
}
