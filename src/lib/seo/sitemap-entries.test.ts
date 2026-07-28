import { describe, expect, it } from "vitest";
import {
  SITEMAP_ENTRIES,
  SITEMAP_EXCLUDE_PATTERNS,
  assertSitemapExcludesMachineRoutes,
  findExcludedSitemapPaths,
} from "./sitemap-entries";

describe("sitemap exclude guard", () => {
  it("contains no excluded routes", () => {
    expect(findExcludedSitemapPaths()).toEqual([]);
    expect(() => assertSitemapExcludesMachineRoutes()).not.toThrow();
  });

  it("flags machine-only and dynamic-param routes", () => {
    const bad = [
      { path: "/mcp" },
      { path: "/.mcp/list-tools" },
      { path: "/.well-known/oauth-protected-resource" },
      { path: "/.lovable/oauth/consent" },
      { path: "/festivals/$year" },
    ];
    expect(findExcludedSitemapPaths(bad, SITEMAP_EXCLUDE_PATTERNS)).toHaveLength(bad.length);
    expect(() => assertSitemapExcludesMachineRoutes(bad)).toThrow(/excluded routes/);
  });

  it("uses unique, absolute paths", () => {
    const paths = SITEMAP_ENTRIES.map((e) => e.path);
    expect(new Set(paths).size).toBe(paths.length);
    paths.forEach((p) => expect(p.startsWith("/")).toBe(true));
  });
});
