/** Shared month metadata for the Ekadashi year/month pages and the sitemap. */

export const MONTHS: { slug: string; name: string; number: number }[] = [
  { slug: "january", name: "January", number: 1 },
  { slug: "february", name: "February", number: 2 },
  { slug: "march", name: "March", number: 3 },
  { slug: "april", name: "April", number: 4 },
  { slug: "may", name: "May", number: 5 },
  { slug: "june", name: "June", number: 6 },
  { slug: "july", name: "July", number: 7 },
  { slug: "august", name: "August", number: 8 },
  { slug: "september", name: "September", number: 9 },
  { slug: "october", name: "October", number: 10 },
  { slug: "november", name: "November", number: 11 },
  { slug: "december", name: "December", number: 12 },
];

export function monthBySlug(slug: string) {
  return MONTHS.find((m) => m.slug === slug.toLowerCase());
}

/** Years that get their own crawlable Ekadashi calendar page. */
export const EKADASHI_MIN_YEAR = 2020;
export const EKADASHI_MAX_YEAR = 2035;
/** Years listed in the sitemap and in on-page year switchers. */
export const EKADASHI_SITEMAP_YEARS = [2026, 2027];

export function isEkadashiYear(value: string): boolean {
  if (!/^\d{4}$/.test(value)) return false;
  const year = Number(value);
  return year >= EKADASHI_MIN_YEAR && year <= EKADASHI_MAX_YEAR;
}