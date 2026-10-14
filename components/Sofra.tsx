"use client";

import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useRef, useState } from "react";
import type { CategoryWithItems } from "@/lib/types";
import { formatPrice, toArabicDigits } from "@/lib/format";
import { scrollToY } from "@/lib/lenis";
import { AddControl } from "./AddControl";
import { MenuList } from "./MenuList";
import { useMotionPref } from "./MotionPref";
import { Sheet } from "./Sheet";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** A gentle, repeatable scatter so the table looks set by hand, not by a grid. */
const lay = (i: number) => ({
  rot: [-7, 5, -3, 8, -5, 3][i % 6]!,
  lift: [-7, 6, -2, 8, -6, 3][i % 6]!,
});

/**
 * السفرة الممدودة — the long Ramadan table.
 *
 * The section pins and the red khayameya runner travels right-to-left like
 * Arabic reading: every dish is a plate that slides onto the cloth and turns a
 * little as it passes you. A thread along the bottom shows how far down the
 * table you are, and its labels jump to each part of the menu.
 */
export function Sofra({ categories, isSample, all }: { categories: CategoryWithItems[]; isSample: boolean; all: CategoryWithItems[] }) {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const thread = useRef<HTMLDivElement>(null);
  const travel = useRef<gsap.core.Tween | null>(null);
  const { reduced } = useMotionPref();
  const [written, setWritten] = useState(false);

  useGSAP(
    () => {
      const el = root.current;
      const tr = track.current;
      if (!el || !tr || reduced) return;
      const dist = () => Math.max(0, tr.scrollWidth - window.innerWidth);

      const tween = gsap.to(tr, {
        x: () => dist(),
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: () => `+=${dist()}`,
          pin: true,
          scrub: 0.7,
          invalidateOnRefresh: true,
          onUpdate: (self) => gsap.set(thread.current, { scaleX: self.progress }),
        },
      });
      travel.current = tween;

      // each plate is pushed onto the cloth as it arrives, then turns slowly as it passes
      gsap.utils.toArray<HTMLElement>("[data-plate]", el).forEach((plate, i) => {
        const { rot } = lay(i);
        gsap.fromTo(
          plate,
          { rotate: rot - 28, scale: 0.86, xPercent: -18 },
          {
            rotate: rot,
            scale: 1,
            xPercent: 0,
            ease: "power2.out",
            scrollTrigger: { containerAnimation: tween, trigger: plate, start: "right left", end: "center 45%", scrub: true },
          },
        );
        gsap.to(plate.querySelector("[data-food]"), {
          rotate: 24,
          ease: "none",
          scrollTrigger: { containerAnimation: tween, trigger: plate, start: "right left", end: "left right", scrub: true },
        });
      });

      // big category names drift slower than the plates: depth on a flat cloth
      gsap.utils.toArray<HTMLElement>("[data-cat]", el).forEach((cat) => {
        gsap.fromTo(
          cat,
          { xPercent: -30 },
          { xPercent: 30, ease: "none", scrollTrigger: { containerAnimation: tween, trigger: cat, start: "right left", end: "left right", scrub: true } },
        );
      });
    },
    { scope: root, dependencies: [reduced, categories], revertOnUpdate: true },
  );

  /** Bring a part of the table in front of you (thread labels, keyboard focus). */
  const bringToView = (node: HTMLElement | null) => {
    const tw = travel.current;
    const tr = track.current;
    const st = tw?.scrollTrigger;
    if (!node || !tr || !st) return;
    const fromRight = tr.offsetWidth - (node.offsetLeft + node.offsetWidth);
    const dist = Math.max(1, tr.scrollWidth - window.innerWidth);
    const p = gsap.utils.clamp(0, 1, (fromRight - window.innerWidth * 0.15) / dist);
    scrollToY(st.start + p * (st.end - st.start));
  };

  if (reduced) {
    return (
      <section id="sofra" className="bg-cloth px-5 py-24">
        <h2 className="text-center font-display text-[clamp(3rem,9vw,6rem)] text-cream">السفرة</h2>
        <MenuList categories={all} />
      </section>
    );
  }

  let n = 0;
  return (
    <section
      ref={root}
      id="sofra"
      aria-label="السفرة — المنيو"
      className="relative h-svh overflow-hidden bg-cloth"
      onFocus={(e) => {
        const card = (e.target as HTMLElement).closest<HTMLElement>("[data-card]");
        if (card) bringToView(card);
      }}
    >
      {/* the cloth itself */}
      <div aria-hidden className="khayameya absolute inset-0 opacity-[0.16] mix-blend-multiply" style={{ backgroundSize: "150px 150px" }} />
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,transparent_35%,rgba(60,8,4,.55)_100%)]" />
      {/* runner seams */}
      <div aria-hidden className="absolute inset-x-0 top-[9svh] border-t-2 border-dashed border-amber/50" />
      <div aria-hidden className="absolute inset-x-0 bottom-[11svh] border-t-2 border-dashed border-amber/50" />

      <div ref={track} className="relative flex h-full w-max items-center will-change-transform">
        {/* the head of the table */}
        <div className="flex h-full w-[min(92vw,44rem)] shrink-0 flex-col justify-center pe-[6vw] ps-[7vw]">
          <h2 className="font-display text-[clamp(4rem,11vw,9.5rem)] leading-[0.95] text-cream">السفرة ممدودة</h2>
          <p className="mt-6 max-w-[30ch] text-lg leading-8 text-cream/90">
            انزل بالسكرول والسفرة هتتمد قدامك. اللي يعجبك دوس عليه «ضيف»، وهتلاقي طلبك تحت.
          </p>
          {isSample && (
            <p className="mt-5 max-w-[34ch] text-sm leading-7 text-cream/70">
              الأطباق والأسعار والصور تجريبية لحد ما يتعمد منيو سمسم الحقيقي.
            </p>
          )}
          <button
            type="button"
            onClick={() => setWritten(true)}
            className="mt-7 w-fit rounded-full border border-cream/60 px-5 py-2 text-sm text-cream transition-colors hover:bg-cream hover:text-cloth-deep"
          >
            المنيو كله مكتوب
          </button>
        </div>

        {categories.map((c) => (
          <div key={c.id} id={`sofra-${c.slug}`} className="flex h-full shrink-0 items-center">
            <div className="relative flex h-full w-[min(70vw,24rem)] shrink-0 items-center justify-center">
              <h3
                data-cat
                className="font-display text-[clamp(4.5rem,12vw,11rem)] leading-none text-cloth-deep/90"
                style={{ textShadow: "0 1px 0 rgba(243,227,195,.25)" }}
              >
                {c.nameAr}
              </h3>
            </div>
            {c.items.map((it) => {
              const i = n++;
              const { lift } = lay(i);
              return (
                <article
                  key={it.id}
                  data-card
                  className="flex w-[min(78vw,26rem)] shrink-0 flex-col items-center px-[2vw] text-center"
                  style={{ transform: `translateY(${lift}svh)` }}
                >
                  <div data-plate className="relative aspect-square w-[min(62vw,19rem)] will-change-transform">
                    <div className="absolute inset-0 rounded-full bg-[#efe6d4] shadow-[0_28px_40px_-18px_rgba(40,4,2,.85),inset_0_-6px_14px_rgba(120,90,60,.25)]" />
                    <div className="absolute inset-[7%] overflow-hidden rounded-full shadow-[inset_0_2px_10px_rgba(0,0,0,.35)]">
                      <div data-food className="absolute -inset-[6%]">
                        {it.imageUrl ? (
                          <Image
                            src={it.imageUrl}
                            alt={it.nameAr}
                            fill
                            sizes="(max-width: 640px) 62vw, 19rem"
                            loading="eager"
                            className={`object-cover ${it.isAvailable ? "" : "grayscale"}`}
                          />
                        ) : (
                          <div className="khayameya h-full w-full" />
                        )}
                      </div>
                    </div>
                  </div>
                  <h4 className="mt-6 text-2xl font-semibold text-cream">{it.nameAr}</h4>
                  {it.descriptionAr && <p className="mt-2 max-w-[26ch] text-[0.95rem] leading-7 text-cream/80">{it.descriptionAr}</p>}
                  <div className="mt-4 flex items-center gap-4">
                    <span className={`font-display text-3xl ${it.isAvailable ? "text-amber" : "text-cream/50 line-through"}`}>
                      {formatPrice(it.price)}
                    </span>
                    <AddControl item={it} />
                  </div>
                </article>
              );
            })}
          </div>
        ))}

        {/* the end of the table */}
        <div className="flex h-full w-[min(86vw,34rem)] shrink-0 flex-col justify-center pe-[6vw] ps-[8vw]">
          <p className="font-display text-[clamp(3rem,7vw,5.5rem)] leading-[1.05] text-cream">والشاي على النار</p>
          <a href="#shay" className="mt-6 w-fit rounded-full bg-cream px-6 py-2.5 font-semibold text-cloth-deep transition-colors hover:bg-amber hover:text-ink">
            كمّل لركن الشاي
          </a>
        </div>
      </div>

      {/* the thread: how far down the table you are, and a way to jump */}
      <nav aria-label="أقسام السفرة" className="absolute inset-x-[6vw] bottom-[4svh] z-10">
        <div className="relative h-px bg-cream/25">
          <div ref={thread} className="absolute inset-0 origin-right scale-x-0 bg-amber" />
        </div>
        <ul className="mt-3 flex justify-between gap-2 text-xs text-cream/85 sm:text-sm">
          {categories.map((c) => (
            <li key={c.id}>
              <button type="button" className="hover:text-amber" onClick={() => bringToView(document.getElementById(`sofra-${c.slug}`))}>
                {c.nameAr} <span className="hidden text-cream/50 sm:inline">{toArabicDigits(c.items.length)}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <Sheet open={written} onClose={() => setWritten(false)} title="المنيو كله">
        <MenuList categories={all} />
      </Sheet>
    </section>
  );
}
