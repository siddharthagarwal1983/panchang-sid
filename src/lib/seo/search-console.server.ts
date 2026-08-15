/**
 * Google Search Console gateway client (server-only).
 *
 * Every call goes through the Lovable connector gateway, which injects the
 * workspace's OAuth token. Nothing here may be imported from client code.
 */

import { CANONICAL_ORIGIN } from "./canonical";

const GATEWAY = "https://connector-gateway.lovable.dev/google_search_console";

export interface SiteEntry {
  siteUrl: string;
  permissionLevel?: string;
}

export type SiteResolution =
  | { status: "selected"; siteUrl: string }
  | { status: "selection_required"; candidates: string[] };

function gatewayHeaders() {
  const lovableApiKey = process.env["LOVABLE_API_KEY"];
  const connectionApiKey = process.env["GOOGLE_SEARCH_CONSOLE_API_KEY"];
  if (!lovableApiKey || !connectionApiKey) {
    throw new Error(
      "Search Console is not connected for this project. Link the Google Search Console connector and try again.",
    );
  }
  return {
    Authorization: `Bearer ${lovableApiKey}`,
    "X-Connection-Api-Key": connectionApiKey,
  };
}

async function gateway<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${GATEWAY}${path}`, {
    ...init,
    headers: {
      ...gatewayHeaders(),
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers ?? {}),
    },
  });
  const text = await response.text();
  if (!response.ok) {
    console.error(`[search-console] ${path} failed [${response.status}]: ${text}`);
    if (response.status === 403) {
      throw new Error(
        "The connected Google account cannot access this Search Console property (403).",
      );
    }
    throw new Error(`Search Console request failed [${response.status}]: ${text}`);
  }
  return (text ? JSON.parse(text) : {}) as T;
}

function coversTarget(siteUrl: string, target: URL): boolean {
  if (siteUrl.startsWith("sc-domain:")) {
    const domain = siteUrl.slice("sc-domain:".length).toLowerCase();
    const host = target.hostname.toLowerCase();
    return host === domain || host.endsWith(`.${domain}`);
  }
  try {
    return target.href.startsWith(new URL(siteUrl).href);
  } catch {
    return false;
  }
}

/** Lists verified properties, then matches them against the canonical origin. */
export async function resolveSiteUrl(selectedSiteUrl?: string): Promise<SiteResolution> {
  const { siteEntry = [] } = await gateway<{ siteEntry?: SiteEntry[] }>("/webmasters/v3/sites");
  const target = new URL(`${CANONICAL_ORIGIN}/`);
  const matches = siteEntry
    .filter((entry) => entry.permissionLevel !== "siteUnverifiedUser" && coversTarget(entry.siteUrl, target))
    .map((entry) => entry.siteUrl);

  if (selectedSiteUrl) {
    if (!matches.includes(selectedSiteUrl)) {
      throw new Error("That Search Console property is not verified for this site.");
    }
    return { status: "selected", siteUrl: selectedSiteUrl };
  }
  if (matches.length === 0) {
    throw new Error(`No verified Search Console property covers ${CANONICAL_ORIGIN}.`);
  }
  if (matches.length === 1) return { status: "selected", siteUrl: matches[0]! };
  return { status: "selection_required", candidates: matches };
}

export interface InspectionSummary {
  url: string;
  verdict: string;
  coverageState: string;
  googleCanonical: string | null;
  userCanonical: string | null;
  canonicalOk: boolean;
  robotsTxtState: string | null;
  indexingState: string | null;
  lastCrawlTime: string | null;
  sitemaps: string[];
  error?: string;
}

interface InspectResponse {
  inspectionResult?: {
    indexStatusResult?: {
      verdict?: string;
      coverageState?: string;
      googleCanonical?: string;
      userCanonical?: string;
      robotsTxtState?: string;
      indexingState?: string;
      lastCrawlTime?: string;
      sitemap?: string[];
    };
  };
}

/** Reads Google's stored index/canonical verdict for one URL. */
export async function inspectUrl(siteUrl: string, inspectionUrl: string): Promise<InspectionSummary> {
  const data = await gateway<InspectResponse>("/v1/urlInspection/index:inspect", {
    method: "POST",
    body: JSON.stringify({ inspectionUrl, siteUrl }),
  });
  const r = data.inspectionResult?.indexStatusResult ?? {};
  const googleCanonical = r.googleCanonical ?? null;
  return {
    url: inspectionUrl,
    verdict: r.verdict ?? "UNKNOWN",
    coverageState: r.coverageState ?? "unknown",
    googleCanonical,
    userCanonical: r.userCanonical ?? null,
    canonicalOk: !googleCanonical || googleCanonical.startsWith(CANONICAL_ORIGIN),
    robotsTxtState: r.robotsTxtState ?? null,
    indexingState: r.indexingState ?? null,
    lastCrawlTime: r.lastCrawlTime ?? null,
    sitemaps: r.sitemap ?? [],
  };
}

export interface SitemapStatus {
  path: string;
  lastSubmitted: string | null;
  lastDownloaded: string | null;
  isPending: boolean | null;
  warnings: string | null;
  errors: string | null;
  submittedUrls: string | null;
  indexedUrls: string | null;
}

/** Resubmits the sitemap — the closest automatable equivalent of a re-crawl nudge. */
export async function submitSitemap(siteUrl: string, sitemapUrl: string): Promise<void> {
  await gateway(
    `/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps/${encodeURIComponent(sitemapUrl)}`,
    { method: "PUT" },
  );
}

export async function getSitemapStatus(siteUrl: string, sitemapUrl: string): Promise<SitemapStatus> {
  const data = await gateway<{
    path?: string;
    lastSubmitted?: string;
    lastDownloaded?: string;
    isPending?: boolean;
    warnings?: string;
    errors?: string;
    contents?: { submitted?: string; indexed?: string }[];
  }>(`/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps/${encodeURIComponent(sitemapUrl)}`);
  const contents = data.contents?.[0];
  return {
    path: data.path ?? sitemapUrl,
    lastSubmitted: data.lastSubmitted ?? null,
    lastDownloaded: data.lastDownloaded ?? null,
    isPending: data.isPending ?? null,
    warnings: data.warnings ?? null,
    errors: data.errors ?? null,
    submittedUrls: contents?.submitted ?? null,
    indexedUrls: contents?.indexed ?? null,
  };
}

export interface PerformanceRow {
  key: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

/** 28-day performance, grouped by the given dimension. */
export async function queryPerformance(
  siteUrl: string,
  dimension: "page" | "query",
  rowLimit = 10,
): Promise<PerformanceRow[]> {
  const end = new Date(Date.now() - 2 * 86_400_000);
  const start = new Date(end.getTime() - 27 * 86_400_000);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const data = await gateway<{
    rows?: { keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number }[];
  }>(`/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
    method: "POST",
    body: JSON.stringify({
      startDate: iso(start),
      endDate: iso(end),
      dimensions: [dimension],
      rowLimit,
    }),
  });
  return (data.rows ?? []).map((row) => ({
    key: row.keys?.[0] ?? "—",
    clicks: row.clicks ?? 0,
    impressions: row.impressions ?? 0,
    ctr: row.ctr ?? 0,
    position: row.position ?? 0,
  }));
}
