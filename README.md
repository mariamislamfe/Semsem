# سمسم — Semsem

A Ramadan suhoor tent, as a website. Next.js (App Router) · TypeScript (strict) · Tailwind CSS v4 · Framer Motion · Supabase.

```bash
npm install
npm run dev      # development — noticeably slower and janky by nature
npm run preview  # production build + server: THIS is how to judge smoothness
npm run build && npm start
```

## The idea

The venue is black; the only colour in it comes from the fanous and the khayameya
cloth. The site is built from exactly that.

| Moment | File | What it does |
| --- | --- | --- |
| The door | `components/CurtainHero.tsx` | two khayameya curtains cut into strips that fold like real pleats (CSS 3D accordion). The name is printed on the cloth, so it folds and splits with it; the curtain breathes, ripples under your pointer/finger, and gathers to the sides as you scroll to reveal the lit fanous inside |
| الصينية (menu) | `components/Sofra.tsx` | categories on top; the chosen one arrives on an arc-shaped copper tray, dishes sliding along the curve. Swipe/drag or arrows to turn it; the last stop asks «عايز حاجة تانية؟» |
| قول للقهوجي | `components/TeaCorner.tsx` | build your tea the Egyptian way (كشري/فتلة, light/strong, sugar spoons, mint): the glass changes live and the order phrase writes itself; it is added to the order with that note |
| القعدة | `components/Story.tsx` | a photograph of the Ramadan night and a sentence that lights up word by word |
| احجز | `components/Reserve.tsx` | party size and a plan of the tent (floor seating vs tables) |
| Dawn | `components/Dawn.tsx` | the musaharati's drum and call |

**Motion stack:** GSAP (ScrollTrigger, SplitText, `useGSAP`) with Lenis driven from
GSAP's ticker, so pinned/scrubbed sections never fight smooth scrolling.

**Performance:** everything that moves is a transform or opacity; the curtain writes ~14–22 strip transforms per frame only while the door is on screen. Motion that plays by itself (breathing curtain, steam, flame) follows the OS reduce-motion setting (toggle in the footer).

**Fonts:** Aref Ruqaa (display, matches the Ruq'ah logo) and Alexandria (body, by
Egyptian type designer Mohamed Gaber).

Run `npm run preview` (production build) to judge smoothness; `npm run dev` is much slower.

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
