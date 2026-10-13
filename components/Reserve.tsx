"use client";

import { useState, useTransition } from "react";
import { createReservation, type ActionResult } from "@/app/actions";
import { toArabicDigits } from "@/lib/format";
import { Reveal } from "./Reveal";

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
    <section id="ihgez" className="bg-gradient-to-b from-ink to-soot px-5 py-20 md:px-10 md:py-28">
      <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-[1fr_1.3fr]">
        <Reveal as="header">
          <p className="font-latin text-sm italic tracking-[0.35em] text-amber">RESERVE</p>
          <h2 className="mt-4 font-display text-[clamp(2.8rem,7vw,5rem)] leading-[1.1] text-cream">احجز مكانك</h2>
          <p className="mt-4 leading-8 text-sand">
            قولنا هتبقوا كام فرد، وعايزين تقعدوا على ترابيزة ولا على الأرض، والباقي علينا.
          </p>
          <p className="mt-4 text-sm leading-7 text-sand/70">
            ده طلب حجز مش تأكيد — هنكلّمك على الرقم لما يتأكّد.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          {result?.ok ? (
            <div className="rounded-2xl border border-amber/40 bg-amber/5 p-8 text-center">
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
            <form onSubmit={submit} className="space-y-6 rounded-2xl border border-cream/10 bg-soot p-6 md:p-8">
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
                <legend className="mb-3 text-sm text-sand">تحبوا تقعدوا فين؟</legend>
                <div className="grid grid-cols-3 gap-3">
                  {seatOptions.map((o) => (
                    <label
                      key={o.v}
                      className={`cursor-pointer rounded-xl border px-2 py-3 text-center transition-colors ${
                        seating === o.v ? "border-amber bg-amber/10 text-cream" : "border-cream/20 text-sand"
                      }`}
                    >
                      <input
                        type="radio"
                        name="seat"
                        value={o.v}
                        checked={seating === o.v}
                        onChange={() => setSeating(o.v)}
                        className="sr-only"
                      />
                      <span className="block font-semibold">{o.label}</span>
                      <span className="block text-xs text-sand/80">{o.hint}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

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
                rows={2}
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
            </form>
          )}
        </Reveal>
      </div>
    </section>
  );
}
