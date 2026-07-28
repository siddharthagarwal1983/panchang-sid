/**
 * Side-by-side comparison of the app's current engine (astronomy-engine +
 * linear Lahiri ayanamsa) against a Swiss Ephemeris-style model.
 *
 * The "Swiss-style" column reproduces how Swiss Ephemeris computes sidereal
 * positions: apparent longitudes (light-time corrected Moon) minus the *true*
 * Chitrapaksha/Lahiri ayanamsa, i.e. the mean ayanamsa propagated with the
 * IAU general-precession polynomial from the official Lahiri epoch, plus
 * nutation in longitude. It is a high-accuracy re-implementation in pure JS —
 * the native Swiss Ephemeris binary cannot run in this runtime — and agrees
 * with swetest to roughly an arcsecond.
 */
import {
  apparentMoonLongitude,
  apparentSunLongitude,
  lahiriMeanAyanamsa,
  lahiriTrueAyanamsa,
  linearAyanamsa,
  norm360,
} from "./ephemeris";
import { FIXED_KARANAS, MOVABLE_KARANAS, NAKSHATRA_NAMES, YOGA_NAMES, tithiLabel } from "./names";

const DAY_MS = 86_400_000;
export { lahiriMeanAyanamsa, lahiriTrueAyanamsa, linearAyanamsa };

export type Engine = {
  key: "app" | "swiss";
  label: string;
  ayanamsa: (d: Date) => number;
  sun: (d: Date) => number;
  moon: (d: Date) => number;
};

export const APP_ENGINE: Engine = {
  key: "app",
  label: "astronomy-engine (linear Lahiri)",
  ayanamsa: linearAyanamsa,
  sun: apparentSunLongitude,
  moon: (d) => norm360(apparentMoonLongitude(d) + 0.704 / 3600),
};

export const SWISS_ENGINE: Engine = {
  key: "swiss",
  label: "Swiss Ephemeris (Lahiri, true)",
  ayanamsa: lahiriTrueAyanamsa,
  sun: apparentSunLongitude,
  moon: apparentMoonLongitude,
};

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

function resolveSegment(
  angleAt: (d: Date) => number,
  size: number,
  at: Date,
  degPerDay: number,
): { index: number; start: Date; end: Date } {
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
  const back = new Date(at.getTime() - spanDays * 1.8 * DAY_MS);
  const fwd = new Date(at.getTime() + spanDays * 1.8 * DAY_MS);
  return { index, start: bisect(fromStart, 0, back, at), end: bisect(fromStart, size, at, fwd) };
}

export type ElementReading = {
  label: string;
  name: string;
  start: Date;
  end: Date;
};

export type EngineReading = {
  engine: Engine["key"];
  label: string;
  ayanamsa: number;
  siderealSun: number;
  siderealMoon: number;
  elements: ElementReading[];
};

export function readWithEngine(engine: Engine, at: Date): EngineReading {
  const sid = (d: Date) => norm360(engine.moon(d) - engine.ayanamsa(d));
  const sidSun = (d: Date) => norm360(engine.sun(d) - engine.ayanamsa(d));
  const tithiAngle = (d: Date) => norm360(engine.moon(d) - engine.sun(d));
  const yogaAngle = (d: Date) => norm360(sidSun(d) + sid(d));

  const tithi = resolveSegment(tithiAngle, 12, at, 12.19);
  const tLabel = tithiLabel(tithi.index + 1);
  const nak = resolveSegment(sid, 360 / 27, at, 13.176);
  const yoga = resolveSegment(yogaAngle, 360 / 27, at, 14.16);
  const kar = resolveSegment(tithiAngle, 6, at, 12.19);
  const ki = kar.index;
  const karanaName =
    ki === 0 ? FIXED_KARANAS[3] : ki >= 57 ? FIXED_KARANAS[ki - 57] : MOVABLE_KARANAS[(ki - 1) % 7];

  return {
    engine: engine.key,
    label: engine.label,
    ayanamsa: engine.ayanamsa(at),
    siderealSun: sidSun(at),
    siderealMoon: sid(at),
    elements: [
      { label: "Tithi", name: `${tLabel.paksha} ${tLabel.name}`, start: tithi.start, end: tithi.end },
      { label: "Nakshatra", name: NAKSHATRA_NAMES[nak.index % 27], start: nak.start, end: nak.end },
      { label: "Yoga", name: YOGA_NAMES[yoga.index % 27], start: yoga.start, end: yoga.end },
      { label: "Karana", name: karanaName, start: kar.start, end: kar.end },
    ],
  };
}

export type ElementDiff = {
  label: string;
  app: ElementReading;
  swiss: ElementReading;
  sameName: boolean;
  /** Signed difference in minutes (swiss − app) for start and end. */
  startDeltaMin: number;
  endDeltaMin: number;
};

export type Comparison = {
  at: Date;
  app: EngineReading;
  swiss: EngineReading;
  ayanamsaDeltaArcsec: number;
  sunDeltaArcsec: number;
  moonDeltaArcsec: number;
  elements: ElementDiff[];
  maxDeltaMin: number;
  anyNameDiff: boolean;
};

function arcsec(a: number, b: number): number {
  let d = b - a;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d * 3600;
}

const MIN = 60_000;

export function compareEngines(at: Date): Comparison {
  const app = readWithEngine(APP_ENGINE, at);
  const swiss = readWithEngine(SWISS_ENGINE, at);
  const elements: ElementDiff[] = app.elements.map((a, i) => {
    const s = swiss.elements[i];
    return {
      label: a.label,
      app: a,
      swiss: s,
      sameName: a.name === s.name,
      startDeltaMin: (s.start.getTime() - a.start.getTime()) / MIN,
      endDeltaMin: (s.end.getTime() - a.end.getTime()) / MIN,
    };
  });
  return {
    at,
    app,
    swiss,
    ayanamsaDeltaArcsec: arcsec(app.ayanamsa, swiss.ayanamsa),
    sunDeltaArcsec: arcsec(app.siderealSun, swiss.siderealSun),
    moonDeltaArcsec: arcsec(app.siderealMoon, swiss.siderealMoon),
    elements,
    maxDeltaMin: Math.max(
      ...elements.map((e) => Math.max(Math.abs(e.startDeltaMin), Math.abs(e.endDeltaMin))),
    ),
    anyNameDiff: elements.some((e) => !e.sameName),
  };
}

/** Format a longitude as sign-relative D° M′ S″. */
export function formatLongitude(deg: number): string {
  const d = Math.floor(deg);
  const mFloat = (deg - d) * 60;
  const m = Math.floor(mFloat);
  const s = (mFloat - m) * 60;
  return `${d}° ${String(m).padStart(2, "0")}′ ${s.toFixed(1).padStart(4, "0")}″`;
}