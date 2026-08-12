/**
 * Server-renderable parana snapshot.
 *
 * The parana page used to compute everything in an effect, so crawlers only ever
 * saw "Calculating…". This module produces the same data synchronously for a
 * reference city, cached per city + local day, so it is cheap enough to run
 * during SSR and inside `head()`.
 */
import { scanEkadashi, type EkadashiEntry } from "./ekadashi";
import { CITIES, DEFAULT_CITY_ID, type City } from "./cities";
import { addDays, dayKey, toCalendarDay, type CalendarDay } from "./tz";

export const REFERENCE_CITY: City =
  CITIES.find((c) => c.id === DEFAULT_CITY_ID) ?? CITIES[0];

export type ParanaSnapshot = {
  city: City;
  today: CalendarDay;
  tomorrow: CalendarDay;
  entries: EkadashiEntry[];
};

const cache = new Map<string, ParanaSnapshot>();

/** Ekadashi entries around `today` for `city`, memoised per city + day. */
export function paranaSnapshot(city: City, today: CalendarDay): ParanaSnapshot {
  const key = `${city.id}:${city.lat.toFixed(3)},${city.lon.toFixed(3)}:${dayKey(today)}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const snapshot: ParanaSnapshot = {
    city,
    today,
    tomorrow: addDays(today, 1),
    entries: scanEkadashi(addDays(today, -3), 50, city),
  };
  if (cache.size > 16) cache.clear();
  cache.set(key, snapshot);
  return snapshot;
}

/** Snapshot for the reference city — identical on server and first client render. */
export function referenceParanaSnapshot(now: Date = new Date()): ParanaSnapshot {
  return paranaSnapshot(REFERENCE_CITY, toCalendarDay(now, REFERENCE_CITY.tz));
}
