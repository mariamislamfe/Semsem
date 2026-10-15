import { existsSync } from "node:fs";
import path from "node:path";
import { Dawn } from "@/components/Dawn";
import { Footer } from "@/components/Footer";
import { LanternHero } from "@/components/LanternHero";
import { MenuSection } from "@/components/MenuSection";
import { NightNav } from "@/components/NightNav";
import { Reserve } from "@/components/Reserve";
import { ScrollFX, Stitch } from "@/components/ScrollFX";
import { Story } from "@/components/Story";
import { Visit } from "@/components/Visit";
import { getMenu } from "@/lib/data/menu";
import { getSettings } from "@/lib/data/settings";

// Menu edits in Supabase show up within a minute, no redeploy needed.
export const revalidate = 60;

export default async function Home() {
  const [menu, settings] = await Promise.all([getMenu(), getSettings()]);
  const isSample =
    menu.source === "demo" || settings.menuIsSample || menu.categories.some((c) => c.items.some((i) => i.isDemo));

  // a real recording of the chant, if the owner dropped one in /public/audio
  const hasRecording = existsSync(path.join(process.cwd(), "public", "audio", "asha-ya-nayem.mp3"));

  // only facts we actually know — no address, hours or prices until the owner confirms them
  const jsonLd = { "@context": "https://schema.org", "@type": "Restaurant", name: "سمسم — Semsem", servesCuisine: "Egyptian", description: "خيمة سحور رمضانية" };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <NightNav />
      <main id="top">
        <LanternHero />
        <MenuSection categories={menu.categories} isSample={isSample} />
        <Stitch className="bg-[#110a06]" />
        <Story />
        <Stitch className="bg-ink" tone="#b3261e" />
        <Reserve />
        <Stitch className="bg-soot" />
        <Visit settings={settings} />
        <Dawn hasRecording={hasRecording} />
      </main>
      <Footer />
      <ScrollFX />
    </>
  );
}
