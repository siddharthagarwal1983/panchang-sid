import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Throws unless the caller holds the admin role. */
async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) {
    console.error("[search-console] role lookup failed", error);
    throw new Error("Could not verify your access.");
  }
  if (!data) throw new Error("Forbidden: admin access required.");
}

/** Verified property + sitemap health + canonical verdict for every key URL. */
export const getSearchConsoleStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ siteUrl: z.string().max(300).optional() }).parse(data ?? {}))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    const { CANONICAL_ORIGIN } = await import("./canonical");
    const { KEY_PATHS } = await import("./key-urls");
    const sc = await import("./search-console.server");

    const resolution = await sc.resolveSiteUrl(data.siteUrl);
    if (resolution.status === "selection_required") return { ...resolution } as const;

    const { siteUrl } = resolution;
    const sitemapUrl = `${CANONICAL_ORIGIN}/sitemap.xml`;

    const sitemap = await sc.getSitemapStatus(siteUrl, sitemapUrl).catch((err: Error) => ({
      path: sitemapUrl,
      lastSubmitted: null,
      lastDownloaded: null,
      isPending: null,
      warnings: null,
      errors: err.message,
      submittedUrls: null,
      indexedUrls: null,
    }));

    const inspections = [];
    for (const path of KEY_PATHS) {
      const url = `${CANONICAL_ORIGIN}${path === "/" ? "/" : path}`;
      try {
        inspections.push(await sc.inspectUrl(siteUrl, url));
      } catch (err) {
        inspections.push({
          url,
          verdict: "ERROR",
          coverageState: "unknown",
          googleCanonical: null,
          userCanonical: null,
          canonicalOk: false,
          robotsTxtState: null,
          indexingState: null,
          lastCrawlTime: null,
          sitemaps: [],
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return {
      status: "ok" as const,
      siteUrl,
      canonicalOrigin: CANONICAL_ORIGIN,
      sitemap,
      inspections,
      checkedAt: new Date().toISOString(),
    };
  });

/** Inspects a single arbitrary URL on the canonical host. */
export const inspectSearchConsoleUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ url: z.string().url().max(500), siteUrl: z.string().max(300).optional() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    const { CANONICAL_ORIGIN } = await import("./canonical");
    const sc = await import("./search-console.server");
    if (!data.url.startsWith(CANONICAL_ORIGIN)) {
      throw new Error(`Only ${CANONICAL_ORIGIN} URLs can be inspected.`);
    }
    const resolution = await sc.resolveSiteUrl(data.siteUrl);
    if (resolution.status === "selection_required") return { ...resolution } as const;
    return { status: "ok" as const, inspection: await sc.inspectUrl(resolution.siteUrl, data.url) };
  });

/**
 * Resubmits the sitemap. Google exposes no public API for the "Request
 * indexing" button, so this is the strongest automatable re-crawl signal.
 */
export const requestRecrawl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ siteUrl: z.string().max(300).optional() }).parse(data ?? {}))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    const { CANONICAL_ORIGIN } = await import("./canonical");
    const sc = await import("./search-console.server");
    const resolution = await sc.resolveSiteUrl(data.siteUrl);
    if (resolution.status === "selection_required") return { ...resolution } as const;
    const sitemapUrl = `${CANONICAL_ORIGIN}/sitemap.xml`;
    await sc.submitSitemap(resolution.siteUrl, sitemapUrl);
    return { status: "ok" as const, sitemapUrl, submittedAt: new Date().toISOString() };
  });

/** Top pages / queries for the last 28 complete days. */
export const getSearchPerformance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z.object({ dimension: z.enum(["page", "query"]).default("page"), siteUrl: z.string().max(300).optional() }).parse(data ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    const sc = await import("./search-console.server");
    const resolution = await sc.resolveSiteUrl(data.siteUrl);
    if (resolution.status === "selection_required") return { ...resolution } as const;
    return {
      status: "ok" as const,
      dimension: data.dimension,
      rows: await sc.queryPerformance(resolution.siteUrl, data.dimension, 15),
    };
  });
