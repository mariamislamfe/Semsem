"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import type { MenuItem } from "@/lib/types";
import { formatPrice, toArabicDigits } from "@/lib/format";
import { useMotionPref } from "./MotionPref";
import { useOrder } from "./OrderContext";
import { Reveal } from "./Reveal";

/** Liquid colour per drink — a sensible guess from the name, with a tea default. */
function liquidFor(item: MenuItem) {
  const n = `${item.nameAr} ${item.nameEn ?? ""}`.toLowerCase();
  // mint tea is plain tea with two leaves floating in it
  if (/نعناع|mint/.test(n)) return { color: "#b5481c", cold: false, leaves: true };
  if (/قهوة|coffee/.test(n)) return { color: "#3a2214", cold: false, leaves: false };
  if (/بيبسي|كولا|غازي|soda|cola|pepsi/.test(n)) return { color: "#2b1a12", cold: true, leaves: false };
  return { color: "#b5481c", cold: !item.tags.includes("ساخن") && item.tags.includes("بارد"), leaves: false };
}

/**
 * ركن الشاي — a kettle that is always on the fire. Pick a drink and the kettle
 * tips, a thin stream falls, and the glass fills with that drink. Warm on
 * purpose: this is the part of the tent where people stay.
 */
export function TeaCorner() {
  const { categories, qty, add, remove } = useOrder();
  const drinks = categories.find((c) => c.slug === "drinks")?.items ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(drinks[0]?.id ?? null);
  const [pour, setPour] = useState(0);
  const { reduced } = useMotionPref();

  const selected = drinks.find((d) => d.id === selectedId) ?? drinks[0];
  if (!selected) return null;
  const liquid = liquidFor(selected);

  const choose = (id: string) => {
    setSelectedId(id);
    setPour((n) => n + 1);
  };

  return (
    <section
      id="shay"
      className="relative overflow-hidden px-5 py-24 md:px-10 md:py-32"
      style={{
        background:
          "radial-gradient(ellipse 60% 55% at 30% 85%, rgba(217,105,42,.28), transparent 70%), linear-gradient(to bottom, #15100d, #1c0e07 60%, #0b0807)",
      }}
    >
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* ───── the list ───── */}
        <div>
          <Reveal as="header">
            <p className="font-latin text-sm italic tracking-[0.35em] text-amber">TEA CORNER</p>
            <h2 className="mt-4 font-display text-[clamp(3rem,8vw,5.5rem)] leading-[1.1] text-cream">ركن الشاي</h2>
            <p className="mt-4 text-lg leading-8 text-sand">الكنكة على النار من بدري.. اختار كوبايتك وهنصبّها لك.</p>
          </Reveal>

          <ul className="mt-8 space-y-3" role="radiogroup" aria-label="المشروبات">
            {drinks.map((d) => {
              const on = d.id === selected.id;
              const q = qty(d.id);
              const orderable = d.isAvailable && d.price !== null;
              return (
                <li
                  key={d.id}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition-colors ${
                    on ? "border-amber bg-amber/10" : "border-cream/15 bg-ink/40"
                  }`}
                >
                  <button
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => choose(d.id)}
                    className="min-w-0 flex-1 text-start"
                  >
                    <span className="block text-lg font-semibold text-cream">{d.nameAr}</span>
                    <span className="block text-sm text-sand">
                      {d.nameEn && <span className="font-latin italic">{d.nameEn} · </span>}
                      {formatPrice(d.price)}
                      {!d.isAvailable && <span className="ms-2 text-cloth">خلصت النهارده</span>}
                    </span>
                  </button>

                  {orderable &&
                    (q === 0 ? (
                      <button
                        type="button"
                        onClick={() => {
                          choose(d.id);
                          add(d.id);
                        }}
                        aria-label={`ضيف ${d.nameAr} للطلب`}
                        className="shrink-0 rounded-full bg-amber px-4 py-1.5 text-sm font-semibold text-ink transition-colors hover:bg-cream"
                      >
                        + ضيف
                      </button>
                    ) : (
                      <div className="flex shrink-0 items-center gap-1 rounded-full border border-amber/70 p-1">
                        <button type="button" onClick={() => remove(d.id)} aria-label={`قلّل ${d.nameAr}`} className="h-8 w-8 rounded-full text-lg text-cream hover:bg-cream/10">
                          −
                        </button>
                        <span className="min-w-6 text-center tabular-nums text-cream" aria-live="polite">
                          {toArabicDigits(q)}
                        </span>
                        <button type="button" onClick={() => add(d.id)} aria-label={`زوّد ${d.nameAr}`} className="h-8 w-8 rounded-full bg-amber text-lg font-semibold text-ink hover:bg-cream">
                          +
                        </button>
                      </div>
                    ))}
                </li>
              );
            })}
          </ul>
        </div>

        {/* ───── the kettle ───── */}
        <Reveal delay={0.1}>
          <svg viewBox="0 0 620 420" className="mx-auto w-full max-w-[560px]" role="img" aria-label={`كنكة شاي على النار وكوباية ${selected.nameAr}`}>
            <defs>
              <linearGradient id="copper" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#e0a060" />
                <stop offset=".5" stopColor="#b86a3c" />
                <stop offset="1" stopColor="#6b3a1c" />
              </linearGradient>
              <clipPath id="glassClip">
                <path d="M425 250 L435 366 Q436 378 448 378 L492 378 Q504 378 505 366 L515 250 Z" />
              </clipPath>
            </defs>

            {/* warm floor */}
            <ellipse cx="310" cy="392" rx="290" ry="22" fill="rgba(242,169,59,.16)" />

            {/* stove + flame */}
            <rect x="60" y="322" width="190" height="44" rx="8" fill="#2a1a12" />
            <rect x="60" y="322" width="190" height="6" rx="3" fill="#4a2c1c" />
            <g transform="translate(155 322)">
              {[-34, -12, 12, 34].map((dx, i) => (
                <path
                  key={dx}
                  className="flame"
                  d="M0 0 C-11 -9 -9 -26 0 -40 C9 -26 11 -9 0 0Z"
                  fill={i % 2 ? "#f2a93b" : "#e0762a"}
                  transform={`translate(${dx} 0)`}
                  style={{ animationDelay: `${i * 0.18}s` }}
                />
              ))}
            </g>

            {/* kettle */}
            <g transform="translate(0 -44)">
            <motion.g
              key={`k${pour}`}
              style={{ transformOrigin: "155px 300px" }}
              animate={reduced || pour === 0 ? undefined : { rotate: [0, 17, 17, 0] }}
              transition={{ duration: 2.1, times: [0, 0.25, 0.75, 1], ease: "easeInOut" }}
            >
              <path d="M85 268 Q85 188 155 188 Q225 188 225 268 Q225 312 155 312 Q85 312 85 268Z" fill="url(#copper)" />
              <path d="M118 192 Q155 150 192 192Z" fill="url(#copper)" />
              <circle cx="155" cy="150" r="9" fill="#e0a060" />
              <path d="M214 238 Q262 232 284 190 L298 198 Q274 258 222 276Z" fill="url(#copper)" />
              <path d="M88 232 Q38 232 46 278 Q54 304 94 292" fill="none" stroke="#6b3a1c" strokeWidth="10" strokeLinecap="round" />
              <path d="M96 240 Q96 205 150 200" fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="5" strokeLinecap="round" />
            </motion.g>
            </g>

            {/* steam from the kettle */}
            {!reduced &&
              [0, 1, 2].map((i) => (
                <ellipse
                  key={i}
                  className="steam"
                  cx={150 + i * 14}
                  cy="96"
                  rx="7"
                  ry="16"
                  fill="rgba(243,230,204,.45)"
                  style={{ animationDelay: `${i * 0.9}s`, transformBox: "fill-box" }}
                />
              ))}

            {/* the stream */}
            <motion.path
              key={`s${pour}`}
              d="M300 156 Q336 172 338 214 Q340 258 470 266"
              fill="none"
              stroke={liquid.color}
              strokeWidth="5"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={pour === 0 || reduced ? { pathLength: 0, opacity: 0 } : { pathLength: [0, 1, 1, 0], opacity: [0, 1, 1, 0] }}
              transition={{ duration: 2.1, times: [0, 0.25, 0.75, 1] }}
            />

            {/* glass + saucer */}
            <ellipse cx="470" cy="382" rx="76" ry="12" fill="#3a2418" />
            <ellipse cx="470" cy="378" rx="62" ry="8" fill="#5a3826" />
            <g clipPath="url(#glassClip)">
              <rect x="420" y="240" width="100" height="140" fill="rgba(243,230,204,.06)" />
              <motion.rect
                key={`l${pour}-${selected.id}`}
                x="420"
                y="270"
                width="100"
                height="110"
                fill={liquid.color}
                style={{ transformOrigin: "470px 380px" }}
                initial={{ scaleY: pour === 0 ? 0.78 : 0.05 }}
                animate={{ scaleY: 0.92 }}
                transition={{ duration: pour === 0 ? 0 : 1.4, delay: pour === 0 ? 0 : 0.5, ease: "easeOut" }}
              />
              {liquid.leaves && (
                <g className="leaf-bob">
                  <path d="M452 292 Q470 276 486 290 Q470 306 452 292Z" fill="#5f9f3f" stroke="#3f7a2a" strokeWidth="1.2" transform="rotate(-18 469 291)" />
                  <path d="M474 304 Q490 290 504 302 Q490 316 474 304Z" fill="#6fb34a" stroke="#3f7a2a" strokeWidth="1.2" transform="rotate(22 489 303)" />
                </g>
              )}
              {liquid.cold &&
                [0, 1, 2, 3, 4].map((i) => (
                  <circle
                    key={i}
                    className="bubble"
                    cx={445 + i * 14}
                    cy="368"
                    r={2 + (i % 2)}
                    fill="rgba(243,230,204,.55)"
                    style={{ animationDelay: `${i * 0.5}s` }}
                  />
                ))}
            </g>
            <path
              d="M425 250 L435 366 Q436 378 448 378 L492 378 Q504 378 505 366 L515 250"
              fill="none"
              stroke="rgba(243,230,204,.7)"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <path d="M436 262 L443 360" stroke="rgba(255,255,255,.3)" strokeWidth="4" strokeLinecap="round" />

            {/* steam from the glass (hot drinks only) */}
            {!reduced &&
              !liquid.cold &&
              [0, 1].map((i) => (
                <ellipse
                  key={i}
                  className="steam"
                  cx={462 + i * 16}
                  cy="236"
                  rx="6"
                  ry="14"
                  fill="rgba(243,230,204,.4)"
                  style={{ animationDelay: `${i * 1.1}s`, transformBox: "fill-box" }}
                />
              ))}
          </svg>
          <p className="mt-2 text-center text-sm text-sand">
            {selected.nameAr} <span className="text-amber">— {formatPrice(selected.price)}</span>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
