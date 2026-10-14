import { existsSync } from "node:fs";
import path from "node:path";
import { Dawn } from "@/components/Dawn";
import { Footer } from "@/components/Footer";
import { Arrival } from "@/components/tent/Arrival";
import { MenuSection } from "@/components/MenuSection";
import { NightNav } from "@/components/NightNav";
import { Reserve } from "@/components/Reserve";
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

  return (
    <>
      <NightNav />
      <main id="top">
        <Arrival />
        <MenuSection categories={menu.categories} isSample={isSample} />
        <Story />
        <Reserve />
        <Visit settings={settings} />
        <Dawn hasRecording={hasRecording} />
      </main>
      <Footer />
    </>
  );
}
