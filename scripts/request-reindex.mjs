#!/usr/bin/env node
/**
 * Post-deploy re-indexing helper for https://indianpanchang.com
 *
 * What it does (in order):
 *   1. Fetches the live sitemap and asserts every <loc> is on the canonical host.
 *   2. Resubmits the sitemap to Google Search Console (tells Google to re-crawl it).
 *   3. Runs URL Inspection on the key URLs and prints Google's current
 *      index/canonical verdict for each one.
 *
 * Note: Google exposes no public API for "Request indexing" (the button in the
 * Search Console UI). Sitemap resubmission + inspection is the closest
 * automatable equivalent; the script prints a ready-to-paste list of any URL
 * that still needs a manual request.
 *
 * Usage:
 *   LOVABLE_API_KEY=... GOOGLE_SEARCH_CONSOLE_API_KEY=... node scripts/request-reindex.mjs
 * Optional:
 *   GSC_SITE_URL=https://indianpanchang.com/   (skip auto-resolution)
 */

const ORIGIN = "https://indianpanchang.com";
const SITEMAP_URL = `${ORIGIN}/sitemap.xml`;
const GATEWAY = "https://connector-gateway.lovable.dev/google_search_console";

/** Highest-value URLs, in the order they should be re-crawled. */
const KEY_PATHS = [
  "/",
  "/vrats/ekadashi/parana",
  "/vrats/ekadashi",
  "/tithi-today",
  "/calendar",
  "/muhurat/choghadiya",
  "/vrats/ekadashi/2026",
  "/vrats/ekadashi/2027",
  "/festivals/2026",
  "/festivals/2027",
];

const lovableApiKey = process.env.LOVABLE_API_KEY;
const connectionApiKey = process.env.GOOGLE_SEARCH_CONSOLE_API_KEY;
if (!lovableApiKey || !connectionApiKey) {
  console.error(
    "Missing LOVABLE_API_KEY and/or GOOGLE_SEARCH_CONSOLE_API_KEY. " +
      "Link the Google Search Console connector, then re-run.",
  );
  process.exit(1);
}
const headers = {
  Authorization: `Bearer ${lovableApiKey}`,
  "X-Connection-Api-Key": connectionApiKey,
};

async function gateway(path, init = {}) {
  const res = await fetch(`${GATEWAY}${path}`, {
    ...init,
    headers: { ...headers, ...(init.body ? { "Content-Type": "application/json" } : {}), ...init.headers },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Search Console request failed [${res.status}] ${path}: ${text}`);
  return text ? JSON.parse(text) : {};
}

function coversTarget(siteUrl, target) {
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

async function resolveSiteUrl() {
  if (process.env.GSC_SITE_URL) return process.env.GSC_SITE_URL;
  const { siteEntry = [] } = await gateway("/webmasters/v3/sites");
  const target = new URL(`${ORIGIN}/`);
  const matches = siteEntry
    .filter((e) => e.permissionLevel !== "siteUnverifiedUser" && coversTarget(e.siteUrl, target))
    .map((e) => e.siteUrl);
  if (matches.length === 0) throw new Error(`No verified Search Console property covers ${ORIGIN}`);
  if (matches.length > 1) {
    throw new Error(
      `Multiple verified properties cover ${ORIGIN}:\n  ${matches.join("\n  ")}\n` +
        "Re-run with GSC_SITE_URL set to the one you want.",
    );
  }
  return matches[0];
}

async function verifySitemapHosts() {
  const res = await fetch(SITEMAP_URL, { headers: { "cache-control": "no-cache" } });
  if (!res.ok) throw new Error(`Could not fetch ${SITEMAP_URL} [${res.status}]`);
  const xml = await res.text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const offenders = locs.filter((u) => !u.startsWith(`${ORIGIN}/`));
  if (offenders.length) {
    throw new Error(`Sitemap lists non-canonical URLs:\n  ${offenders.join("\n  ")}`);
  }
  console.log(`✓ Sitemap OK — ${locs.length} URLs, all on ${ORIGIN}`);
  return locs;
}

async function resubmitSitemap(siteUrl) {
  await gateway(
    `/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps/${encodeURIComponent(SITEMAP_URL)}`,
    { method: "PUT" },
  );
  console.log(`✓ Resubmitted ${SITEMAP_URL} to ${siteUrl}`);
}

async function inspect(siteUrl, inspectionUrl) {
  const data = await gateway("/v1/urlInspection/index:inspect", {
    method: "POST",
    body: JSON.stringify({ inspectionUrl, siteUrl }),
  });
  const r = data.inspectionResult?.indexStatusResult ?? {};
  return {
    url: inspectionUrl,
    verdict: r.verdict ?? "UNKNOWN",
    coverage: r.coverageState ?? "unknown",
    googleCanonical: r.googleCanonical ?? "—",
    lastCrawl: r.lastCrawlTime ?? "never",
  };
}

async function main() {
  await verifySitemapHosts();
  const siteUrl = await resolveSiteUrl();
  console.log(`Using property: ${siteUrl}`);
  await resubmitSitemap(siteUrl);

  const needsManual = [];
  for (const path of KEY_PATHS) {
    const url = `${ORIGIN}${path}`;
    try {
      const r = await inspect(siteUrl, url);
      const canonicalOk = r.googleCanonical === "—" || r.googleCanonical.startsWith(ORIGIN);
      console.log(
        `${r.verdict === "PASS" && canonicalOk ? "✓" : "•"} ${path}\n` +
          `    verdict=${r.verdict} coverage=${r.coverage}\n` +
          `    google canonical=${r.googleCanonical} lastCrawl=${r.lastCrawl}`,
      );
      if (r.verdict !== "PASS" || !canonicalOk) needsManual.push(url);
    } catch (err) {
      console.error(`! ${path}: ${err.message}`);
      needsManual.push(url);
    }
  }

  if (needsManual.length) {
    console.log(
      "\nStill not indexed on the canonical host — paste each into Search Console → " +
        "URL Inspection → Request indexing:\n" +
        needsManual.map((u) => `  ${u}`).join("\n"),
    );
  } else {
    console.log("\nAll key URLs are indexed on the canonical host.");
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
