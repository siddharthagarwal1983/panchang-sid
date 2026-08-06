import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Structural guards: these sections must stay behind an auth check. They are
 * asserted on source so a refactor that drops the gate fails CI even though the
 * pages themselves are too heavy (ephemeris maths + router) to render in jsdom.
 */
const home = readFileSync("src/routes/index.tsx", "utf8");
const calendar = readFileSync("src/routes/calendar.tsx", "utf8");

/** Extract the source between a marker and its closing `)}` of a `{isSignedIn && (` block. */
function signedInBlocks(source: string): string[] {
  const blocks: string[] = [];
  const re = /isSignedIn \? \(|isSignedIn && \(/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source))) {
    let depth = 1;
    let i = re.lastIndex;
    for (; i < source.length && depth > 0; i++) {
      if (source[i] === "(") depth++;
      else if (source[i] === ")") depth--;
    }
    blocks.push(source.slice(re.lastIndex, i));
  }
  return blocks;
}

function gateBodies(source: string): string[] {
  const bodies: string[] = [];
  const parts = source.split("<SignInGate");
  for (const part of parts.slice(1)) {
    const end = part.indexOf("</SignInGate>");
    if (end !== -1) bodies.push(part.slice(0, end));
  }
  return bodies;
}

describe("home page auth gating", () => {
  const blocks = signedInBlocks(home);
  const gated = gateBodies(home);

  it("derives the gate from the session, not local state", () => {
    expect(home).toContain('import { useAuth } from "@/lib/auth"');
    expect(home).toContain("const isSignedIn = Boolean(useAuth().user)");
  });

  it("keeps previous/next day navigation signed-in only", () => {
    expect(blocks.some((b) => b.includes('aria-label="Previous day"'))).toBe(true);
    expect(blocks.some((b) => b.includes('aria-label="Next day"'))).toBe(true);
    expect(blocks.some((b) => b.includes("Back to today"))).toBe(true);
  });

  it("keeps the tithi today and auspicious times links signed-in only", () => {
    expect(blocks.some((b) => b.includes('to="/tithi-today"'))).toBe(true);
    expect(blocks.some((b) => b.includes("tithi today"))).toBe(true);
    expect(blocks.some((b) => b.includes("auspicious times"))).toBe(true);
  });

  it("keeps the muhurta window tiles inside a SignInGate", () => {
    expect(gated.some((b) => b.includes("Auspicious and inauspicious windows today"))).toBe(true);
    expect(gated.some((b) => b.includes("Upcoming Hindu festivals"))).toBe(true);
  });

  it("never renders public sections from protected data", () => {
    // The sunrise banner and tithi hero must sit outside every gate.
    for (const body of gated) {
      expect(body).not.toContain("local sunrise");
      expect(body).not.toContain("MoonGlyph");
    }
  });
});

describe("calendar page auth gating", () => {
  const blocks = signedInBlocks(calendar);
  const gated = gateBodies(calendar);

  it("derives the gate from the session", () => {
    expect(calendar).toContain("const isSignedIn = Boolean(useAuth().user)");
  });

  it("keeps the selected-date detail card signed-in only", () => {
    expect(blocks.some((b) => b.includes("selectedEntry"))).toBe(true);
    expect(blocks.some((b) => b.includes("Open full panchang"))).toBe(true);
  });

  it("keeps the monthly festival list behind the SignInGate", () => {
    expect(gated.some((b) => b.includes("Festivals this month"))).toBe(true);
  });

  it("still renders the month grid publicly", () => {
    const grid = calendar.slice(0, calendar.indexOf("<SignInGate"));
    expect(grid).toContain('aria-label="Previous month"');
    expect(grid).toContain("grid-cols-7");
  });
});
