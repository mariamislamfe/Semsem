import { assets } from "@/lib/assets";
import type { CategoryWithItems } from "@/lib/types";

/**
 * DEMONSTRATION CONTENT ONLY.
 * These dishes, descriptions and prices are placeholders invented to show the
 * design. They are NOT Semsem's real menu and the prices are NOT official.
 * Replace via Supabase (see /supabase) once the owner supplies the real menu.
 */
interface RawItem {
  n: string;
  en?: string;
  d: string;
  p: number | null;
  img: keyof typeof assets | null;
  tags?: string[];
  off?: boolean;
}
interface RawCategory {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  blurbAr: string;
  sortOrder: number;
  items: RawItem[];
}

const raw: RawCategory[] = [
  {
    id: "c-ful",
    slug: "ful",
    nameAr: "الفول",
    nameEn: "Ful",
    blurbAr: "الفول هو الأساس.. اختار نوعك.",
    sortOrder: 1,
    items: [
      { n: "فول بالزيت الحار", en: "Ful medames", d: "فول مدمّس بالزيت والكمون وعصرة ليمون.", p: 25, img: "ful", tags: ["سحور", "ساخن", "الأشهر"] },
      { n: "فول بالطحينة", en: "Ful with tahini", d: "فول مدمّس بالطحينة وشوية زيت.", p: 30, img: "fulBowl", tags: ["سحور", "ساخن"] },
      { n: "فول بالبيض", en: "Ful with egg", d: "فول مدمّس جنبه بيض مسلوق.", p: 35, img: "eggs", tags: ["سحور", "ساخن"] },
      { n: "فول بالسمنة", en: "Ful with ghee", d: "فول مدمّس بالسمنة البلدي.", p: 35, img: "fulBowl", tags: ["سحور", "ساخن"], off: true },
    ],
  },
  {
    id: "c-taameya",
    slug: "taameya",
    nameAr: "الطعمية",
    nameEn: "Ta'ameya",
    blurbAr: "مقرمشة من بره، خضرا من جوه.",
    sortOrder: 2,
    items: [
      { n: "طعمية", en: "Ta'ameya", d: "أقراص طعمية مقرمشة من بره وخضرا من جوه.", p: 20, img: "falafel", tags: ["سحور", "ساخن", "الأشهر"] },
      { n: "طعمية بالطحينة", en: "Ta'ameya & tahini", d: "طعمية جنبها طبق طحينة.", p: 30, img: "falafelDip", tags: ["ساخن"] },
      { n: "ساندوتش طعمية", en: "Ta'ameya sandwich", d: "طعمية في عيش سخن مع سلطة.", p: 25, img: "falafel", tags: ["ساخن"] },
    ],
  },
  {
    id: "c-mezze",
    slug: "mezze",
    nameAr: "المقبلات",
    nameEn: "Mezze",
    blurbAr: "الحاجات اللي بتحلّي الطبق.",
    sortOrder: 3,
    items: [
      { n: "بابا غنوج", en: "Baba ghanoush", d: "بتنجان مشوي مهروس بالطحينة، مع عيش.", p: 35, img: "baba", tags: ["مقبلات"] },
      { n: "بتنجان مشوي بالطماطم", en: "Grilled eggplant", d: "بتنجان مشوي مع طماطم وتتبيلة.", p: 35, img: "eggplantGrilled", tags: ["ساخن"] },
      { n: "سلطة خضرا", en: "Green salad", d: "سلطة خضرا طازة.", p: 20, img: "salad", tags: ["بارد"] },
      { n: "مخلل", en: "Pickles", d: "طبق مخلل مشكّل.", p: 10, img: "pickles", tags: ["بارد"] },
    ],
  },
  {
    id: "c-fries",
    slug: "fries",
    nameAr: "البطاطس والمقلي",
    nameEn: "Fries & fried",
    blurbAr: "سخن وطالع من الزيت على طول.",
    sortOrder: 4,
    items: [
      { n: "بطاطس محمرة", en: "Fries", d: "بطاطس مقرمشة، تتاكل لوحدها أو جوه الساندوتش.", p: 25, img: "fries", tags: ["ساخن", "للتشارك"] },
      { n: "بتنجان مقلي", en: "Fried eggplant", d: "شرايح بتنجان مقلية.", p: 25, img: "eggplantFried", tags: ["ساخن"] },
    ],
  },
  {
    id: "c-drinks",
    slug: "drinks",
    nameAr: "المشروبات",
    nameEn: "Drinks",
    blurbAr: "كوباية تقعّدك ساعة زيادة.",
    sortOrder: 5,
    items: [
      { n: "شاي بالنعناع", en: "Mint tea", d: "شاي سخن بنعناع طازة.", p: 15, img: "mintTea", tags: ["ساخن"] },
      { n: "شاي", en: "Tea", d: "الشاي الأحمر بالطريقة الكلاسيكية.", p: 12, img: "tea", tags: ["ساخن"] },
      { n: "قهوة", en: "Coffee", d: "قهوة سادة أو مظبوط.", p: 25, img: "coffee", tags: ["ساخن"] },
      { n: "بيبسي", en: "Soda", d: "مشروب غازي بارد.", p: 15, img: null, tags: ["بارد"] },
    ],
  },
];

export const demoMenu: CategoryWithItems[] = raw.map((c) => ({
  id: c.id,
  slug: c.slug,
  nameAr: c.nameAr,
  nameEn: c.nameEn,
  blurbAr: c.blurbAr,
  sortOrder: c.sortOrder,
  items: c.items.map((i, idx) => ({
    id: `${c.id}-${idx}`,
    categoryId: c.id,
    nameAr: i.n,
    nameEn: i.en ?? null,
    descriptionAr: i.d,
    price: i.p,
    imageUrl: i.img ? assets[i.img].src : null,
    sortOrder: idx + 1,
    isAvailable: !i.off,
    tags: i.tags ?? [],
    isDemo: true,
  })),
}));
