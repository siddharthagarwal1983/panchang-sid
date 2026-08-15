# Amavasya & Purnima pages (pilot)

Target the US searches India-based panchang sites answer wrong: "is it amavasya today in usa", "when is amavasya this month", "amavasya <month> 2026". These are the same date-and-timing question the parana page already ranks around position 5 for, so the pilot reuses that page's proven shape.

## Scope of the pilot

Three new crawlable pages:

1. `/vrats/amavasya` — hub: is it Amavasya today, the next Amavasya date, its exact local start and end times, and the next few occurrences.
2. `/vrats/purnima` — same layout for full moon.
3. `/vrats/amavasya/2026/september` — one monthly page as the template proof before scaling to all months and years.

Each page:
- Server-renders real dates and times for the reference US city (Edison, NJ), then recomputes for the visitor's own city after load, exactly like the parana page.
- Meta title and description built from those same real dates, so the search snippet carries a concrete answer.
- FAQ block plus Article, Event, FAQPage and Breadcrumb structured data.
- Self-referencing canonical from the shared canonical helper.
- Cross-links: hub to month page, month page back to hub, and hub linked from the Ekadashi parana page so the new pages inherit crawl paths.

Not in this pilot: all 24 monthly pages, Purnima monthly pages, per-date pages. Those come after the template is confirmed working.

## Technical notes

- New `src/lib/panchang/newmoon-fullmoon.ts` computing Amavasya/Purnima tithi windows for a city from the existing sidereal engine, mirroring `ekadashi-day.ts`.
- New `src/lib/panchang/tithi-snapshot.ts` (or an extension of `parana-snapshot.ts`) for the cached reference-city snapshot used during server render.
- Routes: `src/routes/vrats.amavasya.index.tsx`, `src/routes/vrats.purnima.index.tsx`, `src/routes/vrats.amavasya.$year.$month.tsx`.
- Add the three paths to `SITEMAP_ENTRIES` in `src/lib/seo/sitemap-entries.ts`; the existing build guard and tests keep the sitemap valid.
- Reuse `AppHeader`, `FaqSection`, `canonicalLink`/`canonicalOgUrl`, and the schema helpers in `src/lib/seo/schema.ts`.
- Verify in the preview that both hub pages render real times in the server HTML (view-source, not just the browser view).
