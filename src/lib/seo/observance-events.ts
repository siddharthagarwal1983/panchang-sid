/**
 * schema.org Event nodes for festivals and Ekadashi vrats.
 *
 * head() runs during SSR where there is no user location, so dates are
 * computed for the default reference city (the same default the app ships
 * with). Results are memoised per year — the year-long scan is expensive.
 */
import { CITIES, DEFAULT_CITY_ID, type City } from "@/lib/panchang/cities";
import { scanFestivals } from "@/lib/panchang/festivals";
import { FESTIVAL_DETAILS } from "@/lib/panchang/festivalDetails";
import { ekadashiCalendar } from "@/lib/panchang/ekadashi";
import type { CalendarDay } from "@/lib/panchang/tz";
import { SITE_URL, eventSchema } from "./schema";

export const REFERENCE_CITY: City =
  CITIES.find((c) => c.id === DEFAULT_CITY_ID) ?? CITIES[0];

const REFERENCE_LOCATION = `${REFERENCE_CITY.name}, ${REFERENCE_CITY.state}, USA`;
const REFERENCE_ADDRESS = {
  addressLocality: REFERENCE_CITY.name,
  addressRegion: REFERENCE_CITY.state,
  addressCountry: "US",
};

function isoDate(day: CalendarDay): string {
  return `${day.year}-${String(day.month).padStart(2, "0")}-${String(day.day).padStart(2, "0")}`;
}

function daysInYear(year: number) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365;
}

const festivalCache = new Map<number, unknown[]>();
const ekadashiCache = new Map<number, unknown[]>();

/** Major festivals of `year` as Event nodes. */
export function festivalEventNodes(year: number): unknown[] {
  const cached = festivalCache.get(year);
  if (cached) return cached;

  const url = `${SITE_URL}/festivals/${year}`;
  const nodes: unknown[] = [];
  for (const day of scanFestivals({ year, month: 1, day: 1 }, daysInYear(year), REFERENCE_CITY)) {
    for (const f of day.festivals) {
      if (f.category !== "major" && f.category !== "solar") continue;
      nodes.push(
        eventSchema({
          name: f.name,
          description: FESTIVAL_DETAILS[f.id]?.about ?? f.note,
          startDate: isoDate(day.date),
          url,
          locationName: REFERENCE_LOCATION,
          address: REFERENCE_ADDRESS,
        }),
      );
    }
  }
  festivalCache.set(year, nodes);
  return nodes;
}

/** Ekadashi fasts of `year` as Event nodes, including the parana window. */
export function ekadashiEventNodes(year: number): unknown[] {
  const cached = ekadashiCache.get(year);
  if (cached) return cached;

  const url = `${SITE_URL}/vrats/ekadashi`;
  const nodes = ekadashiCalendar(year, REFERENCE_CITY).map((entry) =>
    eventSchema({
      name: entry.name,
      description: `${entry.paksha} paksha Ekadashi of ${entry.masa}. ${entry.parana.note} Parana on ${isoDate(entry.parana.date)}${
        entry.vriddhi ? ` (${entry.vriddhi} observance day)` : ""
      }.`,
      startDate: isoDate(entry.date),
      endDate: isoDate(entry.parana.date),
      url,
      locationName: REFERENCE_LOCATION,
      address: REFERENCE_ADDRESS,
    }),
  );
  ekadashiCache.set(year, nodes);
  return nodes;
}
