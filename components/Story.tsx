"use client";

import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { assets } from "@/lib/assets";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

const statement =
  "لمّا الدنيا تهدى بره، النور بيطلع من جوّه الخيمة. الترابيزة بتتملي قبل ما تقعد، والشاي على النار، والضحك والحكاوي في كل مكان. هنا السحور مش وجبة.. ده معاد.";

const moments = [
  { t: "لمّة الصحاب", d: "الكل بيجي بحجة الأكل، ويقعد عشان القعدة." },
  { t: "سفرة السحور", d: "أكل بسيط ومعروف، متحط في النص ويتاكل بالإيد." },
  { t: "سهرة لحد الفجر", d: "ولسه الليلة بدري." },
];

/**
 * القعدة — the place, after the food. Two photographs of the Ramadan night,
 * and one sentence that lights up word by word at reading pace.
 */
export function Story() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      // words only — splitting Arabic into letters would break their joins
      const split = SplitText.create(el.querySelector("[data-read]"), { type: "words" });
      gsap.fromTo(
        split.words,
        { opacity: 0.12 },
        {
          opacity: 1,
          ease: "none",
          stagger: 0.1,
          scrollTrigger: { trigger: el.querySelector("[data-read]"), start: "top 80%", end: "bottom 45%", scrub: true },
        },
      );
      gsap.utils.toArray<HTMLElement>("[data-drift]", el).forEach((img, i) => {
        gsap.fromTo(
          img,
          { yPercent: i ? 10 : -6 },
          { yPercent: i ? -10 : 6, ease: "none", scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true } },
        );
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="hekaya" className="relative bg-ink px-5 py-28 md:px-[6vw] md:py-40">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-6 lg:col-start-1 lg:pt-16">
          <h2 data-anim="heading" className="font-display text-[clamp(3.6rem,9vw,7.5rem)] leading-none text-cream">القعدة</h2>
          <p data-read className="mt-10 text-[clamp(1.45rem,2.6vw,2.2rem)] font-light leading-[1.9] text-cream">
            {statement}
          </p>
        </div>

        <figure className="relative aspect-[3/4.3] overflow-hidden rounded-[2px] lg:col-span-5 lg:col-start-8">
          <div data-drift className="absolute -inset-y-[10%] inset-x-0">
            <Image src={assets.khan.src} alt={assets.khan.alt} fill sizes="(min-width:1024px) 40vw, 92vw" className="object-cover" />
          </div>
        </figure>

      </div>

      <ul data-anim="stagger" className="mx-auto mt-24 grid max-w-6xl gap-10 md:grid-cols-3">
        {moments.map((m) => (
          <li key={m.t} className="border-t border-cream/20 pt-5">
            <h3 className="font-display text-3xl text-amber">{m.t}</h3>
            <p className="mt-2 leading-8 text-sand">{m.d}</p>
          </li>
        ))}
      </ul>
      <p className="mx-auto mt-14 max-w-6xl text-xs text-sand/60">الصور توضيحية من مصادر مفتوحة، ومش من خيمة سمسم.</p>
    </section>
  );
}
