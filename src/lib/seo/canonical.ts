import { SITE_URL } from "./schema";

/**
 * Single source of truth for canonical URLs.
 *
 * The app is reachable on several hosts (panchanga.lovable.app, preview
 * subdomains, www.indianpanchang.com), so every page must advertise the same
 * absolute canonical origin or Google will pick a duplicate host itself.
 */
export const CANONICAL_ORIGIN = SITE_URL;

/** Absolute canonical URL for a route path (`/`, `/calendar`, ...). */
export function canonicalUrl(path: string): string {
  if (!path || path === "/") return `${CANONICAL_ORIGIN}/`;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${CANONICAL_ORIGIN}${normalized.replace(/\/+$/, "")}`;
}

/** `links` entry for a route `head()`. */
export function canonicalLink(path: string) {
  return { rel: "canonical", href: canonicalUrl(path) } as const;
}

/** `og:url` meta entry for a route `head()`, always self-referencing. */
export function canonicalOgUrl(path: string) {
  return { property: "og:url", content: canonicalUrl(path) } as const;
}
