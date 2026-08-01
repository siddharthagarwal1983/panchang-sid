/**
 * Annual Ekadashi calendar with local parana (fast-breaking) windows.
 *
 * The vrat day is the day whose *local sunrise* falls inside Ekadashi tithi
 * (udaya tithi). Parana is taken the next morning, after sunrise, inside
 * Dwadashi, and after Hari Vasara (the first quarter of Dwadashi) has passed.
 */
import { computeDaySummary, getTithi } from "./core";
import type { City } from "./cities";
import { MASA_NAMES } from "./names";
import { addDays, zonedToUtc, type CalendarDay } from "./tz";

export type EkadashiEntry = {
  /** Local calendar day of the fast. */
  date: CalendarDay;
  name: string;
  paksha: "Shukla" | "Krishna";
  masa: string;
  sunrise: Date | null;
  /** When the Ekadashi tithi ends. */
  tithiEnd: Date;
  parana: {
    date: CalendarDay;
    start: Date | null;
    end: Date | null;
    /** Explanation of what limits the window. */
    note: string;
  };
  /** Set when two consecutive sunrises fall in Ekadashi (vriddhi). */
  vriddhi?: "smarta" | "vaishnava";
};

/** Ekadashi names keyed by purnimanta month index, the conventional reckoning. */
const EKADASHI_NAMES: Record<string, [shukla: string, krishna: string]> = {
  Chaitra: ["Kamada", "Papmochani"],
  Vaishakha: ["Mohini", "Varuthini"],
  Jyeshtha: ["Nirjala", "Apara"],
  Ashadha: ["Devshayani", "Yogini"],
  Shravana: ["Shravana Putrada", "Kamika"],
  Bhadrapada: ["Parsva (Parivartini)", "Aja"],
  Ashwina: ["Papankusha", "Indira"],
  Kartika: ["Devutthana (Prabodhini)", "Rama"],
  Margashirsha: ["Mokshada", "Utpanna"],
  Pausha: ["Pausha Putrada (Vaikuntha)", "Saphala"],
  Magha: ["Jaya", "Shattila"],
  Phalguna: ["Amalaki", "Vijaya"],
};

function ekadashiName(masa: string, paksha: "Shukla" | "Krishna", adhika: boolean) {
  if (adhika) return paksha === "Shukla" ? "Padmini Ekadashi" : "Parama Ekadashi";
  const pair = EKADASHI_NAMES[masa];
  if (!pair) return "Ekadashi";
  return `${paksha === "Shukla" ? pair[0] : pair[1]} Ekadashi`;
}

/** Cheap pre-filter: tithi number around local morning, no rise/set search. */
function morningTithiNumber(date: CalendarDay, tz: string): number {
  const at = zonedToUtc(date.year, date.month, date.day, 6, 30, tz);
  return getTithi(at).number;
}

function paranaWindow(day: CalendarDay, city: City) {
  const summary = computeDaySummary(day, city);
  const sunrise = summary.sunrise;
  if (!sunrise) {
    return { date: day, start: null, end: null, note: "Break the fast shortly after sunrise." };
  }
  const tithi = getTithi(sunrise);
  const windows = summary.windows;
  const dayLength = windows ? windows.sunset.getTime() - sunrise.getTime() : 12 * 3_600_000;
  // Preferred window: first fifth of the daytime after sunrise.
  let start = sunrise;
  let end = new Date(sunrise.getTime() + dayLength / 5);
  let note = "Break the fast in the first fifth of the day, after sunrise.";

  if (tithi.name === "Dwadashi") {
    const hariVasaraEnd = new Date(
      tithi.start.getTime() + (tithi.end.getTime() - tithi.start.getTime()) / 4,
    );
    if (hariVasaraEnd > start) {
      start = hariVasaraEnd;
      note = "Hari Vasara (the first quarter of Dwadashi) must pass before parana.";
    }
    if (tithi.end < end) {
      end = tithi.end;
      note = "Dwadashi ends early, so parana must be taken before it does.";
    }
  } else if (tithi.name === "Trayodashi") {
    note = "Dwadashi ended before sunrise, so break the fast soon after sunrise.";
  }

  if (end <= start) end = new Date(start.getTime() + 15 * 60_000);
  return { date: day, start, end, note };
}

/** All Ekadashi fasts falling in the given local calendar year. */
export function ekadashiCalendar(year: number, city: City): EkadashiEntry[] {
  const entries: EkadashiEntry[] = [];
  let cursor: CalendarDay = { year, month: 1, day: 1 };
  let previousWasEkadashi = false;

  while (cursor.year === year) {
    const near = morningTithiNumber(cursor, city.tz);
    const candidate = [10, 11, 12, 25, 26, 27].includes(near);
    if (candidate) {
      const summary = computeDaySummary(cursor, city);
      if (summary.tithiName === "Ekadashi") {
        const masa = MASA_NAMES[summary.purnimantaIndex];
        const entry: EkadashiEntry = {
          date: cursor,
          name: ekadashiName(masa, summary.paksha, summary.adhikaMasa),
          paksha: summary.paksha,
          masa,
          sunrise: summary.sunrise,
          tithiEnd: summary.tithiEnd,
          parana: paranaWindow(addDays(cursor, 1), city),
        };
        if (previousWasEkadashi) {
          const prev = entries[entries.length - 1];
          if (prev) prev.vriddhi = "smarta";
          entry.vriddhi = "vaishnava";
          entry.name = prev ? prev.name : entry.name;
        }
        entries.push(entry);
        previousWasEkadashi = true;
        cursor = addDays(cursor, 1);
        continue;
      }
    }
    previousWasEkadashi = false;
    cursor = addDays(cursor, 1);
  }

  return entries;
}