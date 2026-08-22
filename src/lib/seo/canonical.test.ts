import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { canonicalUrl } from "./canonical";

const ROUTES_DIR = join(process.cwd(), "src/routes");

/** Page routes that intentionally have no canonical tag (root shell, OAuth UI). */
const EXEMPT = new Set(["__root.tsx", "[.]lovable.oauth.consent.tsx"]);

function pageRouteFiles(): string[] {
  return readdirSync(ROUTES_DIR).filter((f) => f.endsWith(".tsx") && !EXEMPT.has(f));
}

const DUPLICATE_HOST = ["lovable", "app"].join(".");

describe("canonical strategy", () => {
  it("builds absolute URLs on the custom domain", () => {
    expect(canonicalUrl("/")).toBe("https://indianpanchang.com/");
    expect(canonicalUrl("/calendar")).toBe("https://indianpanchang.com/calendar");
    expect(canonicalUrl("calendar/")).toBe("https://indianpanchang.com/calendar");
  });

  it("declares a canonical link on every page route", () => {
    const missing = pageRouteFiles().filter(
      (f) => {
        const src = readFileSync(join(ROUTES_DIR, f), "utf8");
        return !src.includes('rel: "canonical"') && !src.includes("canonicalLink(");
      },
    );
    expect(missing).toEqual([]);
  });

  it("never references a duplicate host in app source", () => {
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const p = join(dir, entry.name);
        if (entry.isDirectory()) walk(p);
        else if (/\.(ts|tsx)$/.test(entry.name) && entry.name !== "routeTree.gen.ts") {
          const src = readFileSync(p, "utf8");
          // host-policy.ts owns the duplicate-host redirect list (imported by
          // src/server.ts); its test file references the duplicate host on purpose.
          if (
            p.endsWith("src/server.ts") ||
            p.endsWith("host-policy.ts") ||
            p.endsWith("host-policy.test.ts") ||
            p.endsWith("canonical.test.ts")
          )
            continue;
          if (src.includes(DUPLICATE_HOST)) offenders.push(p);
        }
      }
    };
    walk(join(process.cwd(), "src"));
    expect(offenders).toEqual([]);
  });
  it("builds every canonical and og:url from the shared origin constant", () => {
    // Guards against a template hardcoding a host or a relative URL: each
    // canonical/og:url expression must come from canonicalLink/canonicalUrl or
    // the SITE_URL constant, all of which resolve to indianpanchang.com.
    const offenders: string[] = [];
    for (const f of pageRouteFiles()) {
      const src = readFileSync(join(ROUTES_DIR, f), "utf8");
      const expressions = [
        ...src.matchAll(/rel: "canonical", href: ([^}]+)}/g),
        ...src.matchAll(/property: "og:url", content: ([^}]+)}/g),
      ].map((m) => m[1]);
      for (const expr of expressions) {
        const ok = /SITE_URL|canonicalUrl|canonicalLink|canonicalOgUrl|\bURL\b|\burl\b/.test(expr);
        if (!ok) offenders.push(`${f}: ${expr.trim()}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("serves the sitemap from the same canonical origin", () => {
    const src = readFileSync(join(ROUTES_DIR, "sitemap[.]xml.ts"), "utf8");
    expect(src).toContain("const BASE_URL = CANONICAL_ORIGIN;");
    expect(src).not.toMatch(/const BASE_URL = "/);
  });
});
