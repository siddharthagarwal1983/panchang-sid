/**
 * Single-date Ekadashi lookup, cheap enough to run during SSR and inside
 * `head()` (a 5-day scan, memoised per city + date).
 */
import { scanEkadashi, type EkadashiEntry } from "./ekadashi";
import type { City } from "./cities";
import { addDays, dayKey, type CalendarDay } from "./tz";

const cache = new Map<string, EkadashiEntry | null>();

/**
 * The Ekadashi fast for `day` in `city`. When the local sunrise shifts the fast
 * to the neighbouring day, the nearest entry within ±2 days is returned instead,
 * so the page can say which day it actually falls on locally.
 */
export function ekadashiNearDay(city: City, day: CalendarDay): EkadashiEntry | null {
  const key = `${city.id}:${city.lat.toFixed(3)},${city.lon.toFixed(3)}:${dayKey(day)}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;

  const entries = scanEkadashi(addDays(day, -2), 5, city);
  const target = dayKey(day);
  let best: EkadashiEntry | null = null;
  let bestDelta = Infinity;
  for (const e of entries) {
    const delta = Math.abs(Number(dayKey(e.date).replace(/-/g, "")) - Number(target.replace(/-/g, "")));
    if (delta < bestDelta) {
      best = e;
      bestDelta = delta;
    }
  }
  if (cache.size > 64) cache.clear();
  cache.set(key, best);
  return best;
}