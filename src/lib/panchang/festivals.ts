import type { City } from "./cities";
import { type DaySummary, computeDaySummary, tithiCoverage } from "./core";
import { MASA_NAMES } from "./names";
import { type CalendarDay, addDays } from "./tz";

export type FestivalCategory = "major" | "ekadashi" | "moon" | "chaturthi" | "pradosh" | "solar";

/**
 * Which local time window the tithi must be active in for the observance to
 * fall on that day (the nirnaya rule).
 *
 *  - `udaya`     — tithi running at local sunrise (vrats, ekadashi, pradosh)
 *  - `madhyahna` — tithi covering the midday window (Ganesh Chaturthi)
 *  - `pradosha`  — tithi covering the evening window (Diwali Lakshmi Puja)
 *  - `nishita`   — tithi covering local midnight (Janmashtami, Shivratri)
 */
export type NirnayaWindow = "udaya" | "madhyahna" | "pradosha" | "nishita";

export type Festival = {
  id: string;
  name: string;
  note: string;
  category: FestivalCategory;
  /** The rule that placed this observance on this date. */
  window?: NirnayaWindow;
};

type LunarRule = Festival & { month: number; tithi: number; window: NirnayaWindow };

/** month: amanta index (0 = Chaitra). tithi: 1-15 Shukla, 16-30 Krishna. */
const LUNAR_RULES: LunarRule[] = [
  { id: "ugadi", name: "Ugadi / Gudi Padwa", note: "Lunar new year", category: "major", month: 0, tithi: 1, window: "udaya" },
  { id: "ram-navami", name: "Rama Navami", note: "Birth of Sri Rama", category: "major", month: 0, tithi: 9, window: "madhyahna" },
  { id: "hanuman-jayanti", name: "Hanuman Jayanti", note: "Chaitra Purnima", category: "major", month: 0, tithi: 15, window: "udaya" },
  { id: "akshaya-tritiya", name: "Akshaya Tritiya", note: "Auspicious for new beginnings", category: "major", month: 1, tithi: 3, window: "madhyahna" },
  { id: "narasimha", name: "Narasimha Jayanti", note: "Vaishakha Shukla Chaturdashi", category: "major", month: 1, tithi: 14, window: "pradosha" },
  { id: "buddha-purnima", name: "Buddha Purnima", note: "Vaishakha Purnima", category: "major", month: 1, tithi: 15, window: "udaya" },
  { id: "vat-savitri", name: "Vat Savitri Vrat", note: "Jyeshtha Amavasya", category: "major", month: 2, tithi: 30, window: "udaya" },
  { id: "guru-purnima", name: "Guru Purnima", note: "Ashadha Purnima", category: "major", month: 3, tithi: 15, window: "udaya" },
  { id: "hariyali-teej", name: "Hariyali Teej", note: "Shravana Shukla Tritiya", category: "major", month: 4, tithi: 3, window: "udaya" },
  { id: "raksha-bandhan", name: "Raksha Bandhan", note: "Shravana Purnima", category: "major", month: 4, tithi: 15, window: "madhyahna" },
  { id: "janmashtami", name: "Krishna Janmashtami", note: "Birth of Sri Krishna", category: "major", month: 4, tithi: 23, window: "nishita" },
  { id: "hartalika", name: "Hartalika Teej", note: "Bhadrapada Shukla Tritiya", category: "major", month: 5, tithi: 3, window: "udaya" },
  { id: "ganesh-chaturthi", name: "Ganesh Chaturthi", note: "Vinayaka Chavithi", category: "major", month: 5, tithi: 4, window: "madhyahna" },
  { id: "onam", name: "Thiruvonam", note: "Shravana nakshatra in Bhadrapada", category: "major", month: 5, tithi: 12, window: "udaya" },
  { id: "anant-chaturdashi", name: "Anant Chaturdashi", note: "Ganesh Visarjan", category: "major", month: 5, tithi: 14, window: "udaya" },
  { id: "pitru-paksha", name: "Mahalaya Amavasya", note: "End of Pitru Paksha", category: "major", month: 5, tithi: 30, window: "madhyahna" },
  { id: "navratri", name: "Sharada Navratri begins", note: "Ghatasthapana", category: "major", month: 6, tithi: 1, window: "udaya" },
  { id: "durga-ashtami", name: "Durga Ashtami", note: "Maha Ashtami", category: "major", month: 6, tithi: 8, window: "udaya" },
  { id: "maha-navami", name: "Maha Navami", note: "Ayudha Puja", category: "major", month: 6, tithi: 9, window: "udaya" },
  { id: "dussehra", name: "Vijayadashami", note: "Dussehra", category: "major", month: 6, tithi: 10, window: "madhyahna" },
  { id: "sharad-purnima", name: "Sharad Purnima", note: "Kojagari Purnima", category: "major", month: 6, tithi: 15, window: "nishita" },
  { id: "karva-chauth", name: "Karva Chauth", note: "Kartika Krishna Chaturthi", category: "major", month: 6, tithi: 19, window: "udaya" },
  { id: "dhanteras", name: "Dhanteras", note: "Dhantrayodashi", category: "major", month: 6, tithi: 28, window: "pradosha" },
  { id: "naraka", name: "Naraka Chaturdashi", note: "Chhoti Diwali", category: "major", month: 6, tithi: 29, window: "udaya" },
  { id: "diwali", name: "Diwali — Lakshmi Puja", note: "Kartika Amavasya", category: "major", month: 6, tithi: 30, window: "pradosha" },
  { id: "govardhan", name: "Govardhan Puja", note: "Annakut / Bali Pratipada", category: "major", month: 7, tithi: 1, window: "udaya" },
  { id: "bhai-dooj", name: "Bhai Dooj", note: "Yama Dwitiya", category: "major", month: 7, tithi: 2, window: "madhyahna" },
  { id: "chhath", name: "Chhath Puja", note: "Kartika Shukla Shashthi", category: "major", month: 7, tithi: 6, window: "pradosha" },
  { id: "tulsi-vivah", name: "Tulsi Vivah", note: "Kartika Shukla Dwadashi", category: "major", month: 7, tithi: 12, window: "pradosha" },
  { id: "kartik-purnima", name: "Kartika Purnima", note: "Dev Deepawali", category: "major", month: 7, tithi: 15, window: "udaya" },
  { id: "gita-jayanti", name: "Gita Jayanti", note: "Mokshada Ekadashi", category: "major", month: 8, tithi: 11, window: "udaya" },
  { id: "vaikuntha", name: "Vaikuntha Ekadashi", note: "Pausha Shukla Ekadashi", category: "major", month: 9, tithi: 11, window: "udaya" },
  { id: "vasant-panchami", name: "Vasant Panchami", note: "Saraswati Puja", category: "major", month: 10, tithi: 5, window: "madhyahna" },
  { id: "magha-purnima", name: "Magha Purnima", note: "Maghi Purnima", category: "major", month: 10, tithi: 15, window: "udaya" },
  { id: "shivratri", name: "Maha Shivratri", note: "Magha Krishna Chaturdashi", category: "major", month: 10, tithi: 29, window: "nishita" },
  { id: "holika", name: "Holika Dahan", note: "Phalguna Purnima", category: "major", month: 11, tithi: 15, window: "pradosha" },
  { id: "holi", name: "Holi", note: "Dhulandi / Rangwali Holi", category: "major", month: 11, tithi: 16, window: "udaya" },
];

function recurring(summary: DaySummary): Festival[] {
  const out: Festival[] = [];
  const t = summary.tithiNumber;
  if (t === 11 || t === 26) {
    out.push({ id: "ekadashi", name: "Ekadashi", note: `${summary.paksha} Paksha fasting day`, category: "ekadashi", window: "udaya" });
  }
  if (t === 15) out.push({ id: "purnima", name: "Purnima", note: "Full moon", category: "moon", window: "udaya" });
  if (t === 30) out.push({ id: "amavasya", name: "Amavasya", note: "New moon", category: "moon", window: "udaya" });
  if (t === 4) out.push({ id: "vinayaka", name: "Vinayaka Chaturthi", note: "Shukla Chaturthi", category: "chaturthi", window: "udaya" });
  if (t === 19) out.push({ id: "sankashti", name: "Sankashti Chaturthi", note: "Krishna Chaturthi", category: "chaturthi", window: "udaya" });
  if (t === 13 || t === 28) out.push({ id: "pradosh", name: "Pradosh Vrat", note: "Trayodashi evening vrat", category: "pradosh", window: "udaya" });
  return out;
}

const SOLAR_INGRESS: Record<number, { id: string; name: string; note: string }> = {
  9: { id: "makar-sankranti", name: "Makar Sankranti / Pongal", note: "Sun enters Makara" },
  0: { id: "mesha-sankranti", name: "Mesha Sankranti", note: "Tamil & Bengali new year" },
};

/**
 * Minutes of the rule's tithi that fall inside the rule's window on this day.
 * Returns 0 when the day cannot host the observance at all.
 */
function ruleScore(summary: DaySummary, rule: LunarRule): number {
  // Adhika (leap) months carry no festivals of the natural month they repeat.
  if (summary.adhikaMasa) return 0;
  if (rule.window === "udaya") {
    return rule.month === summary.amantaIndex && rule.tithi === summary.tithiNumber ? 1 : 0;
  }
  const windows = summary.windows;
  if (!windows) return 0;
  if (rule.month !== summary.amantaIndex) return 0;
  // The window can hold the tithi running at sunrise or the one that follows.
  const spread = (rule.tithi - summary.tithiNumber + 30) % 30;
  if (spread > 1 && spread < 29) return 0;
  return tithiCoverage(rule.tithi, windows[rule.window]);
}

/**
 * Nirnaya engine: decide which observances belong to `date` at `city`,
 * comparing the neighbouring days so a window rule lands on exactly one day
 * even when the tithi is vriddhi (spans two sunrises) or kshaya (skipped).
 */
export function resolveFestivals(date: CalendarDay, city: City): Festival[] {
  const summary = computeDaySummary(date, city);
  const previous = computeDaySummary(addDays(date, -1), city);
  const next = computeDaySummary(addDays(date, 1), city);
  const out: Festival[] = [];

  for (const rule of LUNAR_RULES) {
    const score = ruleScore(summary, rule);
    if (score <= 0) continue;
    if (rule.window !== "udaya") {
      // Keep the day with the greatest coverage; ties go to the earlier day.
      if (ruleScore(previous, rule) >= score) continue;
      if (ruleScore(next, rule) > score) continue;
    }
    out.push({ id: rule.id, name: rule.name, note: rule.note, category: rule.category, window: rule.window });
  }

  if (previous.sunRashiIndex !== summary.sunRashiIndex) {
    const ingress = SOLAR_INGRESS[summary.sunRashiIndex];
    if (ingress) out.push({ ...ingress, category: "solar", window: "udaya" });
  }
  out.push(...recurring(summary));
  return out;
}

/** Sunrise-only resolution, kept for callers that already hold summaries. */
export function festivalsForSummary(summary: DaySummary, previous?: DaySummary): Festival[] {
  const out: Festival[] = [];
  for (const rule of LUNAR_RULES) {
    if (rule.window === "udaya" && rule.month === summary.amantaIndex && rule.tithi === summary.tithiNumber && !summary.adhikaMasa) {
      out.push({ id: rule.id, name: rule.name, note: rule.note, category: rule.category, window: rule.window });
    }
  }
  if (previous && previous.sunRashiIndex !== summary.sunRashiIndex) {
    const ingress = SOLAR_INGRESS[summary.sunRashiIndex];
    if (ingress) out.push({ ...ingress, category: "solar", window: "udaya" });
  }
  out.push(...recurring(summary));
  return out;
}

export type FestivalDay = { date: CalendarDay; summary: DaySummary; festivals: Festival[] };

export function scanFestivals(start: CalendarDay, days: number, city: City): FestivalDay[] {
  const out: FestivalDay[] = [];
  for (let i = 0; i < days; i++) {
    const date = addDays(start, i);
    out.push({ date, summary: computeDaySummary(date, city), festivals: resolveFestivals(date, city) });
  }
  return out;
}

export function masaName(index: number): string {
  return MASA_NAMES[index];
}
