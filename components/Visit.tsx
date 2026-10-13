import type { SiteSettings } from "@/lib/types";
import { Reveal } from "./Reveal";

/**
 * Practical information. Every fact here comes from `site_settings`.
 * Anything not yet confirmed renders as an honest "coming soon" — and no
 * button is shown for an action that does not exist yet.
 */
export function Visit({ settings }: { settings: SiteSettings }) {
  const rows: Array<{ label: string; value: string | null; href?: string | null; cta?: string }> = [
    { label: "العنوان", value: settings.locationText, href: settings.mapsUrl, cta: "افتح الخريطة" },
    { label: "المواعيد", value: settings.hoursText },
    { label: "تليفون", value: settings.phone, href: settings.phone ? `tel:${settings.phone.replace(/\s/g, "")}` : null, cta: "اتصل" },
    {
      label: "واتساب",
      value: settings.whatsapp,
      href: settings.whatsapp ? `https://wa.me/${settings.whatsapp.replace(/\D/g, "")}` : null,
      cta: "ابعت رسالة",
    },
    { label: "إنستجرام", value: settings.instagram, href: settings.instagram, cta: "تابعنا" },
  ];

  return (
    <section id="makan" className="relative bg-soot px-5 py-24 md:px-10 md:py-32">
      <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-[1fr_1.4fr]">
        <Reveal as="header">
          <p className="font-latin text-sm italic tracking-[0.35em] text-amber">FIND US</p>
          <h2 className="mt-4 font-display text-[clamp(2.8rem,7vw,5rem)] leading-[1.1] text-cream">المكان والمعاد</h2>
          <p className="mt-4 leading-8 text-sand">
            التفاصيل دي بتتحدّث من لوحة التحكم أول ما تتأكّد — مفيش حاجة هنا مخترَعة.
          </p>
        </Reveal>

        <dl className="divide-y divide-cream/10 rounded-2xl border border-cream/10">
          {rows.map((r) => (
            <div key={r.label} className="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
              <dt className="text-sand">{r.label}</dt>
              <dd className="flex items-center gap-4">
                {r.value ? (
                  <>
                    <span className="text-cream">{r.value}</span>
                    {r.href && (
                      <a
                        href={r.href}
                        className="rounded-full bg-amber px-4 py-1.5 text-sm font-semibold text-ink transition hover:bg-cream"
                        {...(r.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      >
                        {r.cta}
                      </a>
                    )}
                  </>
                ) : (
                  <span className="rounded-full border border-dashed border-cream/25 px-3 py-1 text-sm text-sand/80">
                    هنعلنها قريب
                  </span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
