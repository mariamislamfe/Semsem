import { MotionToggle } from "./MotionToggle";

export function Footer() {
  return (
    <footer className="bg-ink px-5 py-12 text-sm text-sand md:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="font-display text-4xl text-cream">سمسم</p>
          <p className="mt-1 text-sm text-amber">Semsem</p>
        </div>

        <div className="max-w-xl space-y-3 leading-7">
          <p>
            نسخة تجريبية للعرض على صاحب الخيمة. الهوية، المنيو، الأسعار والصور كلها مقترحة ومؤقتة وهتتبدّل
            بالمحتوى الرسمي.
          </p>
          <details className="text-sand/80">
            <summary className="cursor-pointer text-cream">مصادر الصور</summary>
            <p className="mt-2">
              صور الأكل والأجواء من{" "}
              <a className="underline hover:text-amber" href="https://www.pexels.com/license/" target="_blank" rel="noopener noreferrer">
                Pexels
              </a>{" "}
              (ترخيص مجاني)، وصورة «الفول» (CC0) من{" "}
              <a className="underline hover:text-amber" href="https://commons.wikimedia.org" target="_blank" rel="noopener noreferrer">
                Wikimedia Commons
              </a>
              . كلها توضيحية، والتفاصيل في الملف <code dir="ltr">public/images/CREDITS.md</code>.
            </p>
          </details>
          <p>
            <MotionToggle />
          </p>
        </div>
      </div>
    </footer>
  );
}
