import type { City } from "./cities";
import { type DaySummary, computeDaySummary } from "./core";
import { MASA_NAMES } from "./names";
import { type CalendarDay, addDays } from "./tz";

export type FestivalCategory = "major" | "ekadashi" | "moon" | "chaturthi" | "pradosh" | "solar";

export type Festival = {
  id: string;
  name: string;
  note: string;
  category: FestivalCategory;
};

type LunarRule = Festival & { month: number; tithi: number };

/** month: amanta index (0 = Chaitra). tithi: 1-15 Shukla, 16-30 Krishna. */
const LUNAR_RULES: LunarRule[] = [
  { id: "ugadi", name: "Ugadi / Gudi Padwa", note: "Lunar new year", category: "major", month: 0, tithi: 1 },
  { id: "ram-navami", name: "Rama Navami", note: "Birth of Sri Rama", category: "major", month: 0, tithi: 9 },
  { id: "hanuman-jayanti", name: "Hanuman Jayanti", note: "Chaitra Purnima", category: "major", month: 0, tithi: 15 },
  { id: "akshaya-tritiya", name: "Akshaya Tritiya", note: "Auspicious for new beginnings", category: "major", month: 1, tithi: 3 },
  { id: "narasimha", name: "Narasimha Jayanti", note: "Vaishakha Shukla Chaturdashi", category: "major", month: 1, tithi: 14 },
  { id: "buddha-purnima", name: "Buddha Purnima", note: "Vaishakha Purnima", category: "major", month: 1, tithi: 15 },
  { id: "vat-savitri", name: "Vat Savitri Vrat", note: "Jyeshtha Amavasya", category: "major", month: 2, tithi: 30 },
  { id: "guru-purnima", name: "Guru Purnima", note: "Ashadha Purnima", category: "major", month: 3, tithi: 15 },
  { id: "hariyali-teej", name: "Hariyali Teej", note: "Shravana Shukla Tritiya", category: "major", month: 4, tithi: 3 },
  { id: "raksha-bandhan", name: "Raksha Bandhan", note: "Shravana Purnima", category: "major", month: 4, tithi: 15 },
  { id: "janmashtami", name: "Krishna Janmashtami", note: "Birth of Sri Krishna", category: "major", month: 4, tithi: 23 },
  { id: "hartalika", name: "Hartalika Teej", note: "Bhadrapada Shukla Tritiya", category: "major", month: 5, tithi: 3 },
  { id: "ganesh-chaturthi", name: "Ganesh Chaturthi", note: "Vinayaka Chavithi", category: "major", month: 5, tithi: 4 },
  { id: "onam", name: "Thiruvonam", note: "Shravana nakshatra in Bhadrapada", category: "major", month: 5, tithi: 12 },
  { id: "anant-chaturdashi", name: "Anant Chaturdashi", note: "Ganesh Visarjan", category: "major", month: 5, tithi: 14 },
  { id: "pitru-paksha", name: "Mahalaya Amavasya", note: "End of Pitru Paksha", category: "major", month: 5, tithi: 30 },
  { id: "navratri", name: "Sharada Navratri begins", note: "Ghatasthapana", category: "major", month: 6, tithi: 1 },
  { id: "durga-ashtami", name: "Durga Ashtami", note: "Maha Ashtami", category: "major", month: 6, tithi: 8 },
  { id: "maha-navami", name: "Maha Navami", note: "Ayudha Puja", category: "major", month: 6, tithi: 9 },
  { id: "dussehra", name: "Vijayadashami", note: "Dussehra", category: "major", month: 6, tithi: 10 },
  { id: "sharad-purnima", name: "Sharad Purnima", note: "Kojagari Purnima", category: "major", month: 6, tithi: 15 },
  { id: "karva-chauth", name: "Karva Chauth", note: "Kartika Krishna Chaturthi", category: "major", month: 6, tithi: 19 },
  { id: "dhanteras", name: "Dhanteras", note: "Dhantrayodashi", category: "major", month: 6, tithi: 28 },
  { id: "naraka", name: "Naraka Chaturdashi", note: "Chhoti Diwali", category: "major", month: 6, tithi: 29 },
  { id: "diwali", name: "Diwali — Lakshmi Puja", note: "Kartika Amavasya", category: "major", month: 6, tithi: 30 },
  { id: "govardhan", name: "Govardhan Puja", note: "Annakut / Bali Pratipada", category: "major", month: 7, tithi: 1 },
  { id: "bhai-dooj", name: "Bhai Dooj", note: "Yama Dwitiya", category: "major", month: 7, tithi: 2 },
  { id: "chhath", name: "Chhath Puja", note: "Kartika Shukla Shashthi", category: "major", month: 7, tithi: 6 },
  { id: "tulsi-vivah", name: "Tulsi Vivah", note: "Kartika Shukla Dwadashi", category: "major", month: 7, tithi: 12 },
  { id: "kartik-purnima", name: "Kartika Purnima", note: "Dev Deepawali", category: "major", month: 7, tithi: 15 },
  { id: "gita-jayanti", name: "Gita Jayanti", note: "Mokshada Ekadashi", category: "major", month: 8, tithi: 11 },
  { id: "vaikuntha", name: "Vaikuntha Ekadashi", note: "Pausha Shukla Ekadashi", category: "major", month: 9, tithi: 11 },
  { id: "vasant-panchami", name: "Vasant Panchami", note: "Saraswati Puja", category: "major", month: 10, tithi: 5 },
  { id: "magha-purnima", name: "Magha Purnima", note: "Maghi Purnima", category: "major", month: 10, tithi: 15 },
  { id: "shivratri", name: "Maha Shivratri", note: "Magha Krishna Chaturdashi", category: "major", month: 10, tithi: 29 },
  { id: "holika", name: "Holika Dahan", note: "Phalguna Purnima", category: "major", month: 11, tithi: 15 },
  { id: "holi", name: "Holi", note: "Dhulandi / Rangwali Holi", category: "major", month: 11, tithi: 16 },
];

function recurring(summary: DaySummary): Festival[] {
  const out: Festival[] = [];
  const t = summary.tithiNumber;
  if (t === 11 || t === 26) {
    out.push({ id: "ekadashi", name: "Ekadashi", note: `${summary.paksha} Paksha fasting day`, category: "ekadashi" });
  }
  if (t === 15) out.push({ id: "purnima", name: "Purnima", note: "Full moon", category: "moon" });
  if (t === 30) out.push({ id: "amavasya", name: "Amavasya", note: "New moon", category: "moon" });
  if (t === 4) out.push({ id: "vinayaka", name: "Vinayaka Chaturthi", note: "Shukla Chaturthi", category: "chaturthi" });
  if (t === 19) out.push({ id: "sankashti", name: "Sankashti Chaturthi", note: "Krishna Chaturthi", category: "chaturthi" });
  if (t === 13 || t === 28) out.push({ id: "pradosh", name: "Pradosh Vrat", note: "Trayodashi evening vrat", category: "pradosh" });
  return out;
}

const SOLAR_INGRESS: Record<number, { id: string; name: string; note: string }> = {
  9: { id: "makar-sankranti", name: "Makar Sankranti / Pongal", note: "Sun enters Makara" },
  0: { id: "mesha-sankranti", name: "Mesha Sankranti", note: "Tamil & Bengali new year" },
};

/** Festivals falling on a given day, using the tithi prevailing at sunrise. */
export function festivalsForSummary(summary: DaySummary, previous?: DaySummary): Festival[] {
  const out: Festival[] = [];
  for (const rule of LUNAR_RULES) {
    if (rule.month === summary.amantaIndex && rule.tithi === summary.tithiNumber) {
      out.push({ id: rule.id, name: rule.name, note: rule.note, category: rule.category });
    }
  }
  if (previous && previous.sunRashiIndex !== summary.sunRashiIndex) {
    const ingress = SOLAR_INGRESS[summary.sunRashiIndex];
    if (ingress) out.push({ ...ingress, category: "solar" });
  }
  out.push(...recurring(summary));
  return out;
}

export type FestivalDay = { date: CalendarDay; summary: DaySummary; festivals: Festival[] };

export function scanFestivals(start: CalendarDay, days: number, city: City): FestivalDay[] {
  const out: FestivalDay[] = [];
  let previous = computeDaySummary(addDays(start, -1), city);
  for (let i = 0; i < days; i++) {
    const date = addDays(start, i);
    const summary = computeDaySummary(date, city);
    out.push({ date, summary, festivals: festivalsForSummary(summary, previous) });
    previous = summary;
  }
  return out;
}

export function masaName(index: number): string {
  return MASA_NAMES[index];
}