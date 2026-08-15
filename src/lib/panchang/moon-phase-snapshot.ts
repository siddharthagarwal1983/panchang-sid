/**
 * Server-renderable Amavasya / Purnima snapshot.
 *
 * Mirrors `parana-snapshot.ts`: the reference-city data is computed
 * synchronously and memoised per city + local day so it can run during SSR and
 * inside `head()`, and the visitor's own city is swapped in after hydration.
 */
import { scanMoonPhases, type MoonPhaseEntry, type MoonPhaseKind } from "./moon-phase";
import { REFERENCE_CITY } from "./parana-snapshot";
import type { City } from "./cities";
import { addDays, dayKey, toCalendarDay, type CalendarDay } from "./tz";

export { REFERENCE_CITY };

export type MoonPhaseSnapshot = {
  kind: MoonPhaseKind;
  city: City;
  today: CalendarDay;
  entries: MoonPhaseEntry[];
};

const cache = new Map<string, MoonPhaseSnapshot>();

/** Entries around `today` (previous one through the next few), memoised. */
export function moonPhaseSnapshot(
  city: City,
  today: CalendarDay,
  kind: MoonPhaseKind,
): MoonPhaseSnapshot {
  const key = `${kind}:${city.id}:${city.lat.toFixed(3)},${city.lon.toFixed(3)}:${dayKey(today)}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const snapshot: MoonPhaseSnapshot = {
    kind,
    city,
    today,
    entries: scanMoonPhases(addDays(today, -3), 130, city, kind),
  };
  if (cache.size > 16) cache.clear();
  cache.set(key, snapshot);
  return snapshot;
}

/** Snapshot for the reference city — identical on server and first client render. */
export function referenceMoonPhaseSnapshot(
  kind: MoonPhaseKind,
  now: Date = new Date(),
): MoonPhaseSnapshot {
  return moonPhaseSnapshot(REFERENCE_CITY, toCalendarDay(now, REFERENCE_CITY.tz), kind);
}
