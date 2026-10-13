/**
 * Central image registry.
 * Every picture on the site is referenced by key from here, so replacing a
 * stock photo with Semsem's real photography is a one-line change (or a new
 * file dropped at the same path in /public/images).
 *
 * All pictures are TEMPORARY, ILLUSTRATIVE stock/open-licence photos. None of
 * them depicts the real Semsem venue or menu. See public/images/CREDITS.md.
 */
export interface Asset {
  src: string;
  alt: string;
  width: number;
  height: number;
}

const a = (file: string, alt: string, width: number, height: number): Asset => ({
  src: `/images/${file}.webp`,
  alt,
  width,
  height,
});

export const assets = {
  // dishes (used by the demo menu)
  ful: a("ful", "طبق فول بالزيت", 1280, 1305),
  fulBowl: a("ful-bowl", "فول بالطحينة مع طعمية", 1100, 733),
  eggs: a("eggs", "بيض مسلوق", 1100, 732),
  falafel: a("falafel", "طبق طعمية", 1100, 735),
  falafelDip: a("falafel-dip", "طعمية بالطحينة", 1100, 1375),
  fries: a("fries", "بطاطس محمرة", 1100, 778),
  eggplantFried: a("eggplant-fried", "بتنجان مقلي", 1100, 733),
  eggplantGrilled: a("eggplant-grilled", "بتنجان مشوي بالطماطم", 1100, 733),
  baba: a("baba", "بابا غنوج مع عيش", 1100, 828),
  salad: a("salad", "سلطة خضرا", 1100, 1649),
  pickles: a("pickles", "مخلل", 1100, 1649),
  mintTea: a("mint-tea", "شاي بالنعناع", 1100, 1649),
  tea: a("tea", "شاي بيتصب من الإبريق", 1100, 1650),
  coffee: a("coffee", "قهوة", 1100, 1375),
  // atmosphere
  lantern: a("atmos-lantern", "فانوس مضوي في الضلمة", 1800, 2696),
  night: a("atmos-night", "ركن دافي مضوي بفانوس", 1800, 1262),
  tableHands: a("atmos-table", "إيدين بتتشارك أكل على سفرة", 1800, 2700),
  mezzeHands: a("atmos-mezze-hands", "إيد بتاخد لقمة من مقبلات", 1800, 2250),
  textile: a("atmos-textile", "فانوس على قماش مزخرف", 1800, 2400),
  pan: a("atmos-pan", "طبخ في حلّة كبيرة على نار", 1800, 2700),
  khayameya: a("khayamiya", "قماش خيامية مطرّز بالتطبيق", 1920, 3413),
} as const satisfies Record<string, Asset>;

export type AssetKey = keyof typeof assets;
