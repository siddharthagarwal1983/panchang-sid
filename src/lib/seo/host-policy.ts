/**
 * Host canonicalization policy — single source of truth for which hosts may
 * serve indexable content and how duplicates are collapsed.
 *
 * Extracted from src/server.ts so the behavior is unit-testable without
 * booting the server. src/server.ts must import from here, and
 * scripts/check-canonical.mjs asserts the same rules against the live site.
 */

export const CANONICAL_HOST = "indianpanchang.com";

// Google picked https://panchanga.lovable.app/ as the canonical for the site,
// splitting indexing across hosts. Every duplicate host is sent to the custom
// domain with a permanent redirect so only one origin is indexable.
export const DUPLICATE_HOSTS = new Set(["panchanga.lovable.app", "www.indianpanchang.com"]);

// Machine-only endpoints (MCP / OAuth discovery) must keep responding on their host.
// /~oauth is the Lovable Cloud Auth broker: its initiate/callback pair must stay on
// the origin that started the flow, otherwise the popup's web_message response is
// cross-origin and the session is never set.
export const NO_REDIRECT_PREFIXES = ["/mcp", "/.mcp", "/.well-known", "/.lovable", "/api", "/~oauth"];

/** 301 to the canonical host when the request hits a known duplicate host. */
export function canonicalHostRedirect(request: Request): Response | undefined {
  let url: URL;
  try {
    url = new URL(request.url);
  } catch {
    return undefined;
  }
  if (!DUPLICATE_HOSTS.has(url.hostname)) return undefined;
  if (NO_REDIRECT_PREFIXES.some((p) => url.pathname === p || url.pathname.startsWith(`${p}/`))) {
    return undefined;
  }
  url.protocol = "https:";
  url.hostname = CANONICAL_HOST;
  url.port = "";
  return new Response(null, { status: 301, headers: { location: url.toString() } });
}

/**
 * Any host other than the canonical domain (platform preview subdomains, the
 * publish host when the edge serves it directly, ad-hoc hostnames) must never
 * be indexed. The redirect above covers known duplicates; this marks every
 * remaining non-canonical host explicitly noindex so Google cannot pick one
 * as the site's canonical.
 */
export function isNonCanonicalHost(request: Request): boolean {
  try {
    const { hostname } = new URL(request.url);
    if (hostname === CANONICAL_HOST) return false;
    if (hostname === "localhost" || hostname === "127.0.0.1") return false;
    return true;
  } catch {
    return false;
  }
}

export function withNoindexOnStagingHosts(request: Request, response: Response): Response {
  if (!isNonCanonicalHost(request)) return response;
  const headers = new Headers(response.headers);
  headers.set("x-robots-tag", "noindex, nofollow");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// TanStack's per-route head() doesn't run for the route that threw notFound()
// (only the root's static head applies), so bad dynamic-param URLs like
// /vrats/ekadashi/2099/january render with no noindex meta despite the
// correct 404 status. The X-Robots-Tag header is Google's HTTP-level
// equivalent of the meta tag and doesn't depend on what the head renders.
export function withNoindexOn404(response: Response): Response {
  if (response.status !== 404) return response;
  const headers = new Headers(response.headers);
  headers.set("x-robots-tag", "noindex, nofollow");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
