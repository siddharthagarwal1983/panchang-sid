#!/usr/bin/env node
/**
 * Live redirect & canonical regression check for https://indianpanchang.com
 *
 * Hard failures (exit 1):
 *   - https://panchanga.lovable.app/ and https://www.indianpanchang.com/ must
 *     redirect (3xx) to the canonical host, path preserved. Note: the hosting
 *     edge issues this redirect before app code runs and currently answers
 *     302; the app's own 301 in src/lib/seo/host-policy.ts only executes if
 *     the edge ever passes the request through. A non-permanent status is a
 *     warning, not a failure.
 *   - https://indianpanchang.com/ must return 200 with a self-referencing
 *     <link rel="canonical"> and og:url, and must NOT carry an
 *     X-Robots-Tag: noindex header.
 *   - The preview host must serve pages with X-Robots-Tag: noindex, nofollow
 *     (exercises the app-level staging-host guard on a host the edge does
 *     not redirect).
 *
 * Soft check (warning only): when LOVABLE_API_KEY and
 * GOOGLE_SEARCH_CONSOLE_API_KEY are set, the script also runs URL Inspection
 * on the homepage and prints Google's stored googleCanonical. Google's verdict
 * lags reality by days-to-weeks, so a stale duplicate-canonical verdict is
 * reported but does not fail the run. Pass --strict-google to make it fail.
 *
 * Usage:
 *   node scripts/check-canonical.mjs [--strict-google]
 */

const ORIGIN = "https://indianpanchang.com";
const PREVIEW_ORIGIN = "https://id-preview--3f14832f-36e0-4210-bd04-e2b64a8fb096.lovable.app";
const GATEWAY = "https://connector-gateway.lovable.dev/google_search_console";
const STRICT_GOOGLE = process.argv.includes("--strict-google");

let failures = 0;
const ok = (msg) => console.log(`✓ ${msg}`);
const fail = (msg) => {
  failures += 1;
  console.error(`✗ ${msg}`);
};
const warn = (msg) => console.log(`• ${msg}`);

async function expectRedirect(from, toPath = "/") {
  const res = await fetch(from, { redirect: "manual" });
  const location = res.headers.get("location") ?? "";
  const expectedPrefix = `${ORIGIN}${toPath}`;
  if ([301, 302, 307, 308].includes(res.status) && location.startsWith(expectedPrefix)) {
    ok(`${from} → ${res.status} ${location}`);
    if (res.status !== 301 && res.status !== 308) {
      warn(
        `  ${from} used ${res.status} (temporary). The hosting edge issues this redirect ` +
          "before app code runs; the app's own 301 in host-policy.ts is the fallback. " +
          "A permanent redirect would be stronger for SEO, but the target is correct.",
      );
    }
  } else {
    fail(`${from} returned ${res.status} location=${location || "—"} (expected 3xx → ${expectedPrefix})`);
  }
}

async function expectPreviewNoindex() {
  const res = await fetch(`${PREVIEW_ORIGIN}/`, { redirect: "manual" });
  const robots = res.headers.get("x-robots-tag") ?? "";
  if (/noindex/.test(robots) && /nofollow/.test(robots)) {
    ok(`${PREVIEW_ORIGIN}/ → ${res.status} with X-Robots-Tag: ${robots}`);
  } else {
    fail(`${PREVIEW_ORIGIN}/ missing X-Robots-Tag noindex,nofollow (got: ${robots || "none"}, status ${res.status})`);
  }
}

async function checkCanonicalHomepage() {
  const res = await fetch(`${ORIGIN}/`, { headers: { "cache-control": "no-cache" } });
  if (!res.ok) {
    fail(`${ORIGIN}/ returned ${res.status}`);
    return;
  }
  const robots = res.headers.get("x-robots-tag");
  if (robots && /noindex/i.test(robots)) {
    fail(`${ORIGIN}/ carries X-Robots-Tag: ${robots} — the canonical host must be indexable`);
  } else {
    ok(`${ORIGIN}/ 200 with no noindex header`);
  }

  const html = await res.text();
  const canonical = html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i)?.[1];
  const ogUrl = html.match(/<meta[^>]+property="og:url"[^>]+content="([^"]+)"/i)?.[1];
  if (canonical === `${ORIGIN}/`) ok(`<link rel="canonical"> = ${canonical}`);
  else fail(`canonical link is ${canonical ?? "missing"} (expected ${ORIGIN}/)`);
  if (ogUrl === `${ORIGIN}/`) ok(`og:url = ${ogUrl}`);
  else fail(`og:url is ${ogUrl ?? "missing"} (expected ${ORIGIN}/)`);
}

async function reportGoogleVerdict() {
  const lovableApiKey = process.env.LOVABLE_API_KEY;
  const connectionApiKey = process.env.GOOGLE_SEARCH_CONSOLE_API_KEY;
  if (!lovableApiKey || !connectionApiKey) {
    warn("LOVABLE_API_KEY / GOOGLE_SEARCH_CONSOLE_API_KEY not set — skipping URL Inspection.");
    return;
  }
  const headers = { Authorization: `Bearer ${lovableApiKey}`, "X-Connection-Api-Key": connectionApiKey };
  const sitesRes = await fetch(`${GATEWAY}/webmasters/v3/sites`, { headers });
  if (!sitesRes.ok) {
    warn(`Could not list Search Console properties [${sitesRes.status}] — skipping URL Inspection.`);
    return;
  }
  const { siteEntry = [] } = await sitesRes.json();
  const target = new URL(`${ORIGIN}/`);
  const match = siteEntry.find(
    (e) =>
      e.permissionLevel !== "siteUnverifiedUser" &&
      (e.siteUrl.startsWith("sc-domain:")
        ? target.hostname === e.siteUrl.slice(10) || target.hostname.endsWith(`.${e.siteUrl.slice(10)}`)
        : target.href.startsWith(e.siteUrl)),
  );
  if (!match) {
    warn("No verified Search Console property covers the canonical origin — skipping URL Inspection.");
    return;
  }
  const inspRes = await fetch(`${GATEWAY}/v1/urlInspection/index:inspect`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ inspectionUrl: `${ORIGIN}/`, siteUrl: match.siteUrl }),
  });
  if (!inspRes.ok) {
    warn(`URL Inspection failed [${inspRes.status}] — ${await inspRes.text()}`);
    return;
  }
  const r = (await inspRes.json()).inspectionResult?.indexStatusResult ?? {};
  const googleCanonical = r.googleCanonical ?? "—";
  console.log(
    `Google index verdict for ${ORIGIN}/:\n` +
      `  verdict=${r.verdict ?? "UNKNOWN"} coverage=${r.coverageState ?? "unknown"}\n` +
      `  googleCanonical=${googleCanonical} lastCrawl=${r.lastCrawlTime ?? "never"}`,
  );
  const canonicalOk = googleCanonical === "—" || googleCanonical.startsWith(`${ORIGIN}/`);
  if (canonicalOk) {
    ok("Google's chosen canonical is on the canonical host.");
  } else if (STRICT_GOOGLE) {
    fail(`googleCanonical is still ${googleCanonical} — duplicate-canonical verdict has not cleared.`);
  } else {
    warn(
      `googleCanonical is still ${googleCanonical}. Google's verdict lags the fix; ` +
        "this is a warning unless --strict-google is passed.",
    );
  }
}

async function main() {
  await expectRedirect("https://panchanga.lovable.app/");
  await expectRedirect("https://panchanga.lovable.app/vrats/ekadashi", "/vrats/ekadashi");
  await expectRedirect("https://www.indianpanchang.com/");
  await expectPreviewNoindex();
  await checkCanonicalHomepage();
  await reportGoogleVerdict();

  if (failures) {
    console.error(`\n${failures} check(s) failed.`);
    process.exit(1);
  }
  console.log("\nAll redirect/canonical checks passed.");
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
