import { Body, Observer, SearchRiseSet } from "astronomy-engine";

import type { City } from "./cities";
import {
  apparentMoonLongitude,
  apparentSunLongitude,
  lahiriTrueAyanamsa,
  norm360,
  siderealMoonLongitude,
  siderealSunLongitude,
  tithiAngle,
  tithiNumberAt,
} from "./ephemeris";
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
import { type CalendarDay, addDays, weekdayIndex, zonedToUtc } from "./tz";

const DAY_MS = 86_400_000;
const MIN_MS = 60_000;

/** Lahiri (Chitrapaksha) ayanamsa in degrees, Swiss Ephemeris compatible. */
export const ayanamsa = lahiriTrueAyanamsa;
export const sunLongitude = apparentSunLongitude;
export const moonLongitude = apparentMoonLongitude;
export const siderealSun = siderealSunLongitude;
export const siderealMoon = siderealMoonLongitude;
export { tithiNumberAt };

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

type Segment = { index: number; start: Date; end: Date };

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
  return {
    index,
    start: bisect(fromStart, 0, searchBack, at),
    end: bisect(fromStart, size, at, searchFwd),
  };
}

const nakshatraAngle = (d: Date) => siderealMoon(d);
const yogaAngle = (d: Date) => norm360(siderealSun(d) + siderealMoon(d));

export type Element = { index: number; name: string; start: Date; end: Date };

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
  /** True when the lunation contains no solar ingress — an intercalary month. */
  adhika: boolean;
};

/**
 * Adhika (leap) masa: a lunation in which the Sun never enters a new rashi.
 * Kshaya masa (two ingresses in one lunation) is the mirror case and is
 * reported through `adhika === false` with the month simply advancing twice.
 */
export function getLunarMonth(at: Date, paksha: "Shukla" | "Krishna"): LunarMonth {
  const nm = previousNewMoon(at);
  const nextNm = previousNewMoon(new Date(nm.getTime() + 31 * DAY_MS));
  const rashi = Math.floor(siderealSun(nm) / 30);
  const nextRashi = Math.floor(siderealSun(nextNm) / 30);
  const adhika = rashi === nextRashi;
  const amantaIndex = (rashi + 1) % 12;
  const purnimantaIndex = paksha === "Krishna" ? (amantaIndex + 1) % 12 : amantaIndex;
  return {
    amantaIndex,
    purnimantaIndex,
    amanta: MASA_NAMES[amantaIndex],
    purnimanta: MASA_NAMES[purnimantaIndex],
    adhika,
  };
}

export type Muhurta = {
  name: string;
  start: Date;
  end: Date;
  kind: "inauspicious" | "auspicious" | "window";
};

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

export type Interval = { start: Date; end: Date };

/**
 * The canonical day-boundary windows every nirnaya (festival decision) rule
 * is evaluated against, all derived from the local solar day.
 */
export type DayWindows = {
  sunrise: Date;
  sunset: Date;
  nextSunrise: Date;
  /** 3rd of five equal parts of the daytime. */
  madhyahna: Interval;
  /** Sunset to two muhurtas (96 min) after sunset. */
  pradosha: Interval;
  /** Middle 1/15th of the night, centred on local solar midnight. */
  nishita: Interval;
};

export function buildWindows(sunrise: Date, sunset: Date, nextSunrise: Date): DayWindows {
  const dayLen = sunset.getTime() - sunrise.getTime();
  const nightLen = nextSunrise.getTime() - sunset.getTime();
  const midnight = sunset.getTime() + nightLen / 2;
  const nishitaHalf = nightLen / 30;
  return {
    sunrise,
    sunset,
    nextSunrise,
    madhyahna: {
      start: new Date(sunrise.getTime() + (dayLen * 2) / 5),
      end: new Date(sunrise.getTime() + (dayLen * 3) / 5),
    },
    pradosha: { start: sunset, end: new Date(sunset.getTime() + 96 * MIN_MS) },
    nishita: { start: new Date(midnight - nishitaHalf), end: new Date(midnight + nishitaHalf) },
  };
}

function observerFor(city: City): Observer {
  return new Observer(city.lat, city.lon, city.elevation ?? 0);
}

function sunriseAfter(city: City, from: Date): Date | null {
  const t = SearchRiseSet(Body.Sun, observerFor(city), +1, from, 2);
  return t ? t.date : null;
}

/**
 * How much of `[window]` the given tithi number occupies, in minutes.
 * Sampled finely — a tithi boundary crosses a window at most twice.
 */
export function tithiCoverage(target: number, window: Interval): number {
  const steps = 48;
  const span = window.end.getTime() - window.start.getTime();
  if (span <= 0) return 0;
  const step = span / steps;
  let hits = 0;
  for (let i = 0; i < steps; i++) {
    const t = new Date(window.start.getTime() + step * (i + 0.5));
    if (tithiNumberAt(t) === target) hits++;
  }
  return (hits / steps) * (span / MIN_MS);
}

export type TithiSpan = {
  /** "vriddhi" — the tithi touches two consecutive sunrises. */
  /** "kshaya" — the next tithi begins and ends between two sunrises. */
  kind: "normal" | "vriddhi" | "kshaya";
  /** Tithi number skipped entirely between the two sunrises, if any. */
  skipped: number | null;
};

export function classifyTithiSpan(sunrise: Date, nextSunrise: Date): TithiSpan {
  const t0 = tithiNumberAt(sunrise);
  const t1 = tithiNumberAt(nextSunrise);
  const diff = (t1 - t0 + 30) % 30;
  if (diff === 0) return { kind: "vriddhi", skipped: null };
  if (diff >= 2) return { kind: "kshaya", skipped: (t0 % 30) + 1 };
  return { kind: "normal", skipped: null };
}

export type DayPanchang = {
  date: CalendarDay;
  city: City;
  sunrise: Date | null;
  sunset: Date | null;
  moonrise: Date | null;
  moonset: Date | null;
  reference: Date;
  windows: DayWindows | null;
  tithi: ReturnType<typeof getTithi>;
  tithiSpan: TithiSpan;
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
  const observer = observerFor(city);
  const localMidnight = zonedToUtc(date.year, date.month, date.day, 0, 0, city.tz);

  const sunriseT = SearchRiseSet(Body.Sun, observer, +1, localMidnight, 2);
  const sunrise = sunriseT ? sunriseT.date : null;
  const sunsetT = sunrise ? SearchRiseSet(Body.Sun, observer, -1, sunrise, 2) : null;
  const sunset = sunsetT ? sunsetT.date : null;
  const nextSunrise = sunset ? sunriseAfter(city, sunset) : null;
  const moonriseT = SearchRiseSet(Body.Moon, observer, +1, localMidnight, 2);
  const moonsetT = SearchRiseSet(Body.Moon, observer, -1, localMidnight, 2);

  // Panchang elements are read at sunrise, the traditional start of the day.
  const reference = sunrise ?? new Date(localMidnight.getTime() + 6 * 3600_000);
  const windows = sunrise && sunset && nextSunrise ? buildWindows(sunrise, sunset, nextSunrise) : null;

  const tithi = getTithi(reference);
  const nakshatra = getNakshatra(reference);
  const yoga = getYoga(reference);
  const karana = getKarana(reference);
  const nextKarana = getKarana(new Date(karana.end.getTime() + 60_000));
  const nextTithiNumber = (tithi.number % 30) + 1;
  const nextLabel = tithiLabel(nextTithiNumber);
  const month = getLunarMonth(reference, tithi.paksha);
  const tithiSpan =
    sunrise && nextSunrise
      ? classifyTithiSpan(sunrise, nextSunrise)
      : { kind: "normal" as const, skipped: null };

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
  if (windows) {
    muhurtas.push(
      { name: "Madhyahna", kind: "window", ...windows.madhyahna },
      { name: "Pradosha", kind: "window", ...windows.pradosha },
      { name: "Nishita", kind: "window", ...windows.nishita },
    );
  }

  const sunSid = siderealSun(reference);
  const moonSid = siderealMoon(reference);
  const ritu = RITU_NAMES[Math.floor(month.amantaIndex / 2) % 6];
  const samvat = date.year + 57;

  return {
    date,
    city,
    sunrise,
    sunset,
    moonrise: moonriseT ? moonriseT.date : null,
    moonset: moonsetT ? moonsetT.date : null,
    reference,
    windows,
    tithi,
    tithiSpan,
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

/** Lightweight per-day summary used by the month grid and festival scans. */
export type DaySummary = {
  date: CalendarDay;
  sunrise: Date | null;
  windows: DayWindows | null;
  tithiNumber: number;
  tithiName: string;
  tithiEnd: Date;
  paksha: "Shukla" | "Krishna";
  tithiSpan: TithiSpan;
  amantaIndex: number;
  purnimantaIndex: number;
  adhikaMasa: boolean;
  nakshatra: string;
  sunRashiIndex: number;
};

const summaryCache = new Map<string, DaySummary>();
const SUMMARY_CACHE_LIMIT = 1200;

export function computeDaySummary(date: CalendarDay, city: City): DaySummary {
  const key = `${city.id}|${city.lat}|${city.lon}|${city.tz}|${date.year}-${date.month}-${date.day}`;
  const cached = summaryCache.get(key);
  if (cached) return cached;
  const observer = observerFor(city);
  const localMidnight = zonedToUtc(date.year, date.month, date.day, 0, 0, city.tz);
  const sunriseT = SearchRiseSet(Body.Sun, observer, +1, localMidnight, 2);
  const sunrise = sunriseT ? sunriseT.date : null;
  const reference = sunrise ?? new Date(localMidnight.getTime() + 6 * 3600_000);
  const sunsetT = SearchRiseSet(Body.Sun, observer, -1, reference, 2);
  const sunset = sunsetT ? sunsetT.date : null;
  const nextSunrise = sunset ? sunriseAfter(city, sunset) : null;
  const windows = sunrise && sunset && nextSunrise ? buildWindows(sunrise, sunset, nextSunrise) : null;
  const tithi = getTithi(reference);
  const month = getLunarMonth(reference, tithi.paksha);
  const summary: DaySummary = {
    date,
    sunrise,
    windows,
    tithiNumber: tithi.number,
    tithiName: tithi.name,
    tithiEnd: tithi.end,
    paksha: tithi.paksha,
    tithiSpan:
      sunrise && nextSunrise
        ? classifyTithiSpan(sunrise, nextSunrise)
        : { kind: "normal", skipped: null },
    amantaIndex: month.amantaIndex,
    purnimantaIndex: month.purnimantaIndex,
    adhikaMasa: month.adhika,
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
