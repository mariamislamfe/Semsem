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
| The fanous | `components/FanousHero.tsx`, `lib/fanousGL.ts` | a real photo of a fanous rendered through a small WebGL shader: the flame flickers, heat shimmers, the light spreads out as it is lit, and your pointer/finger is a second light that reveals the khayameya on the tent wall. Scrolling pushes into the lantern until its red glass becomes the tablecloth |
| السفرة | `components/Sofra.tsx` | the long Ramadan table: the section pins and a red runner travels right-to-left (Arabic reading direction); every dish is a plate that slides onto the cloth. A thread at the bottom shows progress and jumps between categories |
| ركن الشاي | `components/TeaCorner.tsx` | khayameya indigo; the kettle pours the drink you pick |
| القعدة | `components/Story.tsx` | photographs of the Ramadan night and a sentence that lights up word by word |
| احجز | `components/Reserve.tsx` | party size and a plan of the tent (floor seating vs tables) |
| Dawn | `components/Dawn.tsx` | the musaharati's drum and call |

**Motion stack:** GSAP (ScrollTrigger, SplitText, `useGSAP`) with Lenis driven from
GSAP's ticker, so pinned/scrubbed sections never fight smooth scrolling.

**Performance guards:** the shader caps its resolution and pauses off screen; if a
device can't hold ~30fps in its first seconds it fades itself out and the plain
photograph stays. Without WebGL the photograph is shown from the first paint.
Motion that plays by itself follows the OS reduce-motion setting (toggle in the
footer); with reduced motion the table becomes a plain written menu.

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
