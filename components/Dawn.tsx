"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMotionPref } from "./MotionPref";

const lines = ["اصحى يا نايم..", "وحّد الدايم.", "ولسه فاضل لقمة، قوم يا صاحبي."];

/**
 * To use a real recording of the chant instead of the built-in synth, drop a
 * file at /public/audio/asha-ya-nayem.mp3 — it is picked up automatically.
 */
const RECORDING = "/audio/asha-ya-nayem.mp3";

const BPM = 92;
const BEAT = 60 / BPM;
const TOTAL_BEATS = 24;
/** beat at which each line of the chant starts */
const LINE_BEATS = [0, 8, 16];

// Hijaz on D — the colour of the musaharati's call.
const N = { D4: 293.66, Eb4: 311.13, Fs4: 369.99, G4: 392, A4: 440, Bb4: 466.16 } as const;
// [pitch, startBeat, lengthInBeats] — "اصحى يا نايم / وحّد الدايم / ولسه فاضل لقمة…"
const MELODY: Array<[number, number, number]> = [
  [N.A4, 0, 1], [N.G4, 1, 0.5], [N.Fs4, 1.5, 0.5], [N.G4, 2, 1], [N.A4, 3, 1.5], [N.Bb4, 4.5, 0.5], [N.A4, 5, 2],
  [N.G4, 8, 1], [N.Fs4, 9, 0.5], [N.Eb4, 9.5, 0.5], [N.D4, 10, 1], [N.Eb4, 11, 1], [N.D4, 12, 2.5],
  [N.A4, 16, 1], [N.A4, 17, 0.5], [N.Bb4, 17.5, 0.5], [N.A4, 18, 1], [N.G4, 19, 1], [N.Fs4, 20, 1], [N.G4, 21, 0.5], [N.A4, 22, 2],
];

function drum(ctx: AudioContext, at: number, strong = true) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(strong ? 190 : 260, at);
  osc.frequency.exponentialRampToValueAtTime(strong ? 55 : 120, at + (strong ? 0.18 : 0.08));
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(strong ? 0.8 : 0.35, at + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + (strong ? 0.42 : 0.15));
  osc.connect(gain).connect(ctx.destination);
  osc.start(at);
  osc.stop(at + 0.45);
}

function nay(ctx: AudioContext, freq: number, at: number, len: number) {
  const osc = ctx.createOscillator();
  const vib = ctx.createOscillator();
  const vibGain = ctx.createGain();
  const lp = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.value = freq;
  vib.frequency.value = 5.2;
  vibGain.gain.value = freq * 0.006;
  vib.connect(vibGain).connect(osc.frequency);
  lp.type = "lowpass";
  lp.frequency.value = 2400;
  const end = at + len * BEAT;
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(0.16, at + 0.05);
  gain.gain.setValueAtTime(0.16, Math.max(at + 0.06, end - 0.12));
  gain.gain.exponentialRampToValueAtTime(0.0001, end);
  osc.connect(lp).connect(gain).connect(ctx.destination);
  osc.start(at);
  vib.start(at);
  osc.stop(end + 0.05);
  vib.stop(end + 0.05);
}

/** Schedules the whole chant (drum + nay) on the audio clock. */
function playSynthChant(ctx: AudioContext) {
  const t0 = ctx.currentTime + 0.05;
  for (let b = 0; b < TOTAL_BEATS; b++) {
    drum(ctx, t0 + b * BEAT, b % 2 === 0);
    if (b % 4 === 1 || b % 4 === 3) drum(ctx, t0 + (b + 0.5) * BEAT, false);
  }
  for (const [f, start, len] of MELODY) nay(ctx, f, t0 + start * BEAT, len);
}

/**
 * The last scene: before dawn, the musaharati walks the lanes calling people to
 * wake for suhoor. Tap the drum and the call plays — each line lights up as it
 * is sung, and the sky lightens as you scroll in.
 */
export function Dawn({ hasRecording = false }: { hasRecording?: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timers = useRef<number[]>([]);
  const { reduced: reduce } = useMotionPref();
  const [lit, setLit] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [ripples, setRipples] = useState<number[]>([]);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const sky = useTransform(scrollYProgress, [0, 1], [0, 1]);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((t) => window.clearTimeout(t));
      audioRef.current?.pause();
      void ctxRef.current?.close();
    };
  }, []);

  const ripple = useCallback(() => {
    const id = Date.now() + Math.random();
    setRipples((r) => [...r.slice(-3), id]);
    window.setTimeout(() => setRipples((r) => r.filter((x) => x !== id)), 1200);
  }, []);

  const getCtx = () => {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctxRef.current ??= new AC();
    void ctxRef.current.resume();
    return ctxRef.current;
  };

  const startChant = useCallback(async () => {
    setPlaying(true);
    setStarted(true);
    setLit(1);
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];

    // use a real recording if one has been dropped in /public/audio, else the synth
    let usedFile = false;
    if (hasRecording) {
      try {
        audioRef.current ??= new Audio(RECORDING);
        audioRef.current.currentTime = 0;
        await audioRef.current.play();
        usedFile = true;
      } catch {
        usedFile = false;
      }
    }
    if (!usedFile) {
      try {
        const ctx = getCtx();
        if (ctx) playSynthChant(ctx);
      } catch {
        /* audio is a bonus, never a requirement */
      }
    }

    LINE_BEATS.forEach((b, i) => {
      timers.current.push(
        window.setTimeout(() => {
          setLit(i + 1);
          ripple();
        }, b * BEAT * 1000),
      );
    });
    timers.current.push(window.setTimeout(() => setPlaying(false), (TOTAL_BEATS + 1) * BEAT * 1000));
    ripple();
  }, [ripple, hasRecording]);

  const beat = () => {
    navigator.vibrate?.(20);
    if (!playing) {
      void startChant();
      return;
    }
    // while the call is playing, extra taps just add drum hits on top
    try {
      const ctx = getCtx();
      if (ctx) drum(ctx, ctx.currentTime + 0.01, true);
    } catch {
      /* ignore */
    }
    ripple();
  };

  return (
    <section
      ref={ref}
      aria-labelledby="dawn-title"
      className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-6 py-28 text-center"
    >
      <motion.div
        aria-hidden
        className="absolute inset-0"
        style={{
          opacity: sky,
          background: "linear-gradient(to top, #e9b27a 0%, #8f7a90 28%, #2b3350 60%, #0b0807 100%)",
        }}
      />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink to-transparent" />

      <div className="relative z-10">
        <p className="font-latin text-sm italic tracking-[0.35em] text-dawn">BEFORE FAJR</p>
        <h2 id="dawn-title" className="mt-4 font-display text-[clamp(2.6rem,8vw,6rem)] leading-[1.15] text-cream">
          {lines.slice(0, lit).map((l, i) => (
            <motion.span
              key={l}
              initial={reduce ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`block ${i > 0 ? "text-amber" : ""}`}
            >
              {l}
            </motion.span>
          ))}
        </h2>

        <div className="relative mx-auto mt-14 h-52 w-52">
          {ripples.map((id) => (
            <span
              key={id}
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 h-full w-full rounded-full border-2 border-amber/70"
              style={{ animation: "ripple 1.1s ease-out forwards" }}
            />
          ))}
          <button
            type="button"
            onClick={beat}
            aria-label={playing ? "اضرب الطبلة" : "اضرب الطبلة واسمع المسحراتي"}
            className="relative flex h-full w-full items-center justify-center rounded-full border-[6px] border-[#2a0f0a] shadow-[0_20px_50px_rgba(0,0,0,.7)] transition active:scale-95"
            style={{
              background: "radial-gradient(circle at 40% 35%, #f3e6cc 0 30%, #d8c29a 62%, #a58c5d 100%)",
            }}
          >
            <span className="absolute inset-3 rounded-full border border-dashed border-ink/40" />
            <span className="font-display text-3xl text-ink">{!started ? "اضرب" : playing ? "اضرب" : "تاني"}</span>
          </button>
        </div>
        <p className="mt-6 text-sm text-cream/80" aria-live="polite">
          {!started
            ? "المسحراتي مستني إيدك على الطبلة"
            : playing
              ? "اضرب معاه.. اصحى يا نايم"
              : "الفجر قرّب.. بس لسه فيه وقت"}
        </p>
      </div>
    </section>
  );
}
