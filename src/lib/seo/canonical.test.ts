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
      (f) => !readFileSync(join(ROUTES_DIR, f), "utf8").includes('rel: "canonical"'),
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
          // src/server.ts owns the duplicate-host redirect list.
          if (p.endsWith("src/server.ts") || p.endsWith("canonical.test.ts")) continue;
          if (src.includes(DUPLICATE_HOST)) offenders.push(p);
        }
      }
    };
    walk(join(process.cwd(), "src"));
    expect(offenders).toEqual([]);
  });
});
