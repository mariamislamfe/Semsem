"use client";

import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { wallPhotos, type WallPhoto } from "@/lib/assets";
import { lockScroll, unlockScroll } from "@/lib/lenis";
import { useMotionPref } from "./MotionPref";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * حيطة اللمة — the wall every Egyptian café and home has: photos of the people
 * who sat there, clipped with wooden pegs to strings of little lights.
 *
 * The section pins and the wall travels past right-to-left as you scroll. The
 * photos hang from sagging strings and swing with how fast you move; tap one
 * and it comes off the wall. The last frame on the wall is empty — waiting for
 * the real photos of Semsem's nights.
 */

interface Layout {
  W: number;
  H: number;
  bay: number; // width of one span of string
  card: number; // polaroid width
  intro: number; // width of the opening panel
  outro: number;
  rows: [number, number]; // y of the two strings at their pegs
  sag: number;
}

function layoutFor(W: number, H: number): Layout {
  const mobile = W < 720;
  const card = Math.round(Math.min(mobile ? W * 0.42 : 230, H * (mobile ? 0.25 : 0.27)));
  return {
    W,
    H,
    card,
    bay: Math.round(card * (mobile ? 1.75 : 2.3)),
    intro: Math.round(Math.min(W * (mobile ? 0.86 : 0.42), 560)),
    outro: Math.round(Math.min(W * (mobile ? 0.8 : 0.36), 460)),
    rows: [Math.round(H * 0.15), Math.round(H * (mobile ? 0.53 : 0.55))],
    sag: Math.round(H * 0.06),
  };
}

/** y of a string at fraction u (0..1) across one bay */
const ropeY = (y0: number, sag: number, u: number) => y0 + 4 * sag * u * (1 - u);
/** its slope, for tilting what hangs from it */
const ropeSlope = (sag: number, bay: number, u: number) => (4 * sag * (1 - 2 * u)) / bay;

export function Story() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const cards = useRef<Array<HTMLButtonElement | null>>([]);
  const [lay, setLay] = useState<Layout | null>(null);
  const [open, setOpen] = useState<WallPhoto | null>(null);
  const { reduced } = useMotionPref();

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const W = el.clientWidth;
      const H = el.clientHeight;
      setLay((l) => (l && l.W === W && l.H === H ? l : layoutFor(W, H)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    lockScroll();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      unlockScroll();
    };
  }, [open]);

  useGSAP(
    () => {
      const el = root.current;
      const tr = track.current;
      if (!el || !tr || !lay) return;
      const dist = () => Math.max(0, tr.scrollWidth - window.innerWidth);
      const wind = { v: 0, target: 0 };

      gsap.to(tr, {
        x: () => dist(),
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: () => `+=${dist()}`,
          pin: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            // the faster the wall moves, the harder the photos swing
            wind.target = gsap.utils.clamp(-14, 14, -self.getVelocity() / 180);
          },
        },
      });

      // the opening words light up as you arrive
      const words = el.querySelectorAll<HTMLElement>("[data-word]");
      gsap.fromTo(words, { opacity: 0.15 }, { opacity: 1, stagger: 0.08, ease: "none", scrollTrigger: { trigger: el, start: "top 70%", end: "top top", scrub: true } });

      let visible = true;
      const io = new IntersectionObserver(([e]) => (visible = !!e?.isIntersecting));
      io.observe(el);
      const t0 = performance.now();
      const tick = () => {
        if (!visible) return;
        const t = (performance.now() - t0) / 1000;
        wind.target *= 0.9;
        wind.v += (wind.target - wind.v) * 0.08;
        cards.current.forEach((c, i) => {
          if (!c) return;
          const base = Number(c.dataset.tilt);
          const idle = reduced ? 0 : Math.sin(t * 0.8 + i * 1.7) * 1.2;
          const swing = wind.v * (0.7 + ((i * 37) % 10) / 20) * Math.cos(t * 3 + i);
          c.style.transform = `rotate(${(base + idle + swing).toFixed(2)}deg)`;
        });
      };
      gsap.ticker.add(tick);
      return () => {
        gsap.ticker.remove(tick);
        io.disconnect();
      };
    },
    { scope: root, dependencies: [lay, reduced], revertOnUpdate: true },
  );

  const bays = Math.ceil(wallPhotos.length / 2);
  const statement = "لمّا الدنيا تهدى بره، النور بيطلع من جوّه الخيمة. الترابيزة بتتملي، والشاي على النار، والضحك والحكاوي في كل مكان.";

  return (
    <section
      ref={root}
      id="hekaya"
      aria-label="حيطة اللمة"
      className="relative h-svh overflow-hidden"
      style={{
        // a warm plaster wall at night, lit by the strings of lights
        background: "radial-gradient(ellipse 120% 70% at 50% 0%, rgba(242,169,59,.10), transparent 60%), linear-gradient(#1a110b, #120b07)",
      }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.05]" style={{ backgroundImage: "url(/patterns/curtain-dark.svg)", backgroundSize: "220px 220px" }} />

      <div ref={track} className="relative flex h-full w-max will-change-transform">
        {/* the opening panel */}
        <div className="flex h-full shrink-0 flex-col justify-center pe-[4vw] ps-[7vw]" style={{ width: lay?.intro ?? 520 }}>
          <h2 className="font-display text-[clamp(3.2rem,8vw,6.5rem)] leading-[1.05] text-cream">حيطة اللمة</h2>
          <p className="mt-6 text-[clamp(1.15rem,2vw,1.6rem)] font-light leading-[1.9] text-cream">
            {statement.split(" ").map((w, i) => (
              <span key={i} data-word className="inline-block pe-[0.28em]">
                {w}
              </span>
            ))}
          </p>
          <p className="mt-6 text-sm text-sand/80">كمّل سكرول.. والحيطة هتعدّي قدامك</p>
        </div>

        {/* the wall */}
        {lay && (
          <div className="relative h-full shrink-0" style={{ width: bays * lay.bay }}>
            <Strings lay={lay} bays={bays} />
            {wallPhotos.map((p, i) => {
              const bay = Math.floor(i / 2);
              const row = (i % 2) as 0 | 1;
              const u = row === 0 ? 0.36 : 0.66;
              const x = bay * lay.bay + u * lay.bay; // measured from the right edge (RTL)
              const y = ropeY(lay.rows[row], lay.sag, u);
              const tilt = (Math.atan(ropeSlope(lay.sag, lay.bay, u)) * 180) / Math.PI + ((i * 53) % 9) - 4;
              return (
                <button
                  key={p.src}
                  type="button"
                  ref={(el) => {
                    cards.current[i] = el;
                  }}
                  data-tilt={tilt.toFixed(2)}
                  onClick={() => setOpen(p)}
                  aria-label={`افتح الصورة: ${p.caption}`}
                  className="group absolute origin-top text-start will-change-transform"
                  style={{ right: x - lay.card / 2, top: y - 6, width: lay.card }}
                >
                  {/* wooden peg */}
                  <span aria-hidden className="absolute -top-3 left-1/2 z-10 h-7 w-3 -translate-x-1/2 rounded-sm bg-gradient-to-b from-[#c8a173] to-[#8a6236] shadow-[0_2px_3px_rgba(0,0,0,.5)]" />
                  <span className="block bg-[#f4ecdc] p-[6%] pb-[4%] shadow-[0_18px_30px_-10px_rgba(0,0,0,.8)] transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-[1.04]">
                    <span className="relative block aspect-[4/5] overflow-hidden bg-[#2a1d14]">
                      <Image src={p.src} alt={p.alt} fill loading="eager" sizes={`${lay.card}px`} className="object-cover sepia-[.15]" />
                    </span>
                    <span className="mt-[5%] block text-center font-display text-[clamp(1rem,1.6vw,1.35rem)] leading-tight text-[#3a2616]">{p.caption}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* the end of the wall: an empty frame */}
        <div className="flex h-full shrink-0 flex-col items-center justify-center px-[6vw] text-center" style={{ width: lay?.outro ?? 420 }}>
          <div className="w-[min(60vw,220px)] -rotate-2 border-2 border-dashed border-cream/40 p-[6%]">
            <div className="flex aspect-[4/5] items-center justify-center bg-cream/5">
              <span className="font-display text-5xl text-cream/40">+</span>
            </div>
          </div>
          <p className="mt-6 font-display text-[clamp(1.8rem,3vw,2.6rem)] leading-tight text-cream">المكان ده لصورتكم</p>
          <p className="mt-2 max-w-[28ch] text-sand">تعالوا اعملوا لمّتكم في سمسم، والحيطة دي تتملي بيكم.</p>
          <a href="#ihgez" className="mt-6 rounded-full bg-amber px-7 py-3 font-semibold text-ink transition-colors hover:bg-cream">
            احجز مكانك
          </a>
        </div>
      </div>

      <p className="pointer-events-none absolute bottom-4 start-6 text-xs text-sand/50">صور توضيحية من مصادر مفتوحة، مش من سمسم.</p>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(null)}
            role="dialog"
            aria-modal="true"
            aria-label={open.caption}
          >
            <motion.figure
              className="relative w-[min(88vw,460px)] bg-[#f4ecdc] p-4 pb-3 shadow-2xl"
              initial={{ scale: 0.6, rotate: -8, y: 60 }}
              animate={{ scale: 1, rotate: -1.5, y: 0 }}
              exit={{ scale: 0.7, rotate: 6, y: 40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 22 }}
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                <Image src={open.src} alt={open.alt} fill sizes="460px" className="object-cover" />
              </div>
              <figcaption className="mt-3 text-center font-display text-3xl text-[#3a2616]">{open.caption}</figcaption>
            </motion.figure>
            <button type="button" onClick={() => setOpen(null)} aria-label="رجّع الصورة للحيطة" className="absolute end-6 top-6 h-11 w-11 rounded-full border border-cream/40 text-cream">
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/** Two sagging strings across the wall, each strung with small warm bulbs. */
function Strings({ lay, bays }: { lay: Layout; bays: number }) {
  const width = bays * lay.bay;
  // drawn right-to-left to match where the photos hang
  const paths = lay.rows.map((y0) => {
    let d = `M ${width} ${y0}`;
    for (let b = 0; b < bays; b++) {
      const xr = width - b * lay.bay;
      d += ` Q ${xr - lay.bay / 2} ${y0 + 2 * lay.sag} ${xr - lay.bay} ${y0}`;
    }
    return d;
  });
  const bulbs: Array<{ x: number; y: number; k: number }> = [];
  const per = Math.max(5, Math.round(lay.bay / 55));
  lay.rows.forEach((y0, r) => {
    for (let b = 0; b < bays; b++) {
      for (let j = 1; j < per; j++) {
        const u = j / per;
        bulbs.push({ x: b * lay.bay + u * lay.bay, y: ropeY(y0, lay.sag, u) + 3, k: (b * per + j + r * 3) % 7 });
      }
    }
  });
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <svg className="absolute right-0 top-0 h-full" width={width} viewBox={`0 0 ${width} ${lay.H}`} preserveAspectRatio="none">
        {paths.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="#5a4330" strokeWidth="1.6" />
        ))}
      </svg>
      {bulbs.map((b, i) => (
        <span
          key={i}
          className={b.k === 0 ? "twinkle" : undefined}
          style={{
            position: "absolute",
            right: b.x - 4,
            top: b.y - 4,
            width: 8,
            height: 10,
            borderRadius: "50% 50% 45% 45%",
            background: "radial-gradient(circle at 50% 40%, #fff3d0, #f2a93b 60%, #a85f18)",
            boxShadow: "0 0 10px 3px rgba(242,169,59,.45)",
            animationDelay: `${(i % 11) * 0.37}s`,
          }}
        />
      ))}
    </div>
  );
}
