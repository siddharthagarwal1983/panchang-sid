/** Lookup helpers over the generated per-date Ekadashi list. */
import { EKADASHI_DATES, type EkadashiDateStub } from "./ekadashi-dates.generated";
import { EKADASHI_SITEMAP_YEARS } from "./ekadashi-pages";

export type { EkadashiDateStub };
export { EKADASHI_DATES };

export function ekadashiPath(s: EkadashiDateStub): string {
  return `/vrats/ekadashi/${s.year}/${s.monthSlug}/${s.day}`;
}

/** Human slug label, e.g. "Kamada Ekadashi on March 28, 2026". */
export function ekadashiDateLabel(s: EkadashiDateStub): string {
  const monthName = s.monthSlug.charAt(0).toUpperCase() + s.monthSlug.slice(1);
  return `${monthName} ${s.day}, ${s.year}`;
}

export function findEkadashiDate(
  year: string | number,
  monthSlug: string,
  day: string | number,
): EkadashiDateStub | undefined {
  const y = Number(year);
  const d = Number(day);
  return EKADASHI_DATES.find(
    (s) => s.year === y && s.monthSlug === String(monthSlug).toLowerCase() && s.day === d,
  );
}

export function ekadashiDatesIn(year: number, monthNumber?: number): EkadashiDateStub[] {
  return EKADASHI_DATES.filter(
    (s) => s.year === year && (monthNumber === undefined || s.month === monthNumber),
  );
}

export function adjacentEkadashi(s: EkadashiDateStub) {
  const i = EKADASHI_DATES.indexOf(s);
  return { prev: EKADASHI_DATES[i - 1], next: EKADASHI_DATES[i + 1] };
}

/** Per-date pages listed in the sitemap (same years as the year/month pages). */
export const EKADASHI_DATE_PATHS: string[] = EKADASHI_DATES.filter((s) =>
  EKADASHI_SITEMAP_YEARS.includes(s.year),
).map(ekadashiPath);