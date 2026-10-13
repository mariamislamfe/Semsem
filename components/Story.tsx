"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import type { MotionValue } from "framer-motion";
import { useRef } from "react";
import { assets } from "@/lib/assets";
import { Reveal } from "./Reveal";

const statement =
  "لمّا الدنيا تهدى بره، النور بيطلع من جوّه الخيمة. الترابيزة بتتملي قبل ما تقعد، والشاي على النار، والضحك والحكاوي في كل مكان. هنا السحور مش وجبة.. ده معاد.";

const moments = [
  { n: "١", t: "لمّة الصحاب", d: "الكل بيجي بحجة الأكل، ويقعد عشان القعدة." },
  { n: "٢", t: "سفرة السحور", d: "أكل بسيط ومعروف، متحط في النص ويتاكل بالإيد." },
  { n: "٣", t: "سهرة لحد الفجر", d: "ولسه الليلة بدري." },
];

function Word({ word, i, total, p }: { word: string; i: number; total: number; p: MotionValue<number> }) {
  const opacity = useTransform(p, [i / total, (i + 1) / total], [0.14, 1]);
  return (
    <motion.span style={{ opacity }} className="inline-block ps-[0.28em]">
      {word}
    </motion.span>
  );
}

export function Story() {
  const ref = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.8", "end 0.55"] });
  const { scrollYProgress: photoP } = useScroll({ target: photoRef, offset: ["start end", "end start"] });
  const photoY = useTransform(photoP, [0, 1], ["-10%", "10%"]);
  const words = statement.split(" ");

  return (
    <section id="hekaya" className="relative scroll-mt-0 overflow-hidden bg-ink px-5 py-28 md:px-10 md:py-40">
      {/* warm light leaking from the previous scene */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-amber/10 to-transparent"
      />
      <div className="relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.25fr_1fr] lg:gap-20">
        <div ref={ref}>
          <p className="font-latin text-sm italic tracking-[0.35em] text-amber">SEMSEM</p>
          <h2 className="mt-4 font-display text-[clamp(4rem,11vw,8rem)] leading-[1] text-cream">سمسم</h2>
          <p className="mt-10 font-poetic text-[clamp(1.5rem,3.2vw,2.5rem)] leading-[1.9] text-cream">
            {words.map((w, i) => (
              <Word key={i} word={w} i={i} total={words.length} p={scrollYProgress} />
            ))}
          </p>
        </div>

        {/* door-shaped frame: the tent doorway */}
        <div ref={photoRef} className="mx-auto w-full max-w-sm">
          <div className="stitch rounded-t-[999px] rounded-b-2xl p-2.5">
            <div className="relative aspect-[3/4.2] overflow-hidden rounded-t-[999px] rounded-b-xl bg-soot">
              <motion.div className="absolute -inset-[10%]" style={{ y: photoY }}>
                <Image
                  src={assets.textile.src}
                  alt={assets.textile.alt}
                  fill
                  sizes="(min-width:1024px) 384px, 90vw"
                  className="object-cover"
                />
              </motion.div>
              <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-sand/70">صورة توضيحية مؤقتة — مش صورة المكان الحقيقي</p>
        </div>
      </div>

      <ul className="relative mx-auto mt-24 grid max-w-7xl gap-px overflow-hidden rounded-2xl bg-cream/10 md:grid-cols-3">
        {moments.map((m) => (
          <Reveal as="li" key={m.n} delay={Number(m.n.charCodeAt(0) - 0x0661) * 0.12} className="bg-soot p-8 md:p-10">
            <span className="font-display text-5xl text-ember">{m.n}</span>
            <h3 className="mt-3 text-xl font-semibold text-cream">{m.t}</h3>
            <p className="mt-2 leading-8 text-sand">{m.d}</p>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
