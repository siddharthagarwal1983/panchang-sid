/**
 * Single source of truth for the sitemap. Imported by the /sitemap.xml route
 * and by the build-time guard in vite.config.ts.
 */

export interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

/**
 * Machine-only endpoints (JSON APIs / OAuth flows) and non-indexable routes.
 * Anything matching these patterns must NEVER appear in the sitemap — listing
 * them produced 401/JSON crawl errors. They are also blocked in robots.txt.
 */
export const SITEMAP_EXCLUDE_PATTERNS: RegExp[] = [
  /^\/mcp(\/|$)/,
  /^\/\.mcp(\/|$)/,
  /^\/\.well-known(\/|$)/,
  /^\/\.lovable(\/|$)/,
  /^\/api(\/|$)/,
  /^\/sitemap\.xml$/,
  /^\/not-found$/,
  /\$/, // un-substituted dynamic params
  /\*/, // splat routes
];

export const SITEMAP_ENTRIES: SitemapEntry[] = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/calendar", changefreq: "daily", priority: "0.9" },
  { path: "/tithi-today", changefreq: "daily", priority: "0.9" },
  { path: "/muhurat/choghadiya", changefreq: "daily", priority: "0.8" },
  { path: "/vrats/ekadashi", changefreq: "weekly", priority: "0.8" },
  { path: "/festivals/2026", changefreq: "monthly", priority: "0.8" },
  { path: "/festivals/2027", changefreq: "monthly", priority: "0.8" },
  { path: "/vrats/ekadashi/parana", changefreq: "daily", priority: "0.9" },
  ...[2026, 2027].flatMap((year) => [
    { path: `/vrats/ekadashi/${year}`, changefreq: "weekly" as const, priority: "0.8" },
    ...[
      "january",
      "february",
      "march",
      "april",
      "may",
      "june",
      "july",
      "august",
      "september",
      "october",
      "november",
      "december",
    ].map((month) => ({
      path: `/vrats/ekadashi/${year}/${month}`,
      changefreq: "monthly" as const,
      priority: "0.6",
    })),
  ]),
  // /auth, /settings, /reminders and /feedback are account-only utility pages
  // marked noindex — keeping them out of the sitemap avoids "Excluded by
  // noindex" reports and concentrates crawl budget on content pages.
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
];

/** Returns the list of violations (empty array = sitemap is clean). */
export function findExcludedSitemapPaths(
  entries: SitemapEntry[] = SITEMAP_ENTRIES,
  patterns: RegExp[] = SITEMAP_EXCLUDE_PATTERNS,
): { path: string; pattern: string }[] {
  const violations: { path: string; pattern: string }[] = [];
  for (const entry of entries) {
    for (const pattern of patterns) {
      if (pattern.test(entry.path)) {
        violations.push({ path: entry.path, pattern: String(pattern) });
        break;
      }
    }
  }
  return violations;
}

/** Throws when the sitemap contains an excluded route. Used as a build gate. */
export function assertSitemapExcludesMachineRoutes(
  entries: SitemapEntry[] = SITEMAP_ENTRIES,
  patterns: RegExp[] = SITEMAP_EXCLUDE_PATTERNS,
): void {
  const violations = findExcludedSitemapPaths(entries, patterns);
  if (violations.length > 0) {
    throw new Error(
      "Sitemap contains excluded routes:\n" +
        violations.map((v) => `  - ${v.path} (matches ${v.pattern})`).join("\n") +
        "\nRemove them from SITEMAP_ENTRIES in src/lib/seo/sitemap-entries.ts.",
    );
  }
}
