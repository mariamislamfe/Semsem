# سمسم — Semsem

A Ramadan suhoor tent, as a website. Next.js (App Router) · TypeScript (strict) · Tailwind CSS v4 · Framer Motion · Supabase.

```bash
npm install
npm run dev      # development — noticeably slower and janky by nature
npm run preview  # production build + server: THIS is how to judge smoothness
npm run build && npm start
```

## The idea — one continuous shot

The site is a single camera move through one night. You stand in a lane hung with
Ramadan flags; the only light on the closed tent is the lantern you carry (your
cursor / finger). Scroll and the flaps part, warm light spills into the lane, you
walk the hall under the khayameya ceiling, and lower yourself onto the table until
you are looking straight down at the cloth — which is where the menu begins.

| Moment | File | What it does |
| --- | --- | --- |
| Arrival (3D) | `components/tent/TentCanvas.tsx`, `components/tent/Arrival.tsx` | three.js scene: lane, flags, facade, hall, tables; camera on a Catmull-Rom path driven by scroll; the carried lantern is a real point light |
| Fallback | `components/Hero.tsx`, `components/Journey.tsx` | the earlier CSS version, used automatically when WebGL is unavailable or the device is very weak |
| السفرة (menu) | `components/SofraTable.tsx`, `components/MenuSection.tsx` | the menu begins on the same tablecloth the camera landed on; categories are plates, tap one and its range opens |
| ركن الشاي | `components/TeaCorner.tsx` | kettle on the fire, pick a drink and the glass fills |
| الحكاية | `components/Story.tsx` | a quiet typographic room |
| احجز | `components/Reserve.tsx` | party size, and a plan of the tent to choose floor vs table |
| Dawn | `components/Dawn.tsx` | the musaharati's drum and call |

**Honesty note:** the 3D tent is a *conceptual interpretation* of a Ramadan tent
entrance. It is not a reconstruction of the real Semsem venue (no venue references
were available). Replace its materials/layout once real photographs exist.

Scroll-linked motion (the shot itself) is always on — it is driven by the visitor's
own scrolling. Motion that plays by itself (idle lantern, steam, flame, sway) follows
the OS "reduce motion" setting, with a toggle in the nav.

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
