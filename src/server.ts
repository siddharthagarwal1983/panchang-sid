import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

// Static font files under /fonts are content-hashed (or version-pinned subsets)
// and never change in place, so they can be cached for a year. fonts.css itself
// is a small manifest — cache it for a day and let it revalidate.
function withStaticAssetCaching(request: Request, response: Response): Response {
  if (request.method !== "GET" && request.method !== "HEAD") return response;
  if (!response.ok) return response;
  let pathname: string;
  try {
    pathname = new URL(request.url).pathname;
  } catch {
    return response;
  }

  let cacheControl: string | undefined;
  if (/^\/fonts\/.+\.woff2?$/.test(pathname)) {
    cacheControl = "public, max-age=31536000, immutable";
  } else if (/^\/(favicon\.(ico|png)|app-icon-\d+\.png|manifest\.webmanifest)$/.test(pathname)) {
    cacheControl = "public, max-age=604800";
  }
  if (!cacheControl) return response;

  const headers = new Headers(response.headers);
  headers.set("cache-control", cacheControl);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// Google picked https://panchanga.lovable.app/ as the canonical for the site,
// splitting indexing across hosts. Send every duplicate host to the custom
// domain with a permanent redirect so only one origin is indexable.
const CANONICAL_HOST = "indianpanchang.com";
const DUPLICATE_HOSTS = new Set(["panchanga.lovable.app", "www.indianpanchang.com"]);
// Machine-only endpoints (MCP / OAuth discovery) must keep responding on their host.
const NO_REDIRECT_PREFIXES = ["/mcp", "/.mcp", "/.well-known", "/.lovable", "/api"];

function canonicalHostRedirect(request: Request): Response | undefined {
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

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const redirect = canonicalHostRedirect(request);
      if (redirect) return redirect;
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      const normalized = await normalizeCatastrophicSsrResponse(response);
      return withStaticAssetCaching(request, normalized);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
