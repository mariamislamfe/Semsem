import type { CategoryWithItems, MenuItem } from "@/lib/types";

export interface Suggestion {
  item: MenuItem;
  /** Short Egyptian-Arabic line explaining why we are suggesting it. */
  reason: string;
}

/**
 * "ناقصك حاجة؟" — simple, explainable pairing rules.
 * Rules are keyed on category slugs; a rule is skipped if the category does not
 * exist in the loaded menu, so it keeps working with whatever the owner publishes.
 */
export function recommend(
  categories: CategoryWithItems[],
  cart: ReadonlyMap<string, number>,
  limit = 3,
): Suggestion[] {
  const bySlug = new Map(categories.map((c) => [c.slug, c]));
  const inCart = (slug: string) =>
    bySlug.get(slug)?.items.some((i) => (cart.get(i.id) ?? 0) > 0) ?? false;
  const pick = (slug: string, n: number): MenuItem[] =>
    (bySlug.get(slug)?.items ?? []).filter((i) => i.isAvailable && !cart.has(i.id)).slice(0, n);

  const has = {
    ful: inCart("ful"),
    taameya: inCart("taameya"),
    mezze: inCart("mezze"),
    fries: inCart("fries"),
    drinks: inCart("drinks"),
  };
  const anyFood = has.ful || has.taameya || has.mezze || has.fries;
  if (!anyFood) return [];

  const out: Suggestion[] = [];
  const add = (slug: string, reason: string, n = 1) => {
    for (const item of pick(slug, n)) {
      if (!out.some((s) => s.item.id === item.id)) out.push({ item, reason });
    }
  };

  // the one people forget
  if (!has.drinks) add("drinks", "من غير شاي أو بيبسي؟ السحور بيبقى ناقص.", 2);
  if (has.ful && !has.taameya) add("taameya", "الفول والطعمية توأم.");
  if (has.taameya && !has.ful) add("ful", "الطعمية من غير فول؟ مش هتحلى.");
  if (!has.mezze) add("mezze", "حاجة تقطع الدسم — مخلل أو سلطة.");
  if ((has.ful || has.taameya) && !has.fries) add("fries", "بطاطس جنب الطبق، للتشارك.");

  return out.slice(0, limit);
}
