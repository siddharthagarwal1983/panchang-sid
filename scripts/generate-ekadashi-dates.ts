import { ekadashiCalendar } from "../src/lib/panchang/ekadashi";
import { REFERENCE_CITY } from "../src/lib/panchang/parana-snapshot";
import { MONTHS } from "../src/lib/seo/ekadashi-pages";
const rows: string[] = [];
for (const y of [2026, 2027]) {
  for (const e of ekadashiCalendar(y, REFERENCE_CITY)) {
    const slug = MONTHS[e.date.month - 1].slug;
    rows.push(
      `  { year: ${e.date.year}, month: ${e.date.month}, day: ${e.date.day}, monthSlug: "${slug}", name: ${JSON.stringify(e.name)}, paksha: "${e.paksha}", masa: ${JSON.stringify(e.masa)}${e.vriddhi ? `, vriddhi: "${e.vriddhi}"` : ""} },`,
    );
  }
}
const out = `/**
 * Generated list of Ekadashi dates for the reference city (see
 * src/lib/panchang/parana-snapshot.ts). Used to validate per-date routes and to
 * build the sitemap without running the ephemeris at request time.
 *
 * Regenerate with: bun scripts/generate-ekadashi-dates.ts (dates shift by at most a day for
 * far-west cities; the page itself recomputes for the visitor's location).
 */
export type EkadashiDateStub = {
  year: number;
  month: number;
  day: number;
  monthSlug: string;
  name: string;
  paksha: "Shukla" | "Krishna";
  masa: string;
  vriddhi?: "smarta" | "vaishnava";
};

export const EKADASHI_DATES: EkadashiDateStub[] = [
${rows.join("\n")}
];
`;
await Bun.write("src/lib/seo/ekadashi-dates.generated.ts", out);
console.log("rows", rows.length);
