"use client";

import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CategoryWithItems, MenuItem } from "@/lib/types";
import { formatPrice, toArabicDigits } from "@/lib/format";
import { AddControl } from "./AddControl";
import { MenuList } from "./MenuList";
import { useMotionPref } from "./MotionPref";
import { Sheet } from "./Sheet";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * الصينية — the menu as a curved copper tray on the red tablecloth.
 *
 * Pick a category above and the tray turns: that category's dishes slide along
 * the arc into place, and the last stop on the tray asks if you want anything
 * else. Drag / swipe the tray (or use the arrows) when it holds more than fits.
 * Every dish is a real button/stepper, so keyboard and screen readers get the
 * same menu without the motion.
 */

interface Geo {
  W: number;
  plate: number;
  R: number;
  step: number; // radians between neighbours
  half: number; // half the visible arc, radians
  bottom: number; // y of the lowest plate's top edge (θ = 0)
  height: number;
}

function geometry(W: number): Geo {
  const mobile = W < 720;
  const plate = mobile ? Math.min(W * 0.46, 200) : Math.min(Math.max(W * 0.135, 170), 230);
  const R = mobile ? W * 1.05 : W * 0.62;
  const step = (plate * (mobile ? 1.18 : 1.42)) / R;
  const half = mobile ? 0.62 : 0.72;
  const rise = R * (1 - Math.cos(half));
  const bottom = 30 + rise;
  // plate + name/price/stepper under the lowest plate
  const height = bottom + plate + (mobile ? 150 : 170);
  return { W, plate, R, step, half, bottom, height };
}

type Slot = { kind: "dish"; item: MenuItem } | { kind: "more" };

export function Sofra({ categories, isSample, all }: { categories: CategoryWithItems[]; isSample: boolean; all: CategoryWithItems[] }) {
  const { reduced } = useMotionPref();
  const stage = useRef<HTMLDivElement>(null);
  const cards = useRef<Array<HTMLElement | null>>([]);
  const turn = useRef({ c: 0 }); // continuous index of the slot facing you
  const drag = useRef<{ x: number; c: number } | null>(null);
  const [geo, setGeo] = useState<Geo | null>(null);
  const [slug, setSlug] = useState(categories[0]?.slug ?? "");
  const [written, setWritten] = useState(false);

  const current = categories.find((c) => c.slug === slug) ?? categories[0];
  const others = categories.filter((c) => c.slug !== current?.slug);
  const slots: Slot[] = current ? [...current.items.map((item) => ({ kind: "dish" as const, item })), { kind: "more" as const }] : [];
  const n = slots.length;

  // measure
  useLayoutEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const w = Math.round(e?.contentRect.width ?? el.clientWidth);
      setGeo((g) => (g?.W === w ? g : geometry(w)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /** Range the tray may turn through, so its ends never stand empty. */
  const limits = useCallback(() => {
    if (!geo) return { lo: 0, hi: 0 };
    const fit = Math.floor(geo.half / geo.step); // slots that fit on each side of centre
    const mid = (n - 1) / 2;
    return { lo: Math.min(fit, mid), hi: Math.max(n - 1 - fit, mid) };
  }, [geo, n]);

  /** Place every card on the arc for the current turn. */
  const render = useCallback(() => {
    if (!geo) return;
    const { W, R, plate, step, half, bottom } = geo;
    const c = turn.current.c;
    for (let i = 0; i < cards.current.length; i++) {
      const el = cards.current[i];
      if (!el) continue;
      // RTL: the first dish sits on the right, the rest follow to the left
      const th = (c - i) * step;
      const x = W / 2 + R * Math.sin(th) - plate / 2;
      const y = bottom - R * (1 - Math.cos(th));
      const fade = 1 - gsap.utils.clamp(0, 1, (Math.abs(th) - half) / (step * 0.6));
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      el.style.opacity = fade.toFixed(3);
      el.style.visibility = fade < 0.02 ? "hidden" : "visible";
      // the dish turns with the tray; the writing under it stays level
      const plateEl = el.querySelector<HTMLElement>("[data-turn]");
      if (plateEl) plateEl.style.transform = `rotate(${(-th * 180) / Math.PI}deg)`;
    }
  }, [geo]);

  const turnTo = useCallback(
    (c: number, duration = 0.9, ease = "power3.out") => {
      gsap.to(turn.current, { c, duration: reduced ? 0 : duration, ease, overwrite: true, onUpdate: render });
    },
    [reduced, render],
  );

  // a category arrives: the tray turns and its dishes slide along the arc into place.
  // The very first arrival waits until the tray is actually on screen.
  const seen = useRef(false);
  useGSAP(
    () => {
      if (!geo) return;
      const { lo } = limits();
      if (reduced) {
        turn.current.c = lo;
        render();
        return;
      }
      turn.current.c = lo + 3.2;
      render();
      if (seen.current) {
        turnTo(lo, 1.25, "expo.out");
        return;
      }
      const st = ScrollTrigger.create({
        trigger: stage.current,
        start: "top 70%",
        once: true,
        onEnter: () => {
          seen.current = true;
          turnTo(lo, 1.6, "expo.out");
        },
      });
      return () => st.kill();
    },
    { dependencies: [slug, geo] },
  );

  useEffect(() => render(), [render]);

  const choose = (s: string) => {
    if (s === slug) return;
    if (reduced || !geo) {
      setSlug(s);
      return;
    }
    // the current dishes leave along the arc the other way, then the new ones come in
    gsap.to(turn.current, {
      c: limits().lo - 3,
      duration: 0.42,
      ease: "power2.in",
      overwrite: true,
      onUpdate: render,
      onComplete: () => setSlug(s),
    });
  };

  const nudge = (dir: 1 | -1) => {
    const { lo, hi } = limits();
    turnTo(gsap.utils.clamp(lo, hi, Math.round(turn.current.c) + dir));
  };

  // drag / swipe the tray
  const onDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button, a")) return;
    drag.current = { x: e.clientX, c: turn.current.c };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    gsap.killTweensOf(turn.current);
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || !geo) return;
    const { lo, hi } = limits();
    const raw = d.c - (e.clientX - d.x) / (geo.R * geo.step);
    // past the ends it resists instead of stopping dead
    turn.current.c = raw < lo ? lo - (lo - raw) * 0.3 : raw > hi ? hi + (raw - hi) * 0.3 : raw;
    render();
  };
  const onUp = () => {
    if (!drag.current) return;
    drag.current = null;
    const { lo, hi } = limits();
    turnTo(gsap.utils.clamp(lo, hi, Math.round(turn.current.c)), 0.7);
  };

  if (!current) return null;
  const { lo, hi } = limits();
  const scrollable = hi > lo;

  return (
    <section id="sofra" aria-label="المنيو" className="relative overflow-hidden bg-cloth pb-16 pt-24 md:pb-24 md:pt-28">
      <div aria-hidden className="khayameya pointer-events-none absolute inset-0 opacity-[0.12]" style={{ backgroundSize: "150px 150px" }} />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_55%,transparent_30%,rgba(50,6,3,.6)_100%)]" />

      <div className="relative mx-auto max-w-6xl px-5 text-center">
        <h2 data-anim="heading" className="font-display text-[clamp(3.2rem,8vw,6.5rem)] leading-none text-cream">الصينية</h2>
        <p data-anim="fade" className="mx-auto mt-3 max-w-[40ch] text-cream/85">اختار من فوق، والصينية هتلف وتجيبلك أنواعه.</p>

        <div data-anim="stagger" role="tablist" aria-label="أقسام المنيو" className="no-scrollbar mt-8 flex gap-x-7 gap-y-2 overflow-x-auto px-1 pb-2 sm:flex-wrap sm:justify-center md:gap-x-12">
          {categories.map((c) => {
            const on = c.slug === current.slug;
            return (
              <button
                key={c.id}
                role="tab"
                type="button"
                aria-selected={on}
                onClick={() => choose(c.slug)}
                className={`relative shrink-0 pb-2 font-display text-[clamp(1.7rem,3.4vw,2.6rem)] leading-tight transition-colors ${
                  on ? "text-cream" : "text-cream/45 hover:text-cream/80"
                }`}
              >
                {c.nameAr}
                <span className="ms-2 align-super font-body text-sm text-amber/90">{toArabicDigits(c.items.length)}</span>
                <span aria-hidden className={`absolute inset-x-0 bottom-0 border-b-2 border-dashed border-amber transition-opacity ${on ? "opacity-100" : "opacity-0"}`} />
              </button>
            );
          })}
        </div>
        {current.blurbAr && <p className="mt-2 text-sm text-cream/70">{current.blurbAr}</p>}
      </div>

      {/* the tray */}
      <div
        ref={stage}
        role="tabpanel"
        aria-label={current.nameAr}
        className="relative mx-auto mt-4 w-full max-w-[1500px] touch-pan-y select-none"
        style={{ height: geo?.height ?? 640, cursor: scrollable ? "grab" : "default" }}
        onPointerDown={scrollable ? onDown : undefined}
        onPointerMove={scrollable ? onMove : undefined}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") nudge(1);
          if (e.key === "ArrowRight") nudge(-1);
        }}
        onFocus={(e) => {
          // keyboard: bring the focused dish to the middle of the tray
          const card = (e.target as HTMLElement).closest<HTMLElement>("[data-slot]");
          if (card && scrollable) turnTo(gsap.utils.clamp(lo, hi, Number(card.dataset.slot)));
        }}
      >
        {geo && <Tray geo={geo} />}

        {slots.map((s, i) => (
          <article
            key={`${current.id}-${s.kind === "dish" ? s.item.id : "more"}`}
            ref={(el) => {
              cards.current[i] = el;
            }}
            data-slot={i}
            className="absolute left-0 top-0 flex flex-col items-center text-center will-change-transform"
            style={{ width: geo?.plate ?? 200, opacity: 0 }}
          >
            {s.kind === "dish" ? <DishPlate item={s.item} /> : <MorePlate others={others} onPick={choose} />}
            {s.kind === "dish" && (
              <div className="mt-4 w-[150%]">
                <h3 className="text-lg font-semibold text-cream md:text-xl">{s.item.nameAr}</h3>
                {s.item.descriptionAr && <p className="mx-auto mt-1 line-clamp-2 max-w-[24ch] text-sm leading-6 text-cream/75">{s.item.descriptionAr}</p>}
                <div className="mt-3 flex items-center justify-center gap-3">
                  <span className={`font-display text-2xl ${s.item.isAvailable ? "text-amber" : "text-cream/50 line-through"}`}>{formatPrice(s.item.price)}</span>
                  <AddControl item={s.item} />
                </div>
              </div>
            )}
          </article>
        ))}

        {scrollable && (
          <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center gap-3">
            <button type="button" onClick={() => nudge(-1)} aria-label="اللي قبله" className="pointer-events-auto h-11 w-11 rounded-full border border-cream/50 text-cream hover:bg-cream hover:text-cloth-deep">
              →
            </button>
            <button type="button" onClick={() => nudge(1)} aria-label="اللي بعده" className="pointer-events-auto h-11 w-11 rounded-full border border-cream/50 text-cream hover:bg-cream hover:text-cloth-deep">
              ←
            </button>
          </div>
        )}
      </div>

      <div className="relative mt-6 flex flex-col items-center gap-3 px-5 text-center">
        {isSample && <p className="max-w-[46ch] text-xs leading-6 text-cream/60">الأطباق والأسعار والصور تجريبية لحد ما يتعمد منيو سمسم الحقيقي.</p>}
        <button type="button" onClick={() => setWritten(true)} className="rounded-full border border-cream/50 px-5 py-2 text-sm text-cream hover:bg-cream hover:text-cloth-deep">
          المنيو كله مكتوب
        </button>
      </div>

      <Sheet open={written} onClose={() => setWritten(false)} title="المنيو كله">
        <MenuList categories={all} />
      </Sheet>
    </section>
  );
}

/** Copper tray: an arc-shaped band of beaten metal with an engraved inner line. */
function Tray({ geo }: { geo: Geo }) {
  const { W, R, plate, half, bottom } = geo;
  const cx = W / 2;
  const cy = bottom + plate / 2 - R; // plate centres ride on radius R around this point
  const a = half + geo.step * 0.42;
  const band = plate * 0.66;
  const pt = (r: number, th: number) => `${(cx + r * Math.sin(th)).toFixed(1)} ${(cy + r * Math.cos(th)).toFixed(1)}`;
  const ring = (ro: number, ri: number) => `M ${pt(ro, -a)} A ${ro} ${ro} 0 0 0 ${pt(ro, a)} L ${pt(ri, a)} A ${ri} ${ri} 0 0 1 ${pt(ri, -a)} Z`;
  return (
    <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox={`0 0 ${W} ${geo.height}`}>
      <defs>
        <linearGradient id="copper-tray" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e3a160" />
          <stop offset=".45" stopColor="#b5652f" />
          <stop offset="1" stopColor="#6e3415" />
        </linearGradient>
      </defs>
      {/* a soft shadow, faked with offset copies (an SVG blur filter here costs a long first paint) */}
      <path d={ring(R + band + 22, R - band - 4)} fill="#2a0402" opacity=".22" transform="translate(0 20)" />
      <path d={ring(R + band + 14, R - band - 8)} fill="#2a0402" opacity=".3" transform="translate(0 12)" />
      <path d={ring(R + band + 10, R - band - 10)} fill="url(#copper-tray)" />
      <path d={ring(R + band - 4, R - band + 4)} fill="#8a4720" opacity=".55" />
      <path d={ring(R + band - 14, R - band + 14)} fill="none" stroke="#f0c48a" strokeOpacity=".55" strokeWidth="1.4" strokeDasharray="2 6" />
      <path d={ring(R + band + 10, R - band - 10)} fill="none" stroke="#f5d29f" strokeOpacity=".5" strokeWidth="2" />
    </svg>
  );
}

function DishPlate({ item }: { item: MenuItem }) {
  return (
    <div data-turn className="relative aspect-square w-full">
      <div className="absolute inset-0 rounded-full bg-[#efe6d4] shadow-[0_18px_28px_-12px_rgba(40,4,2,.9),inset_0_-5px_12px_rgba(120,90,60,.25)]" />
      <div className="absolute inset-[7%] overflow-hidden rounded-full shadow-[inset_0_2px_10px_rgba(0,0,0,.35)]">
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt={item.nameAr} fill sizes="230px" loading="eager" className={`object-cover ${item.isAvailable ? "" : "grayscale"}`} />
        ) : (
          <div className="khayameya h-full w-full" />
        )}
      </div>
    </div>
  );
}

/** The last stop on the tray. */
function MorePlate({ others, onPick }: { others: CategoryWithItems[]; onPick: (slug: string) => void }) {
  return (
    <div className="relative aspect-square w-full">
      <div className="absolute inset-0 rounded-full border-2 border-dashed border-cream/70 bg-cloth-deep/70" />
      <div className="relative flex h-full flex-col items-center justify-center gap-2 px-[12%]">
        <p className="font-display text-[clamp(1.4rem,2vw,1.9rem)] leading-tight text-cream">عايز حاجة تانية؟</p>
        <div className="flex flex-wrap justify-center gap-1.5">
          {others.map((c) => (
            <button key={c.id} type="button" onClick={() => onPick(c.slug)} className="rounded-full bg-cream px-3 py-1 text-xs font-semibold text-cloth-deep hover:bg-amber hover:text-ink">
              {c.nameAr}
            </button>
          ))}
          <a href="#shay" className="rounded-full border border-cream px-3 py-1 text-xs text-cream hover:bg-cream hover:text-cloth-deep">
            مشروب؟
          </a>
        </div>
      </div>
    </div>
  );
}
