/** Domain types shared by the data layer and the UI. */

export interface MenuCategory {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string | null;
  blurbAr: string | null;
  sortOrder: number;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  nameAr: string;
  nameEn: string | null;
  descriptionAr: string | null;
  /** In EGP. `null` means "price not announced yet". */
  price: number | null;
  /** Local path (`/images/..`) or a public Supabase Storage URL. */
  imageUrl: string | null;
  sortOrder: number;
  isAvailable: boolean;
  tags: string[];
  /** True for placeholder content that must be replaced by the real menu. */
  isDemo: boolean;
}

export interface CategoryWithItems extends MenuCategory {
  items: MenuItem[];
}

export interface MenuPayload {
  categories: CategoryWithItems[];
  source: "supabase" | "demo";
}

export interface SiteSettings {
  /** Shown whenever the menu on screen is placeholder content. */
  menuIsSample: boolean;
  locationText: string | null;
  mapsUrl: string | null;
  hoursText: string | null;
  phone: string | null;
  whatsapp: string | null;
  instagram: string | null;
}
