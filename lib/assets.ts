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
  heroFanous: a("hero-fanous", "فانوس رمضان مضوي على ترابيزة في الضلمة", 2200, 2940),
  khan: a("khan", "قهوة بلدي في خان الخليلي بالليل", 1800, 3200),
  tentNight: a("tent-night", "أطفال بالفوانيس قدام خيمة رمضان بالليل", 1800, 1200),
} as const satisfies Record<string, Asset>;

export type AssetKey = keyof typeof assets;

/** حيطة اللمة — illustrative open-licence photos, to be replaced by Semsem's own nights. */
export interface WallPhoto {
  src: string;
  alt: string;
  caption: string;
}

const w = (n: number, alt: string, caption: string): WallPhoto => ({ src: `/images/wall/w${String(n).padStart(2, "0")}.webp`, alt, caption });

export const wallPhotos: WallPhoto[] = [
  w(1, "شلة صحاب بيشربوا شاي في كوبايات إزاز", "الشلة كاملة"),
  w(2, "اتنين كبار بيشربوا شاي وبيضحكوا", "كوباية شاي وحكاية"),
  w(3, "عيلة قاعدة على الأرض حوالين سفرة", "سحور على الأرض"),
  w(4, "صحاب بيضحكوا على السفرة", "ضحكة من القلب"),
  w(5, "إيدين بتمد على سفرة الفطار", "اللمة الحلوة"),
  w(6, "راجل بيدعي قبل الأكل", "يا رب دايمًا متجمعين"),
  w(7, "إيدين كتير بتاخد تمر من طبق واحد", "من طبق واحد"),
  w(8, "إيدين بتتشارك أطباق على سفرة مليانة", "السفرة اتملت"),
  w(9, "عيلة بتجهز السفرة سوا", "كل واحد بإيده"),
  w(10, "اتنين صحاب بياخدوا سيلفي على السفرة", "صورة للذكرى"),
  w(11, "إيدين بتاكل من صينية رز", "لقمة هنية"),
  w(12, "حد بيصب عصير في كوباية", "واحد كمان؟"),
  w(13, "قهوة بالليل والناس قاعدة برا", "قعدة لحد الفجر"),
  w(14, "اتنين قاعدين على سفرة رمضان", "كل سنة وانتوا طيبين"),
  w(15, "قهوة بلدي في خان الخليلي بالليل", "زي زمان"),
  w(16, "أطفال بالفوانيس قدام خيمة رمضان", "فوانيس العيال"),
];
