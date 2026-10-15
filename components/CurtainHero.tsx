"use client";

import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useLayoutEffect, useRef, useState } from "react";
import { assets } from "@/lib/assets";
import { useMotionPref } from "./MotionPref";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * The tent door. Two khayameya curtains, each cut into vertical strips that fold
 * like real pleats (an accordion in 3D: every strip turns on its edge and the
 * next one turns back the other way). The artwork — pattern, hem, and the name
 * سمسم across the seam — is printed on the cloth, so it folds and splits with it.
 *
 * Closed, the cloth breathes; drag your pointer / finger across it and a ripple
 * runs through the pleats. Scroll and the curtains gather to the sides like
 * fabric, letting the light of the lantern inside spill out.
 *
 * Cost: ~2×(7–11) layers with a 3D transform, written once per frame while the
 * hero is on screen. No canvas, no blend modes, no filters.
 */

const REST = 0.26; // pleat angle when closed (radians)
const OPEN = 1.44; // pleat angle when fully gathered

interface Size {
  W: number;
  H: number;
  N: number; // strips per panel
  w: number; // unfolded strip width
  A: number; // artwork width (both panels, unfolded)
}

function measure(W: number, H: number): Size {
  const N = W < 720 ? 7 : 9;
  const w = W / 2 / (N * Math.cos(REST)) + 1;
  return { W, H, N, w, A: 2 * N * w };
}

export function CurtainHero() {
  const root = useRef<HTMLElement>(null);
  const door = useRef<HTMLDivElement>(null);
  const strips = useRef<Array<HTMLDivElement | null>>([]);
  const shades = useRef<Array<HTMLDivElement | null>>([]);
  const [size, setSize] = useState<Size | null>(null);
  const { reduced } = useMotionPref();

  useLayoutEffect(() => {
    const el = door.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const W = el.clientWidth;
      const H = el.clientHeight;
      setSize((s) => (s && s.W === W && s.H === H ? s : measure(W, H)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useGSAP(
    () => {
      const el = root.current;
      if (!el || !size) return;
      const { W, N, w } = size;
      const state = {
        open: 0,
        drop: reduced ? 0 : 1, // the curtain has just been let down: it swings, then settles
        ripple: 0,
        px: W / 2,
        visible: true,
      };

      // the curtain is let down from the rod, then swings and settles
      if (!reduced) gsap.from(door.current, { yPercent: -100, duration: 1.3, ease: "power3.out" });
      gsap.to(state, { drop: 0, duration: 3.2, ease: "power2.out", delay: 0.4 });
      gsap.fromTo(el, { "--ink": 0 }, { "--ink": 1, duration: 1.6, ease: "power2.out", delay: 0.5 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: "+=130%",
          pin: true,
          scrub: 0.8,
          onUpdate: (self) => {
            if (!reduced) state.ripple = Math.min(0.5, state.ripple + Math.abs(self.getVelocity()) * 0.00003);
          },
        },
      });
      tl.to(state, { open: 1, ease: "power1.inOut", duration: 1 }, 0)
        .fromTo(el.querySelector("[data-glow]"), { opacity: 0.25, scale: 0.6 }, { opacity: 1, scale: 1.25, ease: "none", duration: 1 }, 0)
        .fromTo(el.querySelector("[data-room]"), { scale: 1.15 }, { scale: 1, ease: "none", duration: 1 }, 0)
        .fromTo(el.querySelector("[data-welcome]"), { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, ease: "power2.out", duration: 0.35 }, 0.6)
        .to(el.querySelector("[data-hint]"), { autoAlpha: 0, duration: 0.1 }, 0);

      const onMove = (e: PointerEvent) => {
        if (reduced) return;
        const x = e.clientX;
        const v = Math.abs(x - state.px);
        state.px = x;
        state.ripple = Math.min(0.55, state.ripple + v * 0.0016);
      };
      el.addEventListener("pointermove", onMove, { passive: true });

      // off screen, the curtain stops updating and leaves the compositor entirely
      const io = new IntersectionObserver(([e]) => {
        state.visible = !!e?.isIntersecting;
        if (door.current) door.current.style.visibility = state.visible ? "" : "hidden";
      });
      io.observe(el);

      const t0 = performance.now();
      const tick = () => {
        if (!state.visible) return;
        const t = (performance.now() - t0) / 1000;
        state.ripple *= 0.965;
        const base = REST + (OPEN - REST) * state.open;
        const calm = 1 - state.open * 0.7;
        const fold = (sx: number, k: number) => {
          let phi = base;
          if (!reduced) {
            phi += 0.045 * Math.sin(t * 1.1 + k * 0.9) * calm; // breathing
            phi += state.drop * 0.32 * Math.sin(t * 5 - k * 0.7) * Math.exp(-t * 0.6); // just let down
            const d = (sx - state.px) / (W * 0.14);
            phi += state.ripple * Math.exp(-d * d) * Math.sin(t * 7 - Math.abs(sx - state.px) / 38) * calm;
          }
          return gsap.utils.clamp(0.03, 1.52, phi);
        };

        // left panel: anchored at the left edge, folding toward it
        let x = 0;
        for (let k = 0; k < N; k++) {
          const phi = fold(x + w / 2, k);
          const p = w * Math.cos(phi);
          const even = k % 2 === 0;
          const left = even ? x : x + p - w;
          paint(k, left, even ? phi : -phi, even ? "0% 50%" : "100% 50%", even, phi);
          x += p;
        }
        // right panel: anchored at the right edge
        x = W;
        for (let j = 0; j < N; j++) {
          const i = N + j;
          const phi = fold(x - w / 2, j);
          const p = w * Math.cos(phi);
          const even = j % 2 === 0;
          const left = even ? x - w : x - p;
          paint(i, left, even ? -phi : phi, even ? "100% 50%" : "0% 50%", even, phi);
          x -= p;
        }
      };

      /** `lit`: the strip faces the opening (toward the light inside), so it stays bright. */
      const paint = (i: number, left: number, rot: number, origin: string, lit: boolean, phi: number) => {
        const s = strips.current[i];
        if (!s) return;
        if (s.style.transformOrigin !== origin) s.style.transformOrigin = origin;
        s.style.transform = `translate3d(${left.toFixed(2)}px,0,0) rotateY(${rot.toFixed(4)}rad)`;
        const sin = Math.sin(phi);
        const shade = shades.current[i];
        if (shade) shade.style.opacity = (lit ? 0.08 * sin : 0.12 + 0.62 * sin).toFixed(3);
      };

      gsap.ticker.add(tick);
      tick();
      return () => {
        gsap.ticker.remove(tick);
        el.removeEventListener("pointermove", onMove);
        io.disconnect();
      };
    },
    { scope: root, dependencies: [size, reduced], revertOnUpdate: true },
  );

  return (
    <section
      ref={root}
      id="top-door"
      aria-label="باب خيمة سمسم"
      className="relative h-svh w-full overflow-hidden bg-ink"
      style={{ ["--ink" as string]: 0 }}
    >
      <h1 className="sr-only">سمسم — خيمة سحور رمضانية</h1>

      {/* inside the tent */}
      <div data-room className="absolute inset-0">
        <Image src={assets.heroFanous.src} alt={assets.heroFanous.alt} fill priority sizes="100vw" className="object-cover object-[70%_60%]" />
        <div className="absolute inset-0 bg-gradient-to-l from-black/10 via-black/55 to-black/90" />
      </div>
      <div
        data-glow
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[140vmax] w-[40vmax] -translate-x-1/2 -translate-y-1/2 opacity-0"
        style={{ background: "radial-gradient(ellipse at center, rgba(255,186,96,.55), rgba(217,105,42,.18) 40%, transparent 70%)" }}
      />
      <div data-welcome className="invisible absolute inset-y-0 left-0 z-10 flex w-full flex-col items-center justify-center px-8 pt-16 text-center opacity-0 lg:left-[10vw] lg:w-[46%] lg:items-start lg:text-start">
        <p className="font-display text-[clamp(3rem,6.4vw,5.8rem)] leading-[1.1] text-cream">اتفضّل.. البيت بيتك</p>
        <p className="mt-4 max-w-[34ch] text-lg leading-8 text-cream/85">فول وطعمية وشاي على النار، ولمّة لحد الفجر. الليلة لسه مبدأتش.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
          <a href="#ihgez" className="rounded-full bg-amber px-7 py-3 font-semibold text-ink transition-colors hover:bg-cream">
            احجز مكانك
          </a>
          <a href="#sofra" className="rounded-full border border-cream/50 px-7 py-3 text-cream transition-colors hover:border-amber hover:text-amber">
            شوف المنيو
          </a>
        </div>
      </div>

      {/* the curtains */}
      <div ref={door} aria-hidden className="absolute inset-x-0 bottom-0 top-16 z-20 [perspective:1500px]">
        {size ? (
          Array.from({ length: size.N * 2 }, (_, i) => {
            // strip i shows this slice of the artwork (right panel counts from the right edge)
            const slice = i < size.N ? i : 2 * size.N - 1 - (i - size.N);
            return (
              <div
                key={i}
                ref={(el) => {
                  strips.current[i] = el;
                }}
                className="absolute left-0 top-0 h-full overflow-hidden will-change-transform [backface-visibility:hidden]"
                style={{ width: size.w + 0.6 }}
              >
                <CurtainArt size={size} offset={slice * size.w} />
                <div ref={(el) => { shades.current[i] = el; }} className="absolute inset-0 bg-black opacity-0 will-change-[opacity]" />
              </div>
            );
          })
        ) : (
          <div className="absolute inset-0 bg-cloth" style={{ backgroundImage: "url(/patterns/curtain.svg)", backgroundSize: "140px 140px" }} />
        )}
      </div>

      {/* rod and valance: the top of the door */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-14 z-30">
        <div className="h-3 bg-gradient-to-b from-[#e3a160] via-[#9a5527] to-[#4a220c] shadow-[0_4px_10px_rgba(0,0,0,.6)]" />
        <svg className="block h-[7svh] min-h-10 w-full" preserveAspectRatio="none" viewBox="0 0 400 40">
          <defs>
            <pattern id="valance" width="40" height="40" patternUnits="userSpaceOnUse">
              <rect width="40" height="22" fill="#1f2c5c" />
              <path d="M0 22 L20 40 L40 22Z" fill="#a3221a" />
              <path d="M10 22 L20 32 L30 22Z" fill="#e4a72e" />
              <path d="M0 6 H40" stroke="#f3e3c3" strokeWidth="1" strokeDasharray="2 2" />
              <circle cx="20" cy="13" r="3" fill="#f3e3c3" />
            </pattern>
          </defs>
          <rect width="400" height="40" fill="url(#valance)" />
        </svg>
      </div>

      <p data-hint className="pointer-events-none absolute inset-x-0 bottom-6 z-30 text-center text-sm text-cream/85 [text-shadow:0_1px_8px_rgba(0,0,0,.8)]">
        المس الستارة.. واسحب لتحت عشان تدخل
      </p>
    </section>
  );
}

/** Everything printed on the cloth, laid out across both panels as one piece. */
function CurtainArt({ size, offset }: { size: Size; offset: number }) {
  const { A, H, W } = size;
  const tile = W < 720 ? 110 : 140;
  const mid = A / 2;
  const band = Math.max(9, W * 0.02);
  return (
    <div
      className="absolute top-0 h-full"
      style={{
        width: A,
        left: -offset,
        backgroundColor: "#a3221a",
        backgroundImage: "url(/patterns/curtain.svg)",
        backgroundSize: `${tile}px ${tile}px`,
        backgroundPosition: `${mid}px 0`,
      }}
    >
      {/* the two door edges: indigo bands with cream stitching, meeting at the seam */}
      <div
        className="absolute top-0 h-full"
        style={{
          left: mid - band * 2,
          width: band * 4,
          background:
            "linear-gradient(90deg, transparent 0, transparent 6%, #1f2c5c 6%, #1f2c5c 44%, #f3e3c3 44%, #f3e3c3 50%, #f3e3c3 50%, #f3e3c3 56%, #1f2c5c 56%, #1f2c5c 94%, transparent 94%)",
        }}
      />
      {/* hem */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: H * 0.09,
          backgroundColor: "#1f2c5c",
          backgroundImage:
            "linear-gradient(135deg, #e4a72e 25%, transparent 25%), linear-gradient(225deg, #e4a72e 25%, transparent 25%)",
          backgroundSize: "36px 36px",
          backgroundPosition: "0 0",
          borderTop: "3px dashed #f3e3c3",
        }}
      />
      {/* light falls off toward the top and the floor */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/50" />

      {/* the name, sewn across the seam */}
      <div className="absolute inset-x-0 flex flex-col items-center" style={{ top: H * (W < 720 ? 0.26 : 0.2), opacity: "var(--ink)" }}>
        <span
          className="font-display leading-[1.1] text-cream"
          style={{
            fontSize: W < 720 ? W * 0.42 : Math.min(W * 0.3, H * 0.42),
            textShadow: "0 4px 0 #7d1812",
          }}
        >
          سمسم
        </span>
      </div>
    </div>
  );
}
