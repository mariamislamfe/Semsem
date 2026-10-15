"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useRef, useState } from "react";
import { createLanternRenderer, type LanternRenderer } from "@/lib/lanternGL";
import { useMotionPref } from "./MotionPref";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * The way in: a dark tent and one pierced fanous. It is lit as you arrive and
 * throws its pattern — stars, drops, coloured glass — over the walls, ceiling
 * and floor. Move and it swings on its chain, sweeping the light across the
 * room. Scroll and the light leaves the walls to write سمسم, then the welcome.
 *
 * Without WebGL the same page shows the name lit by a warm glow (no canvas).
 */
export function LanternHero() {
  const root = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const gl = useRef<LanternRenderer | null>(null);
  const [mode, setMode] = useState<"loading" | "gl" | "static">("loading");
  const { reduced } = useMotionPref();

  useGSAP(
    () => {
      const el = root.current;
      const cv = canvas.current;
      if (!el || !cv) return;
      const s = { intro: reduced ? 1 : 0, form: 0, swayX: 0, swayZ: 0, spin: 0, calm: reduced };
      const pend = { x: 0, z: 0, vx: 0, vz: 0, tx: 0, tz: 0 };
      const st = { visible: true, last: -1e9 };
      let alive = true;

      const probe = document.createElement("span");
      probe.className = "font-display";
      document.body.appendChild(probe);
      const fontFamily = getComputedStyle(probe).fontFamily;
      probe.remove();

      createLanternRenderer(cv, { fontFamily }).then((r) => {
        if (!alive) return r?.destroy();
        if (!r) return setMode("static");
        gl.current = r;
        setMode("gl");
        // 1 — the lantern is lit, its pattern spreads over the room
        if (!reduced) gsap.to(s, { intro: 1, duration: 2.8, ease: "power2.out", delay: 0.3 });
        gsap.fromTo(el.querySelectorAll("[data-intro]"), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 1, delay: reduced ? 0 : 2.2, stagger: 0.15 });
      });

      // 2 — scroll: the light writes the name, then the welcome arrives
      const tl = gsap.timeline({
        scrollTrigger: { trigger: el, start: "top top", end: "+=170%", pin: true, scrub: 0.9, refreshPriority: 10 },
      });
      tl.to(s, { form: 1, ease: "none", duration: 1 }, 0)
        .to(el.querySelectorAll("[data-intro]"), { autoAlpha: 0, duration: 0.12 }, 0)
        .fromTo(el.querySelector("[data-welcome]"), { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.25 }, 0.78)
        .to({}, { duration: 0.15 });

      // pointer / finger: the lantern swings on its chain (a damped pendulum)
      const onMove = (e: PointerEvent) => {
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        pend.tz = -nx * 0.55;
        pend.tx = ny * 0.35;
        st.last = performance.now();
      };
      window.addEventListener("pointermove", onMove, { passive: true });
      const io = new IntersectionObserver(([e]) => (st.visible = !!e?.isIntersecting));
      io.observe(el);

      const t0 = performance.now();
      let prev = t0;
      const guard = { start: 0, frames: 0, done: false };
      const tick = () => {
        const r = gl.current;
        if (!r || !st.visible) return;
        const now = performance.now();
        const dt = Math.min(0.05, (now - prev) / 1000);
        prev = now;
        const t = (now - t0) / 1000;
        if (!reduced) {
          // idle: a slow breath of a swing
          if (now - st.last > 3000) {
            pend.tz = Math.sin(t * 0.45) * 0.12;
            pend.tx = Math.sin(t * 0.31 + 1) * 0.07;
          }
          // spring toward where you point, with inertia so it overshoots and settles
          pend.vx += ((pend.tx - pend.x) * 9 - pend.vx * 2.6) * dt;
          pend.vz += ((pend.tz - pend.z) * 9 - pend.vz * 2.6) * dt;
          pend.x += pend.vx * dt;
          pend.z += pend.vz * dt;
          s.spin = t * 0.07;
        }
        s.swayX = pend.x * (1 - s.form);
        s.swayZ = pend.z * (1 - s.form);
        const { lx, ly } = r.render(s, t);
        el.style.setProperty("--lx", `${((lx + 1) / 2) * 100}%`);
        el.style.setProperty("--ly", `${((1 - ly) / 2) * 100}%`);

        if (!guard.done) {
          if (!guard.start) guard.start = now;
          else if (now - guard.start > 800) guard.frames++;
          if (now - guard.start > 2800) {
            guard.done = true;
            if ((now - guard.start - 800) / Math.max(1, guard.frames) > 34) {
              r.destroy();
              gl.current = null;
              setMode("static");
            }
          }
        }
      };
      gsap.ticker.add(tick);

      return () => {
        alive = false;
        gsap.ticker.remove(tick);
        window.removeEventListener("pointermove", onMove);
        io.disconnect();
        gl.current?.destroy();
        gl.current = null;
      };
    },
    { scope: root, dependencies: [reduced], revertOnUpdate: true },
  );

  return (
    <section
      ref={root}
      id="top-door"
      aria-label="مدخل خيمة سمسم"
      className="relative h-svh w-full overflow-hidden bg-[#070403]"
      style={{ ["--lx" as string]: "50%", ["--ly" as string]: "31%" }}
    >
      <h1 className="sr-only">سمسم — خيمة سحور رمضانية</h1>

      {/* the room, barely there: warm air around the lantern */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: "radial-gradient(circle at var(--lx) var(--ly), rgba(255,170,80,.16), rgba(120,60,20,.06) 30%, transparent 60%)" }}
      />

      <canvas ref={canvas} aria-hidden className={`absolute inset-0 h-full w-full ${mode === "gl" ? "" : "invisible"}`} />

      {/* without WebGL: the name, lit */}
      {mode === "static" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="font-display text-[clamp(6rem,26vw,18rem)] leading-none text-cream" style={{ textShadow: "0 0 60px rgba(255,180,90,.55)" }}>
            سمسم
          </p>
        </div>
      )}

      <p data-intro className="invisible absolute inset-x-0 bottom-[13svh] px-6 text-center text-[clamp(1.1rem,2.2vw,1.6rem)] font-light text-cream/90">
        خيمة سحور رمضانية
      </p>
      <p data-intro className="invisible absolute inset-x-0 bottom-6 text-center text-sm text-sand/80">
        حرّك الفانوس.. وانزل لجوّه
      </p>

      <div data-welcome className="invisible absolute inset-x-0 bottom-[12svh] flex flex-col items-center px-6 text-center opacity-0">
        <p className="max-w-[34ch] text-lg leading-8 text-cream/90 md:text-xl">اتفضّل.. فول وطعمية وشاي على النار، ولمّة لحد الفجر.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <a href="#ihgez" className="rounded-full bg-amber px-7 py-3 font-semibold text-ink transition-colors hover:bg-cream">
            احجز مكانك
          </a>
          <a href="#sofra" className="rounded-full border border-cream/50 px-7 py-3 text-cream transition-colors hover:border-amber hover:text-amber">
            شوف المنيو
          </a>
        </div>
      </div>
    </section>
  );
}
