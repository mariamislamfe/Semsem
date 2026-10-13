import Image from "next/image";
import { assets, type Asset } from "@/lib/assets";
import { Reveal } from "./Reveal";

const tiles: Array<{ asset: Asset; word: string; line: string }> = [
  { asset: assets.lantern, word: "نور", line: "ضو دافي من بعيد" },
  { asset: assets.tableHands, word: "لمّة", line: "إيد على نفس الطبق" },
  { asset: assets.pan, word: "نار", line: "الحلّة بتغلي من بدري" },
  { asset: assets.mezzeHands, word: "لقمة", line: "وكلمة جنبها" },
];

/** The vibe of the place in one short row — deliberately brief. */
export function Vibe() {
  return (
    <section id="sahra" className="bg-ink px-5 py-16 md:px-10 md:py-20">
      <div className="mx-auto max-w-6xl">
        <Reveal as="header" className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-[clamp(2.6rem,6vw,4.5rem)] leading-none text-cream">السهرة</h2>
          <p className="max-w-sm text-sand">بتدخل عشان تاكل، وبتفضل عشان مش عايز الليلة تخلص.</p>
        </Reveal>

        <ul className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
          {tiles.map((t, i) => (
            <Reveal as="li" key={t.word} delay={i * 0.08} y={24}>
              <figure>
                <div className="relative aspect-[3/4] overflow-hidden rounded-t-[999px] rounded-b-xl bg-soot">
                  <Image
                    src={t.asset.src}
                    alt={t.asset.alt}
                    fill
                    sizes="(min-width:768px) 22vw, 46vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
                </div>
                <figcaption className="mt-3 text-center">
                  <span className="font-display text-3xl text-amber">{t.word}</span>
                  <span className="block text-sm text-sand">{t.line}</span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </ul>
        <p className="mt-6 text-xs text-sand/60">صور توضيحية مؤقتة — مش صور المكان الحقيقي.</p>
      </div>
    </section>
  );
}
