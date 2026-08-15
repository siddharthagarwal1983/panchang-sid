/**
 * Amavasya (new moon) and Purnima (full moon) days with their exact local tithi
 * windows.
 *
 * Like Ekadashi, the observance day is the day whose *local sunrise* falls
 * inside the tithi (udaya tithi), which is why the US date often differs from
 * an India-printed panchang.
 */
import { computeDaySummary, getTithi } from "./core";
import type { City } from "./cities";
import { MASA_NAMES } from "./names";
import { addDays, zonedToUtc, type CalendarDay } from "./tz";

export type MoonPhaseKind = "amavasya" | "purnima";

export type MoonPhaseEntry = {
  kind: MoonPhaseKind;
  /** Local calendar day carrying the tithi at sunrise. */
  date: CalendarDay;
  /** e.g. "Shravana Amavasya". */
  name: string;
  masa: string;
  sunrise: Date | null;
  /** Tithi window in real time. */
  start: Date;
  end: Date;
};

export const PHASE_LABEL: Record<MoonPhaseKind, string> = {
  amavasya: "Amavasya",
  purnima: "Purnima",
};

/** Tithi numbers worth a full day computation for each phase. */
const CANDIDATES: Record<MoonPhaseKind, number[]> = {
  amavasya: [29, 30, 1],
  purnima: [14, 15, 16],
};

/** Cheap pre-filter: tithi number around local morning, no rise/set search. */
function morningTithiNumber(date: CalendarDay, tz: string): number {
  return getTithi(zonedToUtc(date.year, date.month, date.day, 6, 30, tz)).number;
}

/** Amavasya / Purnima days starting at `from`, scanning `days` local days. */
export function scanMoonPhases(
  from: CalendarDay,
  days: number,
  city: City,
  kind: MoonPhaseKind,
): MoonPhaseEntry[] {
  const entries: MoonPhaseEntry[] = [];
  const seen = new Set<number>();
  const wanted = PHASE_LABEL[kind];
  let cursor: CalendarDay = from;

  for (let i = 0; i < days; i += 1) {
    if (CANDIDATES[kind].includes(morningTithiNumber(cursor, city.tz))) {
      const summary = computeDaySummary(cursor, city);
      if (summary.tithiName === wanted) {
        const reference = summary.sunrise ?? zonedToUtc(cursor.year, cursor.month, cursor.day, 6, 30, city.tz);
        const tithi = getTithi(reference);
        // A tithi covering two sunrises must only produce one entry.
        if (!seen.has(tithi.start.getTime())) {
          seen.add(tithi.start.getTime());
          const masa =
            MASA_NAMES[kind === "purnima" ? summary.purnimantaIndex : summary.amantaIndex];
          entries.push({
            kind,
            date: cursor,
            name: `${masa} ${wanted}`,
            masa,
            sunrise: summary.sunrise,
            start: tithi.start,
            end: tithi.end,
          });
        }
      }
    }
    cursor = addDays(cursor, 1);
  }

  return entries;
}

/** Every Amavasya / Purnima falling in a local calendar year. */
export function moonPhaseCalendar(
  year: number,
  city: City,
  kind: MoonPhaseKind,
): MoonPhaseEntry[] {
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  return scanMoonPhases({ year, month: 1, day: 1 }, isLeap ? 366 : 365, city, kind);
}
