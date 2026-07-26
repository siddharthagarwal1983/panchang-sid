import type { City } from "./cities";

/** A place anywhere in the world, in the same shape the panchang engine uses. */
export type Place = City & { country?: string };

type OpenMeteoResult = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  timezone: string;
  country?: string;
  country_code?: string;
  admin1?: string;
};

function toPlace(r: OpenMeteoResult): Place {
  return {
    id: `om-${r.id}`,
    name: r.name,
    state: r.admin1 || r.country || r.country_code || "",
    country: r.country,
    lat: r.latitude,
    lon: r.longitude,
    tz: r.timezone,
  };
}

/** Search cities and towns worldwide. Throws on network/API failure. */
export async function searchPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    q,
  )}&count=20&language=en&format=json`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Search failed (${res.status})`);
  const data = (await res.json()) as { results?: OpenMeteoResult[] };
  const seen = new Set<string>();
  return (data.results ?? [])
    .filter((r) => r.timezone)
    .map(toPlace)
    .filter((p) => {
      const key = `${p.name}|${p.state}|${p.country}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

/** Turn device coordinates into a named place; falls back to the raw coordinates. */
export async function reverseGeocode(lat: number, lon: number): Promise<Place> {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const fallback: Place = {
    id: `geo-${lat.toFixed(3)}-${lon.toFixed(3)}`,
    name: "My location",
    state: tz.split("/").pop()?.replace(/_/g, " ") ?? "",
    lat,
    lon,
    tz,
  };
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=10&lat=${lat}&lon=${lon}`,
      { headers: { Accept: "application/json" } },
    );
    if (!res.ok) return fallback;
    const data = (await res.json()) as {
      address?: Record<string, string>;
    };
    const a = data.address ?? {};
    const name = a.city || a.town || a.village || a.municipality || a.county || fallback.name;
    return {
      ...fallback,
      name,
      state: a.state || a.country || fallback.state,
      country: a.country,
    };
  } catch {
    return fallback;
  }
}

export function placeLabel(place: { name: string; state?: string }): string {
  return place.state ? `${place.name}, ${place.state}` : place.name;
}

/** Default "parents / family" location used by the dual-location toggle. */
export const FAMILY_DEFAULT_PLACE: Place = {
  id: "in-delhi",
  name: "New Delhi",
  state: "Delhi",
  country: "India",
  lat: 28.6139,
  lon: 77.209,
  tz: "Asia/Kolkata",
};

/** Rough coordinates for common IANA zones, used before geolocation resolves. */
const TZ_FALLBACKS: Record<string, Omit<Place, "id" | "tz">> = {
  "Europe/London": { name: "London", state: "United Kingdom", lat: 51.5072, lon: -0.1276 },
  "Europe/Dublin": { name: "Dublin", state: "Ireland", lat: 53.3498, lon: -6.2603 },
  "Europe/Berlin": { name: "Berlin", state: "Germany", lat: 52.52, lon: 13.405 },
  "Europe/Paris": { name: "Paris", state: "France", lat: 48.8566, lon: 2.3522 },
  "Europe/Zurich": { name: "Zurich", state: "Switzerland", lat: 47.3769, lon: 8.5417 },
  "Europe/Amsterdam": { name: "Amsterdam", state: "Netherlands", lat: 52.3676, lon: 4.9041 },
  "Asia/Kolkata": { name: "New Delhi", state: "India", lat: 28.6139, lon: 77.209 },
  "Asia/Calcutta": { name: "New Delhi", state: "India", lat: 28.6139, lon: 77.209 },
  "Asia/Dubai": { name: "Dubai", state: "UAE", lat: 25.2048, lon: 55.2708 },
  "Asia/Singapore": { name: "Singapore", state: "Singapore", lat: 1.3521, lon: 103.8198 },
  "Asia/Tokyo": { name: "Tokyo", state: "Japan", lat: 35.6762, lon: 139.6503 },
  "Australia/Sydney": { name: "Sydney", state: "Australia", lat: -33.8688, lon: 151.2093 },
  "Australia/Melbourne": { name: "Melbourne", state: "Australia", lat: -37.8136, lon: 144.9631 },
  "Australia/Perth": { name: "Perth", state: "Australia", lat: -31.9523, lon: 115.8613 },
  "Pacific/Auckland": { name: "Auckland", state: "New Zealand", lat: -36.8485, lon: 174.7633 },
  "America/Toronto": { name: "Toronto", state: "Canada", lat: 43.6532, lon: -79.3832 },
  "America/Vancouver": { name: "Vancouver", state: "Canada", lat: 49.2827, lon: -123.1207 },
  "America/Edmonton": { name: "Calgary", state: "Canada", lat: 51.0447, lon: -114.0719 },
  "Africa/Johannesburg": { name: "Johannesburg", state: "South Africa", lat: -26.2041, lon: 28.0473 },
  "Africa/Nairobi": { name: "Nairobi", state: "Kenya", lat: -1.2921, lon: 36.8219 },
  "Asia/Kuala_Lumpur": { name: "Kuala Lumpur", state: "Malaysia", lat: 3.139, lon: 101.6869 },
  "Asia/Hong_Kong": { name: "Hong Kong", state: "Hong Kong", lat: 22.3193, lon: 114.1694 },
};

/** Best-effort place derived from the browser timezone (no permission needed). */
export function placeForTimeZone(tz: string): Place | null {
  const hit = TZ_FALLBACKS[tz];
  if (!hit) return null;
  return { id: `tz-${tz}`, tz, ...hit };
}
