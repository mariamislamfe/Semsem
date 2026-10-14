"use client";

import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { assets } from "@/lib/assets";
import { createFanousRenderer, type FanousRenderer } from "@/lib/fanousGL";
import { useMotionPref } from "./MotionPref";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

const PHOTO = assets.heroFanous.src;
/** Where the lantern's glass sits in the photo (0–1, from top-left). */
const LAMP: [number, number] = [0.7, 0.66];

/**
 * The opening: the black tent, one fanous, and your own light.
 * One orchestrated moment on load (the lantern is lit, then the name appears);
 * after that, everything answers the visitor — pointer, finger, scroll.
 */
export function FanousHero() {
  const root = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const gl = useRef<FanousRenderer | null>(null);
  const { reduced } = useMotionPref();

  useGSAP(
    () => {
      const el = root.current;
      const cv = canvas.current;
      if (!el || !cv) return;
      const intro = { v: reduced ? 1 : 0 };
      let alive = true;

      // the shader loads in the background; the photo underneath is already on screen
      createFanousRenderer(cv, {
        image: PHOTO,
        lamp: LAMP,
        onSlow: () => {
          gsap.to(cv, { autoAlpha: 0, duration: 0.6 });
          gl.current?.destroy();
          gl.current = null;
        },
      }).then((r) => {
        if (!alive || !r) return;
        gl.current = r;
        r.setCalm(reduced);
        r.setIntro(intro.v);
        gsap.to(cv, { autoAlpha: 1, duration: 0.6 });
      });

      // 1 — the lantern is lit
      gsap.to(intro, {
        v: 1,
        duration: 2.6,
        ease: "power2.inOut",
        delay: 0.2,
        onUpdate: () => gl.current?.setIntro(intro.v),
      });

      // 2 — then the name, line by line out of a mask (words only: Arabic letters must stay joined)
      const lines = SplitText.create(el.querySelectorAll("[data-split]"), { type: "lines", mask: "lines" });
      gsap.from(el.querySelector("[data-mark]"), { yPercent: 105, duration: 1.4, ease: "expo.out", delay: reduced ? 0 : 1.2 });
      gsap.from(lines.lines, { yPercent: 110, duration: 1.1, ease: "expo.out", stagger: 0.12, delay: reduced ? 0 : 1.5 });
      gsap.from(el.querySelectorAll("[data-late]"), { autoAlpha: 0, duration: 0.8, delay: reduced ? 0 : 2.3, stagger: 0.1 });

      // 3 — scroll walks you into the lantern; the type steps aside first
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: "+=140%",
          pin: true,
          scrub: 0.6,
          onUpdate: (self) => gl.current?.setProgress(self.progress),
          onToggle: (self) => gl.current?.setActive(self.isActive || self.progress < 1),
        },
      });
      tl.to(el.querySelectorAll("[data-copy]"), { yPercent: -18, autoAlpha: 0, ease: "none", duration: 0.35 }, 0)
        .to(el.querySelector("[data-hint]"), { autoAlpha: 0, duration: 0.1 }, 0)
        .to(el.querySelector("[data-poster]"), { scale: 3.2, transformOrigin: "70% 66%", ease: "power1.in", duration: 1 }, 0);

      const onMove = (e: PointerEvent) => gl.current?.setPointer(e.clientX, e.clientY);
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerdown", onMove, { passive: true });

      return () => {
        alive = false;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerdown", onMove);
        gl.current?.destroy();
        gl.current = null;
      };
    },
    { scope: root, dependencies: [reduced], revertOnUpdate: true },
  );

  return (
    <section ref={root} aria-label="سمسم" className="relative h-svh w-full overflow-hidden bg-ink">
      {/* the photograph itself: first paint, no-WebGL fallback, and what the shader renders from */}
      <div data-poster className="absolute inset-0">
        <Image
          src={PHOTO}
          alt={assets.heroFanous.alt}
          fill
          priority
          sizes="100vw"
          className="object-cover object-[70%_50%] lg:object-contain lg:object-right"
        />
      </div>
      <canvas ref={canvas} aria-hidden className="invisible absolute inset-0 h-full w-full opacity-0" />
      {/* narrow screens: the type sits above the lantern, on a night that darkens toward the top */}
      <div aria-hidden data-copy className="pointer-events-none absolute inset-x-0 top-0 z-[5] h-[68%] bg-gradient-to-b from-black via-black/85 to-transparent lg:hidden" />

      <div
        data-copy
        className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center px-6 pt-28 text-center lg:right-auto lg:w-[54%] lg:items-start lg:justify-end lg:pb-[12svh] lg:pe-[7vw] lg:ps-[3vw] lg:pt-0 lg:text-start"
      >
        <div className="overflow-hidden pb-4 pt-[0.35em]">
          <h1
            data-mark
            className="font-display text-[clamp(6.5rem,21vw,19rem)] leading-[1.05] text-cream"
            style={{ textShadow: "0 0 70px rgba(228,167,46,.25)" }}
          >
            سمسم
          </h1>
        </div>
        <p data-split className="mt-2 max-w-[18ch] text-[clamp(1.4rem,2.6vw,2.3rem)] font-light leading-snug text-cream">
          الليلة لسه مبدأتش.
        </p>
        <p data-split className="mt-3 max-w-[34ch] text-base leading-8 text-sand md:text-lg">
          خيمة سحور، فيها فول وطعمية وشاي على النار، ولمّة لحد الفجر.
        </p>
        <div data-late className="pointer-events-auto mt-9 flex flex-wrap justify-center gap-3 lg:justify-start">
          <a href="#ihgez" className="rounded-full bg-amber px-7 py-3 font-semibold text-ink transition-colors hover:bg-cream">
            احجز مكانك
          </a>
          <a href="#sofra" className="rounded-full border border-cream/40 px-7 py-3 text-cream transition-colors hover:border-amber hover:text-amber">
            شوف المنيو
          </a>
        </div>
      </div>

      <p data-hint data-late className="pointer-events-none absolute inset-x-0 bottom-6 z-10 text-center text-sm text-sand/80">
        حرّك نورك على الحيطة.. وانزل لجوّه
      </p>
    </section>
  );
}
