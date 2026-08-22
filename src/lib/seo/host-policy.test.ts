import { describe, expect, it } from "vitest";

import {
  CANONICAL_HOST,
  canonicalHostRedirect,
  isNonCanonicalHost,
  withNoindexOn404,
  withNoindexOnStagingHosts,
} from "./host-policy";

function req(url: string): Request {
  return new Request(url);
}

describe("canonicalHostRedirect", () => {
  it("301s panchanga.lovable.app to the canonical host, preserving path and query", () => {
    const res = canonicalHostRedirect(req("https://panchanga.lovable.app/vrats/ekadashi?year=2026"));
    expect(res?.status).toBe(301);
    expect(res?.headers.get("location")).toBe(
      "https://indianpanchang.com/vrats/ekadashi?year=2026",
    );
  });

  it("301s www.indianpanchang.com root to the bare canonical origin", () => {
    const res = canonicalHostRedirect(req("https://www.indianpanchang.com/"));
    expect(res?.status).toBe(301);
    expect(res?.headers.get("location")).toBe("https://indianpanchang.com/");
  });

  it.each(["/~oauth/initiate", "/~oauth/callback", "/api/public/health", "/mcp", "/.mcp/list-tools", "/.well-known/oauth-protected-resource", "/.lovable/x"])(
    "does not redirect machine/OAuth endpoint %s on a duplicate host",
    (path) => {
      expect(canonicalHostRedirect(req(`https://panchanga.lovable.app${path}`))).toBeUndefined();
    },
  );

  it("never redirects the canonical host itself", () => {
    expect(canonicalHostRedirect(req("https://indianpanchang.com/"))).toBeUndefined();
    expect(canonicalHostRedirect(req("https://indianpanchang.com/calendar"))).toBeUndefined();
  });

  it("returns undefined for malformed request URLs instead of throwing", () => {
    expect(canonicalHostRedirect(req("http://localhost/"))).toBeUndefined();
  });
});

describe("isNonCanonicalHost / withNoindexOnStagingHosts", () => {
  it("treats only the canonical host and localhost as canonical", () => {
    expect(isNonCanonicalHost(req(`https://${CANONICAL_HOST}/`))).toBe(false);
    expect(isNonCanonicalHost(req("http://localhost:8080/"))).toBe(false);
    expect(isNonCanonicalHost(req("http://127.0.0.1:8080/"))).toBe(false);
    expect(isNonCanonicalHost(req("https://id-preview--anything.lovable.app/"))).toBe(true);
    expect(isNonCanonicalHost(req("https://panchanga.lovable.app/"))).toBe(true);
  });

  it("adds X-Robots-Tag noindex,nofollow on staging hosts only", () => {
    const ok = () => new Response("ok", { status: 200 });
    const staging = withNoindexOnStagingHosts(req("https://id-preview--x.lovable.app/"), ok());
    expect(staging.headers.get("x-robots-tag")).toBe("noindex, nofollow");

    const canonical = withNoindexOnStagingHosts(req("https://indianpanchang.com/"), ok());
    expect(canonical.headers.get("x-robots-tag")).toBeNull();
  });
});

describe("withNoindexOn404", () => {
  it("marks 404 responses noindex and leaves 200s alone", () => {
    const notFound = withNoindexOn404(new Response("nope", { status: 404 }));
    expect(notFound.headers.get("x-robots-tag")).toBe("noindex, nofollow");

    const ok = withNoindexOn404(new Response("fine", { status: 200 }));
    expect(ok.headers.get("x-robots-tag")).toBeNull();
  });
});
