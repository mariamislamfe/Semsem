"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import type { MotionValue } from "framer-motion";
import { useRef } from "react";
import { Reveal } from "./Reveal";

const statement =
  "لمّا الدنيا تهدى بره، النور بيطلع من جوّه الخيمة. الترابيزة بتتملي قبل ما تقعد، والشاي على النار، والضحك والحكاوي في كل مكان. هنا السحور مش وجبة.. ده معاد.";

const moments = [
  { t: "لمّة الصحاب", d: "الكل بيجي بحجة الأكل، ويقعد عشان القعدة." },
  { t: "سفرة السحور", d: "أكل بسيط ومعروف، متحط في النص ويتاكل بالإيد." },
  { t: "سهرة لحد الفجر", d: "ولسه الليلة بدري." },
];

function Word({ word, i, total, p }: { word: string; i: number; total: number; p: MotionValue<number> }) {
  const opacity = useTransform(p, [i / total, (i + 1) / total], [0.12, 1]);
  return (
    <motion.span style={{ opacity }} className="inline-block ps-[0.28em]">
      {word}
    </motion.span>
  );
}

/**
 * A quiet room after the table and the tea: no image, no card — only the
 * sentence, lit word by word as you read it.
 */
export function Story() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.5"] });
  const words = statement.split(" ");

  return (
    <section id="hekaya" className="relative bg-ink px-6 py-32 md:px-10 md:py-48">
      <div ref={ref} className="mx-auto max-w-4xl text-center">
        <p className="font-latin text-sm italic tracking-[0.35em] text-amber">SEMSEM</p>
        <h2 className="mt-4 font-display text-[clamp(4.5rem,13vw,9rem)] leading-[1] text-cream">سمسم</h2>
        <p className="mt-20 font-poetic text-[clamp(1.6rem,3.6vw,2.8rem)] leading-[1.95] text-cream">
          {words.map((w, i) => (
            <Word key={i} word={w} i={i} total={words.length} p={scrollYProgress} />
          ))}
        </p>
      </div>

      <ul className="mx-auto mt-24 grid max-w-5xl gap-10 md:grid-cols-3">
        {moments.map((m, i) => (
          <Reveal as="li" key={m.t} delay={i * 0.12} className="border-t border-cream/15 pt-5 text-center">
            <h3 className="font-display text-3xl text-amber">{m.t}</h3>
            <p className="mt-2 leading-8 text-sand">{m.d}</p>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
