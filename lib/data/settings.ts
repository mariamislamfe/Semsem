import { getSupabase } from "@/lib/supabase/server";
import type { SiteSettings } from "@/lib/types";

/** Unknown business facts stay `null` — the UI shows an honest "coming soon". */
const defaults: SiteSettings = {
  menuIsSample: true,
  locationText: null,
  mapsUrl: null,
  hoursText: null,
  phone: null,
  whatsapp: null,
  instagram: null,
};

export async function getSettings(): Promise<SiteSettings> {
  const supabase = getSupabase();
  if (!supabase) return defaults;
  try {
    const { data, error } = await supabase.from("site_settings").select("key,value");
    if (error || !data) return defaults;
    const merged: Record<string, unknown> = { ...defaults };
    for (const row of data as Array<{ key: string; value: unknown }>) {
      if (row.key in defaults) merged[row.key] = row.value;
    }
    return merged as unknown as SiteSettings;
  } catch {
    return defaults;
  }
}
