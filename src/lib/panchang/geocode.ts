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
