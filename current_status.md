# Current Status

Persistent snapshot of what this repo is and where it stands. Update this
file (don't just append) whenever the picture materially changes; use
`session.md` for the chronological log of individual work sessions.

_Last updated: 2026-08-16 (post OAuth-redirect fix + SEO 404 audit)_

## What this is

A Panchang (Hindu lunisolar calendar) website and MCP-connected app —
Vedic dates, tithis, muhurats, festivals, vrats (fasting observances) —
targeted mainly at US-based Hindu diaspora users searching for accurate
local-time panchang info. Built and maintained via **Lovable**
(lovable.dev), synced bidirectionally with this git repo.

## Stack

- **Framework:** TanStack Start (React 19, file-based routing via
  `@tanstack/react-router`, SSR)
- **Styling:** Tailwind CSS v4 + shadcn/ui (Radix primitives) in
  `src/components/ui`
- **Backend:** Supabase (Postgres + Auth), client in
  `src/integrations/supabase/`, migrations in `supabase/migrations/`
- **Astronomy:** `astronomy-engine` npm package powers sidereal calculations
  in `src/lib/panchang/` (core panchang math, ephemeris, choghadiya,
  ekadashi, moon phase, festivals, vrat logic, city/geocode/timezone
  handling)
- **Package manager:** Bun (`bun.lock`, `bunfig.toml`) though `package-lock.json`
  also present — check which is authoritative before installing
- **Testing:** Vitest (unit, e.g. `src/lib/**/*.test.ts`), Playwright/Python
  screenshot-based responsive tests in `tests/responsive/`, gating tests in
  `tests/gating/`
- **MCP:** This app itself exposes an MCP server (`src/routes/mcp.ts`,
  `src/routes/[.mcp]/`, `src/lib/mcp/`) with tools like `get-panchang`,
  `list-festivals`, `get-my-settings` — likely for AI agent / assistant
  integrations reading panchang data.

## Structure map

- `src/routes/` — file-based routes. Key pages:
  - `index.tsx` — homepage
  - `calendar.tsx`, `tithi-today.tsx`, `muhurat.choghadiya.tsx`,
    `compare.ephemeris.tsx`
  - `festivals.$year.tsx`
  - `vrats.ekadashi.*` — Ekadashi hub, year/month/day pages, parana (fast-breaking
    time) page — this is the most fully built-out vrat vertical
  - `vrats.amavasya.*`, `vrats.purnima.*` — newer, pilot stage (see
    `.lovable/plan/amavasya-purnima-pages-pilot-2026-08-15.md`)
  - `reminders.tsx`, `settings.tsx`, `feedback.tsx`, `auth.tsx`,
    `admin.search-console.tsx`
  - `sitemap[.]xml.ts` — dynamic sitemap driven by
    `src/lib/seo/sitemap-entries.ts`
  - `mcp.ts` + `[.mcp]/` + `[.well-known]/` — MCP server + OAuth protected
    resource metadata
- `src/lib/panchang/` — core domain logic (astronomy, tithi/nakshatra/yoga
  calculations, festivals, vrats, timezone/city handling). This is the
  heart of the app.
- `src/lib/seo/` — canonical URLs, structured data (schema.org via
  `schema.ts`), sitemap entries, Search Console API integration
  (`search-console.server.ts`, `search-console.functions.ts`,
  route `admin.search-console.tsx`)
- `src/lib/mcp/` — MCP tool implementations
- `src/integrations/supabase/` — Supabase client (browser + server) and
  auth middleware/attacher
- `src/integrations/lovable/` — Lovable platform integration
- `src/components/ui/` — shadcn/ui component library
- `supabase/migrations/` — 7 migrations so far (as of 2026-08-16)
- `scripts/` — `generate-ekadashi-dates.ts` (precomputes Ekadashi dates,
  output likely feeds `src/lib/seo/ekadashi-dates.generated.ts`),
  `request-reindex.mjs` (search engine reindex trigger, `npm run reindex`)
- `tests/responsive/` — visual regression screenshots across many device
  breakpoints (iPhone SE/12/14/Pro Max, Galaxy S9+/Fold, Pixel 5/7) with
  safe-area-inset variants (notch, landscape-notch, none)
- `tests/gating/` — `protected-sections.test.ts` (auth/access gating checks)

## Current focus (as of last commits)

Recent commit history shows active work on:
1. **SEO / organic growth** — canonical URL enforcement, Search Console
   API integration, sitemap correctness, structured data — clearly the
   primary growth lever right now.
2. **Vrat pages expansion** — Ekadashi is mature (day/month/year/parana
   pages); Amavasya/Purnima pages are a new pilot (per the Lovable plan
   doc) targeting US-specific searches ("is it amavasya today in usa")
   that India-based competitor panchang sites answer with Indian local
   time instead of US local time — this is the app's competitive wedge.
3. **Snapshot/muhurat features** — Rahu Kaal snapshot *data layer* exists
   (`src/lib/panchang/kaal-snapshot.ts`) but its route was never finished
   (see Open items).
4. **Indexing/canonical hygiene (2026-08-16)** — fixed a `src/server.ts`
   bug that was 301-redirecting the Lovable OAuth broker path
   (`/~oauth/*`) cross-origin, which broke Google sign-in and also caused
   Google to hold `panchanga.lovable.app` as the homepage's canonical
   instead of `indianpanchang.com`. Also hardened 404 pages with an
   `X-Robots-Tag: noindex` header (TanStack's per-route `head()` doesn't
   run for routes that threw `notFound()`, so this couldn't be done via
   meta tags alone). Reindex requested; verification pending (see Open
   items).

## Open items / things to verify next session

- **Pending:** scheduled cloud routine `trig_01B7nwvs8BJNMrSiF6qcv9EA` fires
  2026-08-19T10:00Z to confirm Google Search Console now shows
  `indianpanchang.com` (not `panchanga.lovable.app`) as the canonical for
  the homepage, after the `/~oauth` redirect fix + manual reindex request
  on 2026-08-16. Check its run log after that date.
- `src/routeTree.gen.ts` and `package-lock.json` show local dev drift
  (route-import reordering, extra devDependencies not in the committed
  lockfile) whenever `npm`/`vite dev` runs locally — this predates this
  session and reappears each time the dev server starts. Likely a bun vs
  npm split (repo has both `bun.lock` and `package-lock.json`); harmless
  but don't commit it blindly — verify it's not masking a real dependency
  change first.
- Canonical-URL construction is inconsistent: `src/lib/seo/canonical.ts`'s
  `canonicalUrl()`/`canonicalLink()` helpers are the documented "single
  source of truth," but `index.tsx`, `muhurat.choghadiya.tsx`,
  `tithi-today.tsx`, and all `vrats.ekadashi.*` routes hand-build
  `${SITE_URL}/path` locally instead. Same output today, but a latent risk
  if canonicalization logic ever changes. Not yet fixed.
- `/muhurat/rahu-kaal` is referenced only implicitly (root `keywords` meta
  targets "rahu kaal"; `src/lib/panchang/kaal-snapshot.ts` data layer
  exists) but the route itself was never built despite a commit titled
  "Added Rahu Kaal snapshot route." No broken links exist since nothing
  links to it yet — just an unfinished opportunity.
- Amavasya/Purnima pilot (per plan doc) explicitly excludes: all 24 monthly
  pages, Purnima monthly pages, and per-date pages — those are follow-on
  work once the pilot template is confirmed working in production.

## Conventions observed

- This repo is Lovable-connected: **never force-push, rebase, or amend
  already-pushed commits** — it desyncs the Lovable editor's project
  history (see `AGENTS.md`).
- New vrat pages should reuse the existing shared building blocks:
  `AppHeader`, `FaqSection`, `canonicalLink`/`canonicalOgUrl` (from
  `src/lib/seo/canonical.ts`), and schema helpers in `src/lib/seo/schema.ts`,
  and register new paths in `SITEMAP_ENTRIES`
  (`src/lib/seo/sitemap-entries.ts`).
- Server-rendered pages should show real computed dates/times in the raw
  HTML (view-source check, not just browser-rendered check) — this is
  called out explicitly as a verification step for SEO-critical pages.
