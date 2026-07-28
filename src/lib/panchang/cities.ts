export type City = {
  id: string;
  name: string;
  state: string;
  lat: number;
  lon: number;
  tz: string;
  /** Metres above sea level; refines sunrise/sunset by a few seconds. */
  elevation?: number;
};

export const CITIES: City[] = [
  { id: "sunnyvale-ca", name: "Sunnyvale / South Bay", state: "CA", lat: 37.3688, lon: -122.0363, tz: "America/Los_Angeles" },
  { id: "sanfrancisco-ca", name: "San Francisco", state: "CA", lat: 37.7749, lon: -122.4194, tz: "America/Los_Angeles" },
  { id: "fremont-ca", name: "Fremont", state: "CA", lat: 37.5485, lon: -121.9886, tz: "America/Los_Angeles" },
  { id: "sacramento-ca", name: "Sacramento", state: "CA", lat: 38.5816, lon: -121.4944, tz: "America/Los_Angeles" },
  { id: "losangeles-ca", name: "Los Angeles", state: "CA", lat: 34.0522, lon: -118.2437, tz: "America/Los_Angeles" },
  { id: "irvine-ca", name: "Irvine", state: "CA", lat: 33.6846, lon: -117.8265, tz: "America/Los_Angeles" },
  { id: "sandiego-ca", name: "San Diego", state: "CA", lat: 32.7157, lon: -117.1611, tz: "America/Los_Angeles" },
  { id: "seattle-wa", name: "Seattle", state: "WA", lat: 47.6062, lon: -122.3321, tz: "America/Los_Angeles" },
  { id: "redmond-wa", name: "Redmond / Bellevue", state: "WA", lat: 47.674, lon: -122.1215, tz: "America/Los_Angeles" },
  { id: "portland-or", name: "Portland", state: "OR", lat: 45.5152, lon: -122.6784, tz: "America/Los_Angeles" },
  { id: "phoenix-az", name: "Phoenix", state: "AZ", lat: 33.4484, lon: -112.074, tz: "America/Phoenix" },
  { id: "lasvegas-nv", name: "Las Vegas", state: "NV", lat: 36.1699, lon: -115.1398, tz: "America/Los_Angeles" },
  { id: "denver-co", name: "Denver", state: "CO", lat: 39.7392, lon: -104.9903, tz: "America/Denver" },
  { id: "saltlake-ut", name: "Salt Lake City", state: "UT", lat: 40.7608, lon: -111.891, tz: "America/Denver" },
  { id: "dallas-tx", name: "Dallas / Irving", state: "TX", lat: 32.7767, lon: -96.797, tz: "America/Chicago" },
  { id: "plano-tx", name: "Plano / Frisco", state: "TX", lat: 33.0198, lon: -96.6989, tz: "America/Chicago" },
  { id: "houston-tx", name: "Houston / Sugar Land", state: "TX", lat: 29.7604, lon: -95.3698, tz: "America/Chicago" },
  { id: "austin-tx", name: "Austin", state: "TX", lat: 30.2672, lon: -97.7431, tz: "America/Chicago" },
  { id: "sanantonio-tx", name: "San Antonio", state: "TX", lat: 29.4241, lon: -98.4936, tz: "America/Chicago" },
  { id: "chicago-il", name: "Chicago / Naperville", state: "IL", lat: 41.8781, lon: -87.6298, tz: "America/Chicago" },
  { id: "minneapolis-mn", name: "Minneapolis", state: "MN", lat: 44.9778, lon: -93.265, tz: "America/Chicago" },
  { id: "stlouis-mo", name: "St. Louis", state: "MO", lat: 38.627, lon: -90.1994, tz: "America/Chicago" },
  { id: "kansascity-mo", name: "Kansas City", state: "MO", lat: 39.0997, lon: -94.5786, tz: "America/Chicago" },
  { id: "milwaukee-wi", name: "Milwaukee", state: "WI", lat: 43.0389, lon: -87.9065, tz: "America/Chicago" },
  { id: "nashville-tn", name: "Nashville", state: "TN", lat: 36.1627, lon: -86.7816, tz: "America/Chicago" },
  { id: "memphis-tn", name: "Memphis", state: "TN", lat: 35.1495, lon: -90.049, tz: "America/Chicago" },
  { id: "neworleans-la", name: "New Orleans", state: "LA", lat: 29.9511, lon: -90.0715, tz: "America/Chicago" },
  { id: "indianapolis-in", name: "Indianapolis", state: "IN", lat: 39.7684, lon: -86.1581, tz: "America/Indiana/Indianapolis" },
  { id: "detroit-mi", name: "Detroit / Troy", state: "MI", lat: 42.3314, lon: -83.0458, tz: "America/Detroit" },
  { id: "columbus-oh", name: "Columbus", state: "OH", lat: 39.9612, lon: -82.9988, tz: "America/New_York" },
  { id: "cleveland-oh", name: "Cleveland", state: "OH", lat: 41.4993, lon: -81.6944, tz: "America/New_York" },
  { id: "cincinnati-oh", name: "Cincinnati", state: "OH", lat: 39.1031, lon: -84.512, tz: "America/New_York" },
  { id: "pittsburgh-pa", name: "Pittsburgh", state: "PA", lat: 40.4406, lon: -79.9959, tz: "America/New_York" },
  { id: "philadelphia-pa", name: "Philadelphia", state: "PA", lat: 39.9526, lon: -75.1652, tz: "America/New_York" },
  { id: "newyork-ny", name: "New York City", state: "NY", lat: 40.7128, lon: -74.006, tz: "America/New_York" },
  { id: "edison-nj", name: "Edison / Iselin", state: "NJ", lat: 40.5187, lon: -74.4121, tz: "America/New_York" },
  { id: "jerseycity-nj", name: "Jersey City", state: "NJ", lat: 40.7178, lon: -74.0431, tz: "America/New_York" },
  { id: "albany-ny", name: "Albany", state: "NY", lat: 42.6526, lon: -73.7562, tz: "America/New_York" },
  { id: "boston-ma", name: "Boston / Cambridge", state: "MA", lat: 42.3601, lon: -71.0589, tz: "America/New_York" },
  { id: "hartford-ct", name: "Hartford", state: "CT", lat: 41.7658, lon: -72.6734, tz: "America/New_York" },
  { id: "baltimore-md", name: "Baltimore", state: "MD", lat: 39.2904, lon: -76.6122, tz: "America/New_York" },
  { id: "washington-dc", name: "Washington, D.C. / NoVA", state: "DC", lat: 38.9072, lon: -77.0369, tz: "America/New_York" },
  { id: "richmond-va", name: "Richmond", state: "VA", lat: 37.5407, lon: -77.436, tz: "America/New_York" },
  { id: "raleigh-nc", name: "Raleigh / Cary", state: "NC", lat: 35.7796, lon: -78.6382, tz: "America/New_York" },
  { id: "charlotte-nc", name: "Charlotte", state: "NC", lat: 35.2271, lon: -80.8431, tz: "America/New_York" },
  { id: "atlanta-ga", name: "Atlanta / Alpharetta", state: "GA", lat: 33.749, lon: -84.388, tz: "America/New_York" },
  { id: "orlando-fl", name: "Orlando", state: "FL", lat: 28.5383, lon: -81.3792, tz: "America/New_York" },
  { id: "tampa-fl", name: "Tampa", state: "FL", lat: 27.9506, lon: -82.4572, tz: "America/New_York" },
  { id: "miami-fl", name: "Miami", state: "FL", lat: 25.7617, lon: -80.1918, tz: "America/New_York" },
  { id: "honolulu-hi", name: "Honolulu", state: "HI", lat: 21.3069, lon: -157.8583, tz: "Pacific/Honolulu" },
  { id: "anchorage-ak", name: "Anchorage", state: "AK", lat: 61.2181, lon: -149.9003, tz: "America/Anchorage" },
];

export const DEFAULT_CITY_ID = "edison-nj";

export function findCity(id: string | null | undefined): City {
  return CITIES.find((c) => c.id === id) ?? CITIES.find((c) => c.id === DEFAULT_CITY_ID)!;
}

/** Best-effort match of the browser's IANA timezone to a bundled city. */
export function cityForTimeZone(tz: string): City | undefined {
  return CITIES.find((c) => c.tz === tz);
}
/** Great-circle distance in miles. */
function distanceMiles(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 3958.8 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Closest preset city to a device coordinate, with its distance in miles.
 * When the device reports an IANA timezone, cities sharing it are preferred so
 * that panchang timings always follow the user's actual clock.
 */
export function nearestCity(
  lat: number,
  lon: number,
  deviceTz?: string,
): { city: City; miles: number } {
  const pick = (pool: City[]) => {
    let best = pool[0];
    let bestMiles = Infinity;
    for (const c of pool) {
      const miles = distanceMiles(lat, lon, c.lat, c.lon);
      if (miles < bestMiles) {
        best = c;
        bestMiles = miles;
      }
    }
    return { city: best, miles: bestMiles };
  };

  if (deviceTz) {
    const sameZone = CITIES.filter((c) => c.tz === deviceTz);
    if (sameZone.length) return pick(sameZone);
  }
  return pick(CITIES);
}

/** Short timezone label (e.g. "PDT") for a city at a given instant. */
export function tzLabel(tz: string, at: Date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "short",
    }).formatToParts(at);
    return parts.find((p) => p.type === "timeZoneName")?.value ?? tz;
  } catch {
    return tz;
  }
}
