"use client";

import { useState, useTransition } from "react";
import { createReservation, type ActionResult } from "@/app/actions";
import { toArabicDigits } from "@/lib/format";

type Seating = "table" | "floor" | "any";

const seatOptions: Array<{ v: Seating; label: string; hint: string }> = [
  { v: "table", label: "ترابيزة", hint: "كراسي وترابيزة" },
  { v: "floor", label: "على الأرض", hint: "جلسة أرضية" },
  { v: "any", label: "أي مكان", hint: "اللي يتوفر" },
];

const today = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

/** Reservation request: party size, floor or table, when. Sent to Supabase when configured. */
export function Reserve() {
  const [party, setParty] = useState(4);
  const [seating, setSeating] = useState<Seating>("table");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("23:30");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      setResult(
        await createReservation({ name, phone, partySize: party, seating, date: date || today(), time, note }),
      );
    });
  };

  const field =
    "w-full rounded-xl border border-cream/20 bg-ink/60 px-4 py-3 text-cream placeholder:text-sand/60";

  return (
    <section id="ihgez" className="relative bg-cloth px-5 py-20 md:px-10 md:py-28">
      <div aria-hidden className="khayameya pointer-events-none absolute inset-0 opacity-[0.12]" style={{ backgroundSize: "150px 150px" }} />
      <div className="relative mx-auto max-w-6xl">
        <header className="flex flex-wrap items-end justify-between gap-x-12 gap-y-3">
          <h2 data-anim="heading" className="font-display text-[clamp(2.8rem,7vw,5rem)] leading-[1.1] text-cream">احجز مكانك</h2>
          <div data-anim="fade" className="max-w-md">
          <p className="leading-8 text-cream/90">
            قولنا هتبقوا كام فرد، وعايزين تقعدوا على ترابيزة ولا على الأرض، والباقي علينا.
          </p>
          <p className="mt-4 text-sm leading-7 text-cream/75">
            ده طلب حجز مش تأكيد — هنكلّمك على الرقم لما يتأكّد.
          </p>
          </div>
        </header>

        <div data-anim="fade" className="mt-10">
          {result?.ok ? (
            <div className="mx-auto max-w-2xl rounded-2xl border border-amber/40 bg-soot p-8 text-center">
              <p className="font-display text-5xl text-amber">وصلنا طلبك</p>
              <p className="mt-4 text-cream">{result.summary}</p>
              {result.demo && (
                <p className="stitch mx-auto mt-6 max-w-sm rounded-xl bg-cloth/10 px-4 py-3 text-sm leading-7 text-cream">
                  ده عرض تجريبي — الطلب ماتبعتش لأي حد لأن الموقع لسه مش متوصّل بقاعدة البيانات.
                </p>
              )}
              <button
                type="button"
                onClick={() => setResult(null)}
                className="mt-6 rounded-full border border-cream/30 px-6 py-2 text-sm text-cream transition-colors hover:border-amber hover:text-amber"
              >
                حجز تاني
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="grid gap-x-12 gap-y-6 rounded-2xl border border-cream/10 bg-soot p-6 md:p-10 lg:grid-cols-2">
              <div className="space-y-6">
              <fieldset>
                <legend className="mb-3 text-sm text-sand">هتبقوا كام فرد؟</legend>
                <div className="flex items-center justify-center gap-6">
                  <button
                    type="button"
                    onClick={() => setParty((n) => Math.max(1, n - 1))}
                    aria-label="قلّل العدد"
                    className="h-12 w-12 rounded-full border border-cream/25 text-2xl text-cream transition-colors hover:border-amber hover:text-amber"
                  >
                    −
                  </button>
                  <span className="min-w-16 text-center font-display text-6xl text-amber" aria-live="polite">
                    {toArabicDigits(party)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setParty((n) => Math.min(40, n + 1))}
                    aria-label="زوّد العدد"
                    className="h-12 w-12 rounded-full bg-amber text-2xl font-semibold text-ink transition-colors hover:bg-cream"
                  >
                    +
                  </button>
                </div>
              </fieldset>

              <fieldset>
                <legend className="mb-3 text-sm text-sand">تحبوا تقعدوا فين؟ اختاروا من الخريطة</legend>
                <div className="mx-auto max-w-[400px]">
                  <TentPlan seating={seating} onPick={setSeating} />
                </div>
                <div className="mt-2 flex justify-center gap-2">
                  {seatOptions.map((o) => (
                    <label
                      key={o.v}
                      className={`cursor-pointer rounded-full border px-4 py-1.5 text-sm transition-colors ${
                        seating === o.v ? "border-amber bg-amber/10 text-cream" : "border-cream/20 text-sand hover:text-cream"
                      }`}
                    >
                      <input type="radio" name="seat" value={o.v} checked={seating === o.v} onChange={() => setSeating(o.v)} className="sr-only" />
                      {o.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              </div>

              <div className="flex flex-col gap-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm text-sand">
                  اليوم
                  <input
                    type="date"
                    min={today()}
                    value={date || today()}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className={`${field} mt-1`}
                  />
                </label>
                <label className="block text-sm text-sand">
                  الساعة
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                    className={`${field} mt-1`}
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={60}
                  placeholder="اسمك"
                  autoComplete="name"
                  className={field}
                />
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  inputMode="tel"
                  dir="ltr"
                  placeholder="01xxxxxxxxx"
                  autoComplete="tel"
                  className={`${field} text-end`}
                />
              </div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={300}
                rows={3}
                placeholder="أي ملاحظة؟ (عيد ميلاد، كرسي لطفل..)"
                className={field}
              />

              {result && !result.ok && (
                <p role="alert" className="rounded-xl bg-cloth/30 px-4 py-3 text-cream">
                  {result.error}
                </p>
              )}

              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-full bg-amber py-3.5 font-semibold text-ink transition-colors hover:bg-cream disabled:opacity-60"
              >
                {pending ? "بنبعت.." : `احجز لـ ${toArabicDigits(party)} أفراد`}
              </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

/**
 * Top-down sketch of the tent: pick the side you want to sit on. Conceptual —
 * the real layout will replace this once the venue plan is confirmed.
 */
function TentPlan({ seating, onPick }: { seating: Seating; onPick: (s: Seating) => void }) {
  const zone = (id: Seating, label: string, x: number, w: number, children: React.ReactNode) => {
    const on = seating === id;
    return (
      <g
        role="radio"
        aria-checked={on}
        aria-label={label}
        tabIndex={0}
        className="cursor-pointer outline-none"
        onClick={() => onPick(id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onPick(id);
          }
        }}
      >
        <rect
          x={x}
          y="14"
          width={w}
          height="132"
          rx="10"
          fill={on ? "rgba(242,169,59,.14)" : "rgba(243,230,204,.03)"}
          stroke={on ? "#f2a93b" : "rgba(243,230,204,.25)"}
          strokeWidth={on ? 2 : 1}
          strokeDasharray={on ? undefined : "4 4"}
        />
        {children}
        <text x={x + w / 2} y="136" textAnchor="middle" fontSize="11" fill={on ? "#f2a93b" : "#cdbb97"}>
          {label}
        </text>
      </g>
    );
  };
  return (
    <svg viewBox="0 0 300 176" className="w-full" role="radiogroup" aria-label="خريطة الخيمة">
      <rect x="2" y="2" width="296" height="150" rx="14" fill="#15100d" stroke="#8f2518" strokeWidth="2" />
      {zone(
        "table",
        "ترابيزات",
        12,
        134,
        <>
          {[0, 1, 2, 3].map((i) => (
            <circle key={i} cx={44 + (i % 2) * 58} cy={46 + Math.floor(i / 2) * 50} r="17" fill="#2a0f0a" stroke="#c9792b" strokeWidth="1.5" />
          ))}
        </>,
      )}
      {zone(
        "floor",
        "جلسة أرضية",
        154,
        134,
        <>
          <rect x="172" y="30" width="98" height="78" rx="6" fill="#2a0f0a" stroke="#6b7a3e" strokeWidth="1.5" strokeDasharray="3 3" />
          <circle cx="221" cy="69" r="14" fill="#3a1a10" stroke="#c9792b" />
          {[[184, 40], [246, 40], [184, 92], [246, 92]].map(([x, y]) => (
            <rect key={`${x}-${y}`} x={x! - 7} y={y! - 5} width="14" height="10" rx="2" fill="#9b2a1c" />
          ))}
        </>,
      )}
      {/* the door, at the bottom */}
      <rect x="132" y="146" width="36" height="8" fill="#15100d" />
      <text x="150" y="170" textAnchor="middle" fontSize="10" fill="#cdbb97">
        الباب
      </text>
    </svg>
  );
}
