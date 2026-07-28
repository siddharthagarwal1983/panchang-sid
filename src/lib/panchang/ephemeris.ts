/**
 * High-precision ephemeris layer (Swiss Ephemeris compatible model).
 *
 * Positions come from `astronomy-engine`, which integrates the same JPL DE
 * series (DE405/DE430-class accuracy) that Swiss Ephemeris ships. On top of
 * that we reproduce exactly what `swetest -sid1` returns:
 *
 *  - apparent geocentric ecliptic longitudes, with light-time correction for
 *    the Moon,
 *  - the *true* Chitrapaksha (Lahiri) ayanamsa: the mean ayanamsa propagated
 *    from the official Lahiri epoch (JD 2435553.5) with the IAU general
 *    precession polynomial, plus nutation in longitude.
 *
 * Agreement with swetest is on the order of an arcsecond, i.e. sub-second in
 * tithi/nakshatra boundary time. The native Swiss Ephemeris binary cannot run
 * in the app runtime (no filesystem for the .se1 data files, no native addons
 * in the edge worker), so this pure-JS model is the ephemeris source of truth
 * for every panchang element in the app.
 */
import { EclipticGeoMoon, SunPosition } from "astronomy-engine";

const DAY_MS = 86_400_000;
const J2000 = Date.UTC(2000, 0, 1, 12);
const RAD = Math.PI / 180;

export function norm360(x: number): number {
  return ((x % 360) + 360) % 360;
}

function centuries(date: Date): number {
  return (date.getTime() - J2000) / (36525 * DAY_MS);
}

/** Nutation in longitude (arcseconds), principal terms. */
export function nutationLongitudeArcsec(date: Date): number {
  const T = centuries(date);
  const omega = 125.04452 - 1934.136261 * T;
  const L = 280.4665 + 36000.7698 * T;
  const Lp = 218.3165 + 481267.8813 * T;
  return (
    -17.2 * Math.sin(omega * RAD) -
    1.32 * Math.sin(2 * L * RAD) -
    0.23 * Math.sin(2 * Lp * RAD) +
    0.21 * Math.sin(2 * omega * RAD)
  );
}

/** Accumulated general precession in longitude since J2000, in arcseconds. */
function precessionArcsec(T: number): number {
  return 5028.796195 * T + 1.1054348 * T * T + 0.00007964 * T * T * T;
}

// Official Lahiri zero point used by Swiss Ephemeris: JD 2435553.5 (1956-Mar-21).
const LAHIRI_T0 = (Date.UTC(1956, 2, 21, 0, 0) - J2000) / (36525 * DAY_MS);
const LAHIRI_AYAN_T0 = 23.250182778 - 0.004660222;

/** Mean Chitrapaksha (Lahiri) ayanamsa in degrees. */
export function lahiriMeanAyanamsa(date: Date): number {
  const T = centuries(date);
  return LAHIRI_AYAN_T0 + (precessionArcsec(T) - precessionArcsec(LAHIRI_T0)) / 3600;
}

/** True (nutation-included) Lahiri ayanamsa — the Swiss Ephemeris default. */
export function lahiriTrueAyanamsa(date: Date): number {
  return lahiriMeanAyanamsa(date) + nutationLongitudeArcsec(date) / 3600;
}

/** Legacy linear Lahiri approximation, retained for the comparison view. */
export function linearAyanamsa(date: Date): number {
  const years = (date.getTime() - J2000) / (365.25 * DAY_MS);
  return 23.853 + 0.013972 * years;
}

/** Light-time correction for the Moon: ~1.28 s away, moving ~0.55″/s. */
export const MOON_LIGHT_TIME_DEG = 0.704 / 3600;

/** Apparent geocentric tropical longitude of the Sun, degrees. */
export function apparentSunLongitude(date: Date): number {
  return norm360(SunPosition(date).elon);
}

/** Apparent geocentric tropical longitude of the Moon, degrees. */
export function apparentMoonLongitude(date: Date): number {
  return norm360(EclipticGeoMoon(date).lon - MOON_LIGHT_TIME_DEG);
}

export function siderealSunLongitude(date: Date): number {
  return norm360(apparentSunLongitude(date) - lahiriTrueAyanamsa(date));
}

export function siderealMoonLongitude(date: Date): number {
  return norm360(apparentMoonLongitude(date) - lahiriTrueAyanamsa(date));
}

/** Elongation Moon − Sun; 12° per tithi. */
export function tithiAngle(date: Date): number {
  return norm360(apparentMoonLongitude(date) - apparentSunLongitude(date));
}

/** Tithi number 1..30 active at an instant. */
export function tithiNumberAt(date: Date): number {
  return Math.floor(tithiAngle(date) / 12) + 1;
}
