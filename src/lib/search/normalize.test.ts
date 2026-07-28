import { describe, it, expect } from "vitest";
import { foldSearch, matchesQuery, matchRank } from "@/lib/search/normalize";

describe("foldSearch", () => {
  it("folds the brand name to ASCII", () => {
    expect(foldSearch("Panchāṅga")).toBe("panchanga");
  });
  it("folds the full IAST set", () => {
    expect(foldSearch("Kṛṣṇa Śukla Ṣaṣṭhī Ekādaśī ṁ ḥ ḍ ṭ ṇ")).toBe(
      "krsna sukla sasthi ekadasi m h d t n",
    );
  });
  it("folds non-decomposing latin", () => {
    expect(foldSearch("Zürich Ålesund Malmö Gdańsk København")).toBe(
      "zurich alesund malmo gdansk kobenhavn",
    );
  });
  it("collapses punctuation", () => {
    expect(foldSearch("Panchāṅga-2026!")).toBe("panchanga 2026");
  });
});

describe("matchesQuery", () => {
  it("matches panchang against Panchāṅga", () => {
    expect(matchesQuery("Panchāṅga", "panchang")).toBe(true);
    expect(matchesQuery("Panchāṅga", "PANCHANGA")).toBe(true);
    expect(matchesQuery("Panchāṅga", "panchāṅga")).toBe(true);
    expect(matchesQuery("Panchāṅga", "panch")).toBe(true);
  });
  it("matches accented city names typed plainly", () => {
    expect(matchesQuery("Zürich, Switzerland", "zurich")).toBe(true);
    expect(matchesQuery("Bengalūru, India", "bengaluru")).toBe(true);
  });
  it("requires all tokens", () => {
    expect(matchesQuery("San Jose, United States", "san jose")).toBe(true);
    expect(matchesQuery("San Jose, United States", "san tokyo")).toBe(false);
  });
  it("rejects non-matches", () => {
    expect(matchesQuery("Panchāṅga", "calendar")).toBe(false);
  });
});

describe("matchRank", () => {
  it("orders exact before prefix before substring", () => {
    expect(matchRank("Panchāṅga", "panchanga")).toBe(0);
    expect(matchRank("Panchāṅga daily", "panchanga")).toBe(1);
    expect(matchRank("My Panchāṅga", "panchanga")).toBe(2);
  });
});
