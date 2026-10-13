"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-ink px-6 text-center">
      <p className="font-display text-5xl text-cream">حصلت مشكلة صغيرة</p>
      <p className="text-sand">الخيمة محتاجة لحظة. جرّب تاني.</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-full bg-amber px-6 py-2.5 font-semibold text-ink transition hover:bg-cream"
      >
        حاول تاني
      </button>
    </div>
  );
}
