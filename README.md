# سمسم — Semsem

A Ramadan suhoor tent, as a website. Next.js (App Router) · TypeScript (strict) · Tailwind CSS v4 · Framer Motion · Supabase.

```bash
npm install
npm run dev      # development — noticeably slower and janky by nature
npm run preview  # production build + server: THIS is how to judge smoothness
npm run build && npm start
```

## The idea

The site is the tent. You arrive outside, in the dark, holding the only lantern — your cursor/finger lights the stitched
*khayameya* cloth. Scroll and the flaps part, warm light spills out, and you are inside. A "night clock" in the nav runs
from 11:00 pm to 4:30 am as you scroll; the page ends at dawn with the *musaharati's* drum.

| Section | File | What it does |
| --- | --- | --- |
| Entrance | `components/Hero.tsx` | Lantern-lit fabric (pointer / touch / idle drift), scroll-parted flaps |
| الحكاية | `components/Story.tsx` | Word-by-word light-up statement, doorway-shaped photo frame |
| **السفرة** (menu) | `components/SofraTable.tsx` | Round table in real CSS 3D perspective; drag / arrows / click-a-plate to rotate; the dish at your seat is lifted and described |
| Written menu | `components/MenuList.tsx` | Plain, no-motion alternative (toggle in the menu header) |
| السهرة | `components/Sahra.tsx` | Arch-clipped photo reveals with parallax |
| المكان | `components/Visit.tsx` | Only shows facts that exist in `site_settings`; otherwise "هنعلنها قريب" |
| Dawn | `components/Dawn.tsx` | Tap the drum (WebAudio thump) — each beat wakes the next line of the chant |

Scroll-linked motion (flaps, parallax, text lighting up) is always on — it is driven by the visitor's own scrolling. Only motion that plays by itself (idle lantern drift, steam, bunting sway, table spin-in/nudge) follows the OS "reduce motion" setting, and the nav has a toggle to override it.

## Replacing sample content

* **Photos** — `lib/assets.ts` is the single registry; drop new files in `public/images/` under the same names (or change the
  path). Credits for the temporary stock photos: `public/images/CREDITS.md`. They are illustrative, **not** the real venue.
* **Menu** — all demo dishes/prices live in `lib/data/demo-menu.ts` and are flagged `isDemo`. They are placeholders, not
  official. A yellow "منيو تجريبي" notice shows while any demo/sample content is on screen.
* **Copy** — Egyptian-Arabic copy is inline in each section component.

## Supabase

1. Create a project, then run `supabase/migrations/0001_init.sql` (SQL editor or `supabase db push`).
2. *(Optional)* run `supabase/seed.sql` for the demo rows (flagged `is_demo = true`).
3. Copy `.env.example` → `.env.local` and fill `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Edit rows in the Supabase dashboard — the page revalidates every 60 s. Set `menuIsSample` to `false` in
   `site_settings` and `is_demo = false` on real rows to remove the sample notice.

Tables: `menu_categories`, `menu_items` (price `numeric(10,2)`, nullable = "not announced"), `site_settings` (key/value JSON).
RLS: anon/authenticated can **read** visible categories, their items and settings; there are no write policies, so writes
require the dashboard or a trusted server using the service-role key (never shipped to the browser).
If credentials are missing or a query fails, `lib/data/menu.ts` falls back to the bundled demo menu.

Site settings keys: `menuIsSample`, `locationText`, `mapsUrl`, `hoursText`, `phone`, `whatsapp`, `instagram`.

## Brand system (proposed)

Colours (`app/globals.css`): ink `#0b0807` · cloth red `#9b2a1c` · ember `#d9692a` · lamp amber `#f2a93b` · cream `#f3e6cc`
· olive `#6b7a3e`. Type: Aref Ruqaa (display, echoes the Ruq'ah logo), IBM Plex Sans Arabic (body), Fraunces italic
(Latin accents). Motif: the stitched khayameya tile, `public/patterns/khayameya.svg`.
