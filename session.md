# Session Log

Running log of work sessions on this repo. Newest entry on top. Each entry:
what was worked on, why, and what changed.

---

## 2026-08-16 — Google sign-in fix, SEO audit, 404 hardening, indexing check

**Who:** Claude Code (assistant), with Siddharth Agarwal.

**What happened:**
- Diagnosed "404 on clicking Google sign-in": the button redirects to
  `/~oauth/initiate`, a path only served by Lovable's own hosting edge (not
  the app itself). 404s in plain local `vite dev` are expected — that path
  simply doesn't exist off Lovable's infra. Confirmed local dev must fall
  back to email/password sign-in, or use the Lovable preview / deployed
  site for Google sign-in.
- Explored replacing the Lovable-managed OAuth call with a direct
  `supabase.auth.signInWithOAuth({ provider: "google" })` call in
  `src/routes/auth.tsx` — implemented, then **reverted** on request. Not in
  the repo.
- Root-caused the *actual* deployed-site bug via Lovable's own agent
  (`send_message`): `src/server.ts`'s canonical-host redirect was 301-ing
  `panchanga.lovable.app/~oauth/*` → `indianpanchang.com`, breaking the
  OAuth broker's origin-locked `web_message` handoff. Fixed by adding
  `/~oauth` to `NO_REDIRECT_PREFIXES` (commit `1e93129`, via Lovable
  agent). Published to `panchanga.lovable.app` via the Lovable connector's
  `deploy_project`.
- Ran a full SEO audit of the site's URLs: sitemap generation, canonical
  logic, `robots.txt`, and per-route `head()` meta — plus live `curl`
  checks against a local dev server for both valid and invalid routes.
  Sitemap/canonical/robots.txt all came back clean. Found one real defect:
  pages that `throw notFound()` (bad Ekadashi/Amavasya/festival year-month
  params) returned the correct HTTP 404 but with **no `<title>` and no
  `noindex` meta** — TanStack's per-route `head()` doesn't run for a route
  that threw `notFound()`, only the root's static `head()` applies.
- **Fixed** the 404 meta gap: `src/server.ts` now sets
  `X-Robots-Tag: noindex, nofollow` on any 404 response (mirrors the
  existing `withNoindexOnStagingHosts` pattern), and
  `src/routes/__root.tsx`'s `NotFoundComponent` sets `document.title`
  client-side. Verified via curl against a running dev server. Not yet
  committed at time of writing — see below.
- Flagged (not fixed): highest-priority pages (`index.tsx`,
  `muhurat.choghadiya.tsx`, `tithi-today.tsx`, all `vrats.ekadashi.*`
  routes) hand-build canonical URLs via `${SITE_URL}/path` instead of the
  shared `canonicalUrl()`/`canonicalLink()` helper in
  `src/lib/seo/canonical.ts` — currently harmless (same underlying
  constant) but a latent inconsistency worth consolidating later.
- Flagged (not fixed): `public keywords meta` targets "rahu kaal" but no
  `/muhurat/rahu-kaal` route exists — `src/lib/panchang/kaal-snapshot.ts`
  (the data layer) was built in a prior session but the route itself never
  was, despite a commit titled "Added Rahu Kaal snapshot route." Nothing
  links to it, so no broken link currently, just an unfinished SEO
  opportunity.
- Ran `scripts/request-reindex.mjs` via the Lovable agent (needs
  `LOVABLE_API_KEY`/`GOOGLE_SEARCH_CONSOLE_API_KEY`, only present in
  Lovable's cloud runtime, not local `.env`). Sitemap resubmitted
  successfully (113 URLs, all canonical). 9/10 key URLs `PASS` and
  indexed correctly. The homepage (`/`) was `NEUTRAL` — Google still had
  `panchanga.lovable.app` as its stored canonical, crawled before the
  `/~oauth` redirect fix. User manually clicked "Request indexing" for
  `https://indianpanchang.com/` in Search Console the same day
  (2026-08-16).
- Created a one-time scheduled cloud routine (`trig_01B7nwvs8BJNMrSiF6qcv9EA`,
  fires 2026-08-19T10:00Z / 3:30pm IST) that re-inspects the homepage URL
  via the Lovable agent and reports whether Google's canonical has flipped
  to `indianpanchang.com`. Link:
  https://claude.ai/code/routines/trig_01B7nwvs8BJNMrSiF6qcv9EA — result
  lands in that routine's own run log, not automatically in this
  conversation; ask in a future session to have it checked and relayed.

**Changed:** `src/server.ts`, `src/routes/__root.tsx` (404 noindex +
title fix), `session.md`, `current_status.md`.

**Follow-ups:**
- Check the scheduled routine above after 2026-08-19 and confirm the
  homepage's Google canonical is fixed.
- Consider consolidating the canonical-URL construction inconsistency
  flagged above.
- Consider finishing `/muhurat/rahu-kaal` (data layer already exists) or
  removing "rahu kaal" from the root keywords meta if it's not getting
  built soon.

---

## 2026-08-16 — Repo onboarding

**Who:** Claude Code (assistant), with Siddharth Agarwal.

**What happened:** First pass understanding the full repo structure and
purpose (see `current_status.md` for the persistent summary). No code
changes made. Added `session.md` and `current_status.md` for tracking
future sessions.

**Notes:**
- Working tree had uncommitted changes at session start: `package-lock.json`
  and `src/routeTree.gen.ts` (both modified, untracked to this session —
  likely local dev artifacts from `npm i` / route generation, not touched).
- Repo is Lovable-connected (see `AGENTS.md`): avoid rewriting published
  git history (no force-push, no amend/rebase of pushed commits) since it
  syncs bidirectionally with the Lovable editor.
- Last real commit before this session: `1274e6b Added Rahu Kaal snapshot route`.

---

<!--
Template for new entries:

## YYYY-MM-DD — Short title

**Who:** (assistant / user, if relevant)

**What happened:** What was done and why.

**Changed:** Key files/routes touched.

**Follow-ups:** Anything left open for next session.
-->
