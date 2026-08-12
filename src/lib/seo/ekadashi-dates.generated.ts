/**
 * Generated list of Ekadashi dates for the reference city (see
 * src/lib/panchang/parana-snapshot.ts). Used to validate per-date routes and to
 * build the sitemap without running the ephemeris at request time.
 *
 * Regenerate with: bun scripts/generate-ekadashi-dates.ts (dates shift by at most a day for
 * far-west cities; the page itself recomputes for the visitor's location).
 */
export type EkadashiDateStub = {
  year: number;
  month: number;
  day: number;
  monthSlug: string;
  name: string;
  paksha: "Shukla" | "Krishna";
  masa: string;
  vriddhi?: "smarta" | "vaishnava";
};

export const EKADASHI_DATES: EkadashiDateStub[] = [
  { year: 2026, month: 1, day: 13, monthSlug: "january", name: "Shattila Ekadashi", paksha: "Krishna", masa: "Magha", vriddhi: "smarta" },
  { year: 2026, month: 1, day: 14, monthSlug: "january", name: "Shattila Ekadashi", paksha: "Krishna", masa: "Magha", vriddhi: "vaishnava" },
  { year: 2026, month: 1, day: 28, monthSlug: "january", name: "Jaya Ekadashi", paksha: "Shukla", masa: "Magha" },
  { year: 2026, month: 2, day: 12, monthSlug: "february", name: "Vijaya Ekadashi", paksha: "Krishna", masa: "Phalguna" },
  { year: 2026, month: 2, day: 27, monthSlug: "february", name: "Amalaki Ekadashi", paksha: "Shukla", masa: "Phalguna" },
  { year: 2026, month: 3, day: 14, monthSlug: "march", name: "Papmochani Ekadashi", paksha: "Krishna", masa: "Chaitra" },
  { year: 2026, month: 3, day: 28, monthSlug: "march", name: "Kamada Ekadashi", paksha: "Shukla", masa: "Chaitra" },
  { year: 2026, month: 4, day: 13, monthSlug: "april", name: "Varuthini Ekadashi", paksha: "Krishna", masa: "Vaishakha" },
  { year: 2026, month: 4, day: 27, monthSlug: "april", name: "Mohini Ekadashi", paksha: "Shukla", masa: "Vaishakha" },
  { year: 2026, month: 5, day: 12, monthSlug: "may", name: "Apara Ekadashi", paksha: "Krishna", masa: "Jyeshtha" },
  { year: 2026, month: 5, day: 26, monthSlug: "may", name: "Padmini Ekadashi", paksha: "Shukla", masa: "Jyeshtha" },
  { year: 2026, month: 6, day: 11, monthSlug: "june", name: "Parama Ekadashi", paksha: "Krishna", masa: "Ashadha" },
  { year: 2026, month: 6, day: 25, monthSlug: "june", name: "Nirjala Ekadashi", paksha: "Shukla", masa: "Jyeshtha" },
  { year: 2026, month: 7, day: 10, monthSlug: "july", name: "Yogini Ekadashi", paksha: "Krishna", masa: "Ashadha" },
  { year: 2026, month: 7, day: 24, monthSlug: "july", name: "Devshayani Ekadashi", paksha: "Shukla", masa: "Ashadha" },
  { year: 2026, month: 8, day: 8, monthSlug: "august", name: "Kamika Ekadashi", paksha: "Krishna", masa: "Shravana" },
  { year: 2026, month: 8, day: 23, monthSlug: "august", name: "Shravana Putrada Ekadashi", paksha: "Shukla", masa: "Shravana" },
  { year: 2026, month: 9, day: 7, monthSlug: "september", name: "Aja Ekadashi", paksha: "Krishna", masa: "Bhadrapada" },
  { year: 2026, month: 9, day: 22, monthSlug: "september", name: "Parsva (Parivartini) Ekadashi", paksha: "Shukla", masa: "Bhadrapada" },
  { year: 2026, month: 10, day: 6, monthSlug: "october", name: "Indira Ekadashi", paksha: "Krishna", masa: "Ashwina" },
  { year: 2026, month: 10, day: 21, monthSlug: "october", name: "Papankusha Ekadashi", paksha: "Shukla", masa: "Ashwina" },
  { year: 2026, month: 11, day: 4, monthSlug: "november", name: "Rama Ekadashi", paksha: "Krishna", masa: "Kartika" },
  { year: 2026, month: 11, day: 20, monthSlug: "november", name: "Devutthana (Prabodhini) Ekadashi", paksha: "Shukla", masa: "Kartika" },
  { year: 2026, month: 12, day: 4, monthSlug: "december", name: "Utpanna Ekadashi", paksha: "Krishna", masa: "Margashirsha" },
  { year: 2026, month: 12, day: 20, monthSlug: "december", name: "Mokshada Ekadashi", paksha: "Shukla", masa: "Margashirsha" },
  { year: 2027, month: 1, day: 2, monthSlug: "january", name: "Saphala Ekadashi", paksha: "Krishna", masa: "Pausha" },
  { year: 2027, month: 1, day: 18, monthSlug: "january", name: "Pausha Putrada (Vaikuntha) Ekadashi", paksha: "Shukla", masa: "Pausha" },
  { year: 2027, month: 2, day: 1, monthSlug: "february", name: "Shattila Ekadashi", paksha: "Krishna", masa: "Magha" },
  { year: 2027, month: 2, day: 17, monthSlug: "february", name: "Jaya Ekadashi", paksha: "Shukla", masa: "Magha" },
  { year: 2027, month: 3, day: 3, monthSlug: "march", name: "Vijaya Ekadashi", paksha: "Krishna", masa: "Phalguna" },
  { year: 2027, month: 3, day: 18, monthSlug: "march", name: "Amalaki Ekadashi", paksha: "Shukla", masa: "Phalguna" },
  { year: 2027, month: 4, day: 2, monthSlug: "april", name: "Papmochani Ekadashi", paksha: "Krishna", masa: "Chaitra" },
  { year: 2027, month: 4, day: 16, monthSlug: "april", name: "Kamada Ekadashi", paksha: "Shukla", masa: "Chaitra" },
  { year: 2027, month: 5, day: 2, monthSlug: "may", name: "Varuthini Ekadashi", paksha: "Krishna", masa: "Vaishakha" },
  { year: 2027, month: 5, day: 16, monthSlug: "may", name: "Mohini Ekadashi", paksha: "Shukla", masa: "Vaishakha" },
  { year: 2027, month: 5, day: 31, monthSlug: "may", name: "Apara Ekadashi", paksha: "Krishna", masa: "Jyeshtha" },
  { year: 2027, month: 6, day: 14, monthSlug: "june", name: "Nirjala Ekadashi", paksha: "Shukla", masa: "Jyeshtha" },
  { year: 2027, month: 6, day: 30, monthSlug: "june", name: "Yogini Ekadashi", paksha: "Krishna", masa: "Ashadha" },
  { year: 2027, month: 7, day: 13, monthSlug: "july", name: "Devshayani Ekadashi", paksha: "Shukla", masa: "Ashadha" },
  { year: 2027, month: 7, day: 29, monthSlug: "july", name: "Kamika Ekadashi", paksha: "Krishna", masa: "Shravana" },
  { year: 2027, month: 8, day: 12, monthSlug: "august", name: "Shravana Putrada Ekadashi", paksha: "Shukla", masa: "Shravana" },
  { year: 2027, month: 8, day: 27, monthSlug: "august", name: "Aja Ekadashi", paksha: "Krishna", masa: "Bhadrapada" },
  { year: 2027, month: 9, day: 11, monthSlug: "september", name: "Parsva (Parivartini) Ekadashi", paksha: "Shukla", masa: "Bhadrapada" },
  { year: 2027, month: 9, day: 26, monthSlug: "september", name: "Indira Ekadashi", paksha: "Krishna", masa: "Ashwina" },
  { year: 2027, month: 10, day: 10, monthSlug: "october", name: "Papankusha Ekadashi", paksha: "Shukla", masa: "Ashwina" },
  { year: 2027, month: 10, day: 25, monthSlug: "october", name: "Rama Ekadashi", paksha: "Krishna", masa: "Kartika" },
  { year: 2027, month: 11, day: 9, monthSlug: "november", name: "Devutthana (Prabodhini) Ekadashi", paksha: "Shukla", masa: "Kartika" },
  { year: 2027, month: 11, day: 23, monthSlug: "november", name: "Utpanna Ekadashi", paksha: "Krishna", masa: "Margashirsha" },
  { year: 2027, month: 12, day: 9, monthSlug: "december", name: "Mokshada Ekadashi", paksha: "Shukla", masa: "Margashirsha" },
  { year: 2027, month: 12, day: 23, monthSlug: "december", name: "Saphala Ekadashi", paksha: "Krishna", masa: "Pausha" },
];
