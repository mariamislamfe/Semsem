import { getSupabase } from "@/lib/supabase/server";
import type { CategoryWithItems, MenuItem, MenuPayload } from "@/lib/types";
import { demoMenu } from "./demo-menu";

interface CategoryRow {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string | null;
  blurb_ar: string | null;
  sort_order: number;
}
interface ItemRow {
  id: string;
  category_id: string;
  name_ar: string;
  name_en: string | null;
  description_ar: string | null;
  price: number | string | null;
  image_url: string | null;
  sort_order: number;
  is_available: boolean;
  tags: string[] | null;
  is_demo: boolean;
}

/** Loads the menu from Supabase; falls back to bundled demo data when unavailable. */
export async function getMenu(): Promise<MenuPayload> {
  const supabase = getSupabase();
  if (!supabase) return { categories: demoMenu, source: "demo" };

  try {
    const [cats, items] = await Promise.all([
      supabase.from("menu_categories").select("*").eq("is_visible", true).order("sort_order"),
      supabase.from("menu_items").select("*").order("sort_order"),
    ]);
    if (cats.error || items.error) throw cats.error ?? items.error;

    const categories: CategoryWithItems[] = (cats.data as CategoryRow[]).map((c) => ({
      id: c.id,
      slug: c.slug,
      nameAr: c.name_ar,
      nameEn: c.name_en,
      blurbAr: c.blurb_ar,
      sortOrder: c.sort_order,
      items: [],
    }));
    const byId = new Map(categories.map((c) => [c.id, c]));

    for (const r of items.data as ItemRow[]) {
      const item: MenuItem = {
        id: r.id,
        categoryId: r.category_id,
        nameAr: r.name_ar,
        nameEn: r.name_en,
        descriptionAr: r.description_ar,
        price: r.price === null ? null : Number(r.price),
        imageUrl: r.image_url,
        sortOrder: r.sort_order,
        isAvailable: r.is_available,
        tags: r.tags ?? [],
        isDemo: r.is_demo,
      };
      byId.get(item.categoryId)?.items.push(item);
    }

    const populated = categories.filter((c) => c.items.length > 0);
    if (populated.length === 0) return { categories: demoMenu, source: "demo" };
    return { categories: populated, source: "supabase" };
  } catch {
    return { categories: demoMenu, source: "demo" };
  }
}
