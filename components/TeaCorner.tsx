"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import type { MenuItem } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { AddControl } from "./AddControl";
import { useMotionPref } from "./MotionPref";
import { useOrder } from "./OrderContext";

/**
 * قول للقهوجي — in an Egyptian café nobody orders "a tea"; you tell the waiter
 * exactly how you take it. Build your glass (loose or bag, light or strong,
 * how many spoons, mint or not), watch it change on the brass tray, and the
 * order phrase writes itself the way you'd call it out. "Tell the waiter"
 * pours it and puts it in the order, with the details attached.
 */

type Kind = "كشري" | "فتلة";
const STRENGTH = ["خفيف", "وسط", "تقيل"] as const;
const SUGAR = ["سادة", "ع الريحة", "مظبوط", "زيادة", "زيادة أوي"] as const;
const LIQUID = ["#c86a22", "#962f0c", "#4f1606"];

function phrase(kind: Kind, strength: number, sugar: number, mint: boolean) {
  const parts = [`واحد شاي ${kind}${strength === 1 ? "" : ` ${STRENGTH[strength]}`}`];
  parts.push(sugar === 0 ? "سادة" : `سكره ${SUGAR[sugar]}`);
  if (mint) parts.push("بالنعناع");
  return parts.join("، ");
}

export function TeaCorner() {
  const { categories, add, addNote } = useOrder();
  const { reduced } = useMotionPref();
  const drinks = categories.find((c) => c.slug === "drinks")?.items ?? [];
  const mintTea = drinks.find((d) => /نعناع|mint/i.test(`${d.nameAr} ${d.nameEn ?? ""}`));
  const tea = drinks.find((d) => d !== mintTea && /شاي|tea/i.test(`${d.nameAr} ${d.nameEn ?? ""}`));
  const others = drinks.filter((d) => d !== tea && d !== mintTea);

  const [kind, setKind] = useState<Kind>("كشري");
  const [strength, setStrength] = useState(2);
  const [sugar, setSugar] = useState(2);
  const [mint, setMint] = useState(false);
  const [drops, setDrops] = useState<number[]>([]);
  const [pour, setPour] = useState(0);
  const [said, setSaid] = useState<string | null>(null);

  const item: MenuItem | undefined = mint ? (mintTea ?? tea) : tea;
  const orderable = !!item && item.isAvailable && item.price !== null;
  const words = phrase(kind, strength, sugar, mint);

  const setSugarTo = (n: number) => {
    const next = Math.max(0, Math.min(4, n));
    if (next > sugar && !reduced) setDrops((d) => [...d.slice(-4), Date.now()]);
    setSugar(next);
  };

  const tell = () => {
    if (!item || !orderable) return;
    add(item.id);
    addNote(words);
    setPour((p) => p + 1);
    setSaid(words);
  };

  return (
    <section
      id="shay"
      aria-label="ركن الشاي"
      className="relative overflow-hidden px-5 py-24 md:px-10 md:py-32"
      style={{ background: "radial-gradient(ellipse 60% 55% at 26% 70%, rgba(217,120,50,.28), transparent 70%), #120b07" }}
    >
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
        <div>
          <h2 className="font-display text-[clamp(3rem,8vw,5.5rem)] leading-[1.05] text-cream">قول للقهوجي</h2>
          <p className="mt-3 max-w-[38ch] text-lg leading-8 text-sand">مفيش حد بيطلب «شاي» وخلاص. ظبّط كوبايتك، وإحنا هنعملها زي ما بتحبها.</p>

          <div className="mt-8 space-y-6">
            <Choice label="الشاي" options={["كشري", "فتلة"] as const} value={kind} onChange={setKind} />
            <Choice label="التقل" options={STRENGTH} value={STRENGTH[strength]!} onChange={(v) => setStrength(STRENGTH.indexOf(v))} />

            <fieldset>
              <legend className="mb-2 text-sm text-sand">السكر</legend>
              <div className="flex items-center gap-4">
                <button type="button" onClick={() => setSugarTo(sugar - 1)} aria-label="معلقة أقل" className="h-11 w-11 rounded-full border border-cream/30 text-xl text-cream hover:border-amber hover:text-amber">
                  −
                </button>
                <div className="flex gap-1.5" aria-hidden>
                  {[0, 1, 2, 3].map((i) => (
                    <span key={i} className={`h-3 w-6 rounded-full transition-colors ${i < sugar ? "bg-cream" : "bg-cream/15"}`} />
                  ))}
                </div>
                <button type="button" onClick={() => setSugarTo(sugar + 1)} aria-label="معلقة زيادة" className="h-11 w-11 rounded-full bg-amber text-xl font-semibold text-ink hover:bg-cream">
                  +
                </button>
                <span className="min-w-24 text-cream" aria-live="polite">
                  {SUGAR[sugar]}
                </span>
              </div>
            </fieldset>

            <label className="flex w-fit cursor-pointer items-center gap-3 text-cream">
              <input type="checkbox" checked={mint} onChange={(e) => setMint(e.target.checked)} className="peer sr-only" />
              <span className="relative h-7 w-12 rounded-full bg-cream/15 transition-colors peer-checked:bg-[#5f9f3f] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-amber">
                <span className={`absolute top-1 h-5 w-5 rounded-full bg-cream transition-all ${mint ? "start-6" : "start-1"}`} />
              </span>
              بالنعناع
            </label>
          </div>

          {/* the order, as you'd call it out */}
          <div className="mt-9 border-t border-cream/15 pt-6">
            <p className="font-display text-[clamp(1.7rem,3.2vw,2.5rem)] leading-snug text-amber" aria-live="polite">
              «{words}»
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={tell}
                disabled={!orderable}
                className="rounded-full bg-amber px-7 py-3 font-semibold text-ink transition-colors hover:bg-cream disabled:opacity-50"
              >
                قول للقهوجي
              </button>
              {item && <span className="text-cream/80">{formatPrice(item.price)}</span>}
              <AnimatePresence>
                {said && (
                  <motion.span key={pour} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-sm text-[#a4b862]">
                    حاضر! اتضاف لطلبك
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>

          {others.length > 0 && (
            <div className="mt-10">
              <p className="text-sm text-sand">مش شاي؟</p>
              <ul className="mt-3 divide-y divide-cream/10">
                {others.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-4 py-3">
                    <span className="text-cream">
                      {d.nameAr} <span className="ms-2 text-sm text-sand">{formatPrice(d.price)}</span>
                    </span>
                    <AddControl item={d} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <Glass kind={kind} strength={strength} mint={mint} drops={drops} pour={pour} reduced={reduced} />
      </div>
    </section>
  );
}

function Choice<T extends string>({ label, options, value, onChange }: { label: string; options: readonly T[]; value: T; onChange: (v: T) => void }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm text-sand">{label}</legend>
      <div className="inline-flex rounded-full border border-cream/20 p-1">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            aria-pressed={o === value}
            onClick={() => onChange(o)}
            className={`rounded-full px-5 py-2 text-[0.95rem] transition-colors ${o === value ? "bg-cream text-ink" : "text-cream hover:text-amber"}`}
          >
            {o}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/** The Egyptian tea glass on a brass tray, drawn so every choice shows. */
function Glass({ kind, strength, mint, drops, pour, reduced }: { kind: Kind; strength: number; mint: boolean; drops: number[]; pour: number; reduced: boolean }) {
  const color = LIQUID[strength]!;
  // glass: flared lip at the top, ribbed lower third
  const outer = "M132 118 L268 118 L254 352 Q252 366 238 366 L162 366 Q148 366 146 352 Z";
  return (
    <svg viewBox="0 0 400 440" className="order-first mx-auto w-full max-w-[260px] sm:max-w-[340px] lg:order-none lg:max-w-[460px]" role="img" aria-label="كوباية شاي على صينية نحاس">
      <defs>
        <radialGradient id="brass" cx=".45" cy=".4" r=".7">
          <stop offset="0" stopColor="#f2c27a" />
          <stop offset=".55" stopColor="#c08038" />
          <stop offset="1" stopColor="#6e3d14" />
        </radialGradient>
        <clipPath id="glass-in">
          <path d="M138 124 L262 124 L249 348 Q247 360 235 360 L165 360 Q153 360 151 348 Z" />
        </clipPath>
        <linearGradient id="tea-depth" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".18" />
          <stop offset="1" stopColor="#000" stopOpacity=".35" />
        </linearGradient>
      </defs>

      {/* brass tray */}
      <ellipse cx="200" cy="378" rx="186" ry="44" fill="#2a1408" opacity=".6" />
      <ellipse cx="200" cy="368" rx="180" ry="42" fill="url(#brass)" />
      <ellipse cx="200" cy="366" rx="150" ry="32" fill="none" stroke="#7a4516" strokeWidth="2" />
      <ellipse cx="200" cy="366" rx="130" ry="26" fill="none" stroke="#f6d59a" strokeOpacity=".6" strokeDasharray="3 5" />
      <ellipse cx="200" cy="364" rx="66" ry="12" fill="#5a2e0e" opacity=".55" />

      {/* stream when the order is called */}
      <motion.path
        key={`s${pour}`}
        d="M200 -10 L200 150"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={pour === 0 || reduced ? { opacity: 0 } : { pathLength: [0, 1, 1], opacity: [1, 1, 0] }}
        transition={{ duration: 1.6, times: [0, 0.35, 1] }}
      />

      {/* the tea */}
      <g clipPath="url(#glass-in)">
        <rect x="120" y="100" width="160" height="280" fill="rgba(243,227,195,.05)" />
        <motion.g
          key={`l${pour}`}
          style={{ transformOrigin: "200px 360px" }}
          initial={{ scaleY: pour === 0 || reduced ? 1 : 0.08 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 1.2, delay: 0.25, ease: "easeOut" }}
        >
          <motion.rect x="120" y="150" width="160" height="230" animate={{ fill: color }} transition={{ duration: 0.6 }} />
          <rect x="120" y="150" width="160" height="230" fill="url(#tea-depth)" />
          {/* loose tea settles at the bottom of a كشري glass */}
          {kind === "كشري" && [0, 1, 2, 3, 4, 5, 6].map((i) => <circle key={i} cx={168 + i * 11} cy={352 - (i % 3) * 3} r={2.4} fill="#1d0702" opacity=".8" />)}
          {/* the froth on a glass poured from height */}
          <ellipse cx="200" cy="151" rx="60" ry="5" fill="#e9c08a" opacity=".85" />
        </motion.g>

        {/* sugar: each spoon drops a cube that sinks and dissolves */}
        {drops.map((id, i) => (
          <motion.rect
            key={id}
            x={186 + (i % 3) * 12}
            width="12"
            height="12"
            rx="2"
            fill="#fbf6ea"
            initial={{ y: 60, opacity: 1, rotate: 0 }}
            animate={{ y: [60, 146, 300], opacity: [1, 1, 0], rotate: [0, 30, 80] }}
            transition={{ duration: 1.6, times: [0, 0.3, 1], ease: "easeIn" }}
          />
        ))}

        <AnimatePresence>
          {mint && (
            <motion.g initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="leaf-bob">
              <path d="M170 156 Q190 138 208 154 Q190 170 170 156Z" fill="#5f9f3f" stroke="#3f7a2a" strokeWidth="1.2" transform="rotate(-14 189 155)" />
              <path d="M200 160 Q218 146 234 158 Q218 172 200 160Z" fill="#6fb34a" stroke="#3f7a2a" strokeWidth="1.2" transform="rotate(18 217 159)" />
            </motion.g>
          )}
        </AnimatePresence>
      </g>

      {/* drops land: a ring on the surface */}
      {drops.map((id) => (
        <motion.ellipse key={`r${id}`} cx="200" cy="152" rx="10" ry="2.5" fill="none" stroke="#f3e3c3" initial={{ opacity: 0, scale: 1 }} animate={{ opacity: [0, 0.8, 0], scale: [1, 1, 5] }} transition={{ duration: 0.9, delay: 0.42 }} />
      ))}

      {/* glass: rim, ribs, highlight */}
      <path d={outer} fill="none" stroke="rgba(243,227,195,.75)" strokeWidth="3" strokeLinejoin="round" />
      <ellipse cx="200" cy="118" rx="68" ry="6" fill="none" stroke="rgba(243,227,195,.6)" strokeWidth="2" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <path key={i} d={`M${158 + i * 12} 278 L${160 + i * 11.4} 360`} stroke="rgba(243,227,195,.22)" strokeWidth="3" />
      ))}
      <path d="M146 140 L156 330" stroke="rgba(255,255,255,.28)" strokeWidth="5" strokeLinecap="round" />

      {/* a bag's string and tag hang over the rim */}
      <AnimatePresence>
        {kind === "فتلة" && (
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <path d="M232 230 Q250 150 262 120 Q270 104 280 126 L284 160" fill="none" stroke="#efe6d4" strokeWidth="1.5" />
            <rect x="272" y="160" width="26" height="30" rx="2" fill="#e4a72e" />
            <rect x="276" y="166" width="18" height="4" fill="#7d1812" />
          </motion.g>
        )}
      </AnimatePresence>

      {/* steam */}
      {!reduced &&
        [0, 1, 2].map((i) => (
          <ellipse key={i} className="steam" cx={180 + i * 20} cy="96" rx="7" ry="18" fill="rgba(243,227,195,.4)" style={{ animationDelay: `${i * 0.9}s`, transformBox: "fill-box" }} />
        ))}
    </svg>
  );
}
