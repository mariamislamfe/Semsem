import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-ink px-6 text-center">
      <p className="font-display text-6xl text-cream">الصفحة دي مش هنا</p>
      <p className="text-sand">يمكن دخلت من الباب الغلط.</p>
      <Link href="/" className="rounded-full bg-amber px-6 py-2.5 font-semibold text-ink transition hover:bg-cream">
        ارجع للخيمة
      </Link>
    </div>
  );
}
