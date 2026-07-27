import {
  Body,
  EclipticGeoMoon,
  Observer,
  SearchRiseSet,
  SunPosition,
} from "astronomy-engine";

import type { City } from "./cities";
import {
  FIXED_KARANAS,
  MASA_NAMES,
  MOVABLE_KARANAS,
  NAKSHATRA_NAMES,
  RASHI_NAMES,
  RITU_NAMES,
  VAARA_NAMES,
  YOGA_NAMES,
  tithiLabel,
} from "./names";
import {
  type CalendarDay,
  addDays,
  weekdayIndex,
  zonedToUtc,
} from "./tz";

const DAY_MS = 86_400_000;

function norm360(x: number): number {
  return ((x % 360) + 360) % 360;
}

/** Lahiri (Chitrapaksha) ayanamsa in degrees, linear approximation. */
export function ayanamsa(date: Date): number {
  const years = (date.getTime() - Date.UTC(2000, 0, 1, 12)) / (365.25 * DAY_MS);
  return 23.853 + 0.013972 * years;
}

export function sunLongitude(date: Date): number {
  return norm360(SunPosition(date).elon);
}

export function moonLongitude(date: Date): number {
  return norm360(EclipticGeoMoon(date).lon);
}

export function siderealSun(date: Date): number {
  return norm360(sunLongitude(date) - ayanamsa(date));
}

export function siderealMoon(date: Date): number {
  return norm360(moonLongitude(date) - ayanamsa(date));
}

/**
 * Find the instant between `start` and `end` where `fn` (a continuously
 * increasing angle measured from a segment boundary) reaches `target`.
 */
function bisect(fn: (d: Date) => number, target: number, start: Date, end: Date): Date {
  let lo = start.getTime();
  let hi = end.getTime();
  for (let i = 0; i < 48; i++) {
    const mid = (lo + hi) / 2;
    if (fn(new Date(mid)) < target) lo = mid;
    else hi = mid;
  }
  return new Date((lo + hi) / 2);
}

type Segment = {
  index: number;
  start: Date;
  end: Date;
};

/**
 * Given an angle function and a segment size in degrees, resolve the segment
 * containing `at` plus its start/end instants.
 */
function resolveSegment(
  angleAt: (d: Date) => number,
  size: number,
  at: Date,
  degPerDay: number,
): Segment {
  const value = angleAt(at);
  const index = Math.floor(value / size);
  const spanDays = size / degPerDay;

  const unwrap = (base: number) => (d: Date) => {
    let v = angleAt(d) - base;
    if (v < -180) v += 360;
    if (v > 180) v -= 360;
    return v;
  };

  const fromStart = unwrap(index * size);
  const searchBack = new Date(at.getTime() - spanDays * 1.8 * DAY_MS);
  const searchFwd = new Date(at.getTime() + spanDays * 1.8 * DAY_MS);
  const start = bisect(fromStart, 0, searchBack, at);
  const end = bisect(fromStart, size, at, searchFwd);
  return { index, start, end };
}

const tithiAngle = (d: Date) => norm360(moonLongitude(d) - sunLongitude(d));
const nakshatraAngle = (d: Date) => siderealMoon(d);
const yogaAngle = (d: Date) => norm360(siderealSun(d) + siderealMoon(d));

export type Element = {
  index: number;
  name: string;
  start: Date;
  end: Date;
};

export function getTithi(at: Date): Element & { number: number; paksha: "Shukla" | "Krishna" } {
  const seg = resolveSegment(tithiAngle, 12, at, 12.19);
  const number = seg.index + 1;
  const { name, paksha } = tithiLabel(number);
  return { index: seg.index, number, name, paksha, start: seg.start, end: seg.end };
}

export function getNakshatra(at: Date): Element {
  const seg = resolveSegment(nakshatraAngle, 360 / 27, at, 13.176);
  return { index: seg.index, name: NAKSHATRA_NAMES[seg.index % 27], start: seg.start, end: seg.end };
}

export function getYoga(at: Date): Element {
  const seg = resolveSegment(yogaAngle, 360 / 27, at, 14.16);
  return { index: seg.index, name: YOGA_NAMES[seg.index % 27], start: seg.start, end: seg.end };
}

export function getKarana(at: Date): Element {
  const seg = resolveSegment(tithiAngle, 6, at, 12.19);
  const i = seg.index; // 0..59
  let name: string;
  if (i === 0) name = FIXED_KARANAS[3];
  else if (i >= 57) name = FIXED_KARANAS[i - 57];
  else name = MOVABLE_KARANAS[(i - 1) % 7];
  return { index: i, name, start: seg.start, end: seg.end };
}

/** Instant of the new moon at or before `at`. */
export function previousNewMoon(at: Date): Date {
  const angle = tithiAngle(at);
  const approx = new Date(at.getTime() - (angle / 12.19) * DAY_MS);
  const unwrap = (d: Date) => {
    let v = tithiAngle(d);
    if (v > 180) v -= 360;
    return v;
  };
  return bisect(unwrap, 0, new Date(approx.getTime() - 2 * DAY_MS), new Date(approx.getTime() + 2 * DAY_MS));
}

export type LunarMonth = {
  amantaIndex: number;
  purnimantaIndex: number;
  amanta: string;
  purnimanta: string;
};

export function getLunarMonth(at: Date, paksha: "Shukla" | "Krishna"): LunarMonth {
  const nm = previousNewMoon(at);
  const rashi = Math.floor(siderealSun(nm) / 30);
  const amantaIndex = (rashi + 1) % 12;
  const purnimantaIndex = paksha === "Krishna" ? (amantaIndex + 1) % 12 : amantaIndex;
  return {
    amantaIndex,
    purnimantaIndex,
    amanta: MASA_NAMES[amantaIndex],
    purnimanta: MASA_NAMES[purnimantaIndex],
  };
}

export type Muhurta = { name: string; start: Date; end: Date; kind: "inauspicious" | "auspicious" };

const RAHU_SEQ = [8, 2, 7, 5, 6, 4, 3]; // Sun..Sat, 1-indexed eighth of the day
const YAMA_SEQ = [5, 4, 3, 2, 1, 7, 6];
const GULIKA_SEQ = [7, 6, 5, 4, 3, 2, 1];

function slice(sunrise: Date, sunset: Date, part: number): { start: Date; end: Date } {
  const span = (sunset.getTime() - sunrise.getTime()) / 8;
  return {
    start: new Date(sunrise.getTime() + (part - 1) * span),
    end: new Date(sunrise.getTime() + part * span),
  };
}

export type DayPanchang = {
  date: CalendarDay;
  city: City;
  sunrise: Date | null;
  sunset: Date | null;
  moonrise: Date | null;
  moonset: Date | null;
  reference: Date;
  tithi: ReturnType<typeof getTithi>;
  nextTithi: { number: number; name: string; paksha: string };
  nakshatra: Element;
  yoga: Element;
  karana: Element;
  nextKarana: Element;
  vaara: string;
  weekday: number;
  month: LunarMonth;
  ritu: string;
  samvat: number;
  moonRashi: string;
  sunRashi: string;
  moonPhase: number;
  muhurtas: Muhurta[];
};

export function computeDayPanchang(date: CalendarDay, city: City): DayPanchang {
  const observer = new Observer(city.lat, city.lon, 0);
  const localMidnight = zonedToUtc(date.year, date.month, date.day, 0, 0, city.tz);

  const sunriseT = SearchRiseSet(Body.Sun, observer, +1, localMidnight, 2);
  const sunrise = sunriseT ? sunriseT.date : null;
  const sunsetT = sunrise ? SearchRiseSet(Body.Sun, observer, -1, sunrise, 2) : null;
  const sunset = sunsetT ? sunsetT.date : null;
  const moonriseT = SearchRiseSet(Body.Moon, observer, +1, localMidnight, 2);
  const moonsetT = SearchRiseSet(Body.Moon, observer, -1, localMidnight, 2);

  // Panchang elements are read at sunrise, the traditional start of the day.
  const reference = sunrise ?? new Date(localMidnight.getTime() + 6 * 3600_000);

  const tithi = getTithi(reference);
  const nakshatra = getNakshatra(reference);
  const yoga = getYoga(reference);
  const karana = getKarana(reference);
  const nextKarana = getKarana(new Date(karana.end.getTime() + 60_000));
  const nextTithiNumber = (tithi.number % 30) + 1;
  const nextLabel = tithiLabel(nextTithiNumber);
  const month = getLunarMonth(reference, tithi.paksha);

  const muhurtas: Muhurta[] = [];
  if (sunrise && sunset) {
    const w = weekdayIndex(date);
    const rahu = slice(sunrise, sunset, RAHU_SEQ[w]);
    const yama = slice(sunrise, sunset, YAMA_SEQ[w]);
    const gulika = slice(sunrise, sunset, GULIKA_SEQ[w]);
    const noon = (sunrise.getTime() + sunset.getTime()) / 2;
    const abhijitHalf = ((sunset.getTime() - sunrise.getTime()) / 15) * 0.5;
    muhurtas.push(
      { name: "Rahu Kalam", kind: "inauspicious", ...rahu },
      { name: "Yamaganda", kind: "inauspicious", ...yama },
      { name: "Gulika Kalam", kind: "inauspicious", ...gulika },
      {
        name: "Abhijit Muhurta",
        kind: "auspicious",
        start: new Date(noon - abhijitHalf),
        end: new Date(noon + abhijitHalf),
      },
    );
  }

  const sunSid = siderealSun(reference);
  const moonSid = siderealMoon(reference);
  const ritu = RITU_NAMES[Math.floor(month.amantaIndex / 2) % 6];
  const samvat = date.year + 57 - (month.amantaIndex >= 9 && tithi.paksha === "Shukla" ? 0 : 0);

  return {
    date,
    city,
    sunrise,
    sunset,
    moonrise: moonriseT ? moonriseT.date : null,
    moonset: moonsetT ? moonsetT.date : null,
    reference,
    tithi,
    nextTithi: { number: nextTithiNumber, name: nextLabel.name, paksha: nextLabel.paksha },
    nakshatra,
    yoga,
    karana,
    nextKarana,
    vaara: VAARA_NAMES[weekdayIndex(date)],
    weekday: weekdayIndex(date),
    month,
    ritu,
    samvat,
    moonRashi: RASHI_NAMES[Math.floor(moonSid / 30)],
    sunRashi: RASHI_NAMES[Math.floor(sunSid / 30)],
    moonPhase: norm360(moonLongitude(reference) - sunLongitude(reference)) / 360,
    muhurtas,
  };
}

/** Lightweight per-day summary used by the month grid and reminder scans. */
export type DaySummary = {
  date: CalendarDay;
  sunrise: Date | null;
  tithiNumber: number;
  tithiName: string;
  paksha: "Shukla" | "Krishna";
  amantaIndex: number;
  purnimantaIndex: number;
  nakshatra: string;
  sunRashiIndex: number;
};

const summaryCache = new Map<string, DaySummary>();
const SUMMARY_CACHE_LIMIT = 1200;

export function computeDaySummary(date: CalendarDay, city: City): DaySummary {
  const key = `${city.id}|${city.lat}|${city.lon}|${city.tz}|${date.year}-${date.month}-${date.day}`;
  const cached = summaryCache.get(key);
  if (cached) return cached;
  const observer = new Observer(city.lat, city.lon, 0);
  const localMidnight = zonedToUtc(date.year, date.month, date.day, 0, 0, city.tz);
  const sunriseT = SearchRiseSet(Body.Sun, observer, +1, localMidnight, 2);
  const reference = sunriseT ? sunriseT.date : new Date(localMidnight.getTime() + 6 * 3600_000);
  const tithi = getTithi(reference);
  const month = getLunarMonth(reference, tithi.paksha);
  const summary: DaySummary = {
    date,
    sunrise: sunriseT ? sunriseT.date : null,
    tithiNumber: tithi.number,
    tithiName: tithi.name,
    paksha: tithi.paksha,
    amantaIndex: month.amantaIndex,
    purnimantaIndex: month.purnimantaIndex,
    nakshatra: getNakshatra(reference).name,
    sunRashiIndex: Math.floor(siderealSun(reference) / 30),
  };
  if (summaryCache.size >= SUMMARY_CACHE_LIMIT) summaryCache.clear();
  summaryCache.set(key, summary);
  return summary;
}

export function summariesForRange(start: CalendarDay, days: number, city: City): DaySummary[] {
  const out: DaySummary[] = [];
  for (let i = 0; i < days; i++) out.push(computeDaySummary(addDays(start, i), city));
  return out;
}