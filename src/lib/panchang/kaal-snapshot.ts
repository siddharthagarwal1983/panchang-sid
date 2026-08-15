/**
 * Server-renderable Rahu Kalam / Yamaganda / Gulika snapshot.
 *
 * Same shape as `parana-snapshot.ts`: computed synchronously and memoised per
 * city + local day so it can run during SSR and inside `head()`, then swapped
 * for the visitor's own city after hydration.
 */
import { computeDayPanchang, type Muhurta } from "./core";
import { REFERENCE_CITY } from "./parana-snapshot";
import type { City } from "./cities";
import { dayKey, toCalendarDay, type CalendarDay } from "./tz";

export { REFERENCE_CITY };

export type KaalSnapshot = {
  city: City;
  date: CalendarDay;
  sunrise: Date | null;
  sunset: Date | null;
  /** Rahu Kalam, Yamaganda, Gulika Kalam — in that order, when computable. */
  inauspicious: Muhurta[];
  abhijit: Muhurta | null;
};

const INAUSPICIOUS = ["Rahu Kalam", "Yamaganda", "Gulika Kalam"];

const cache = new Map<string, KaalSnapshot>();

export function kaalSnapshot(city: City, date: CalendarDay): KaalSnapshot {
  const key = `${city.id}:${city.lat.toFixed(3)},${city.lon.toFixed(3)}:${dayKey(date)}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const day = computeDayPanchang(date, city);
  const snapshot: KaalSnapshot = {
    city,
    date,
    sunrise: day.sunrise,
    sunset: day.sunset,
    inauspicious: INAUSPICIOUS.map((name) => day.muhurtas.find((m) => m.name === name)).filter(
      (m): m is Muhurta => Boolean(m),
    ),
    abhijit: day.muhurtas.find((m) => m.name === "Abhijit Muhurta") ?? null,
  };
  if (cache.size > 16) cache.clear();
  cache.set(key, snapshot);
  return snapshot;
}

/** Snapshot for the reference city — identical on server and first client render. */
export function referenceKaalSnapshot(now: Date = new Date()): KaalSnapshot {
  return kaalSnapshot(REFERENCE_CITY, toCalendarDay(now, REFERENCE_CITY.tz));
}