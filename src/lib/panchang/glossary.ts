/**
 * Plain-English meanings for the Sanskrit terms used across the app.
 * Used by "Guided" reading mode so second-generation users get context,
 * while "Traditional" mode keeps the terse almanac wording.
 */

export const CONCEPTS: Record<string, { title: string; short: string; long: string }> = {
  tithi: {
    title: "Tithi",
    short: "Lunar day",
    long: "A lunar day — the time the moon takes to move 12° ahead of the sun. Fasts and festivals are fixed to tithis, not to calendar dates, which is why they shift each year.",
  },
  paksha: {
    title: "Paksha",
    short: "Half of the lunar month",
    long: "Shukla paksha is the bright fortnight when the moon waxes toward the full moon; Krishna paksha is the dark fortnight when it wanes toward the new moon.",
  },
  nakshatra: {
    title: "Nakshatra",
    short: "Moon's star constellation",
    long: "One of 27 star groups the moon travels through. The nakshatra at birth gives your traditional star name, and many rituals are timed to specific nakshatras.",
  },
  yoga: {
    title: "Yoga",
    short: "Sun-moon combination",
    long: "A quality of the day derived from the combined positions of the sun and moon. Some yogas are considered favourable for new beginnings, others are avoided.",
  },
  karana: {
    title: "Karana",
    short: "Half of a lunar day",
    long: "Each tithi is split into two karanas. They are mainly used to pick the right window for practical tasks such as travel or signing agreements.",
  },
  vaara: {
    title: "Vaara",
    short: "Day of the week",
    long: "The weekday, each ruled by a planet — Sunday by the sun, Monday by the moon, and so on. Many weekly fasts are tied to the vaara.",
  },
  masa: {
    title: "Masa",
    short: "Lunar month",
    long: "The Hindu lunar month. It runs new moon to new moon (amanta, common in the south and west) or full moon to full moon (purnimanta, common in the north).",
  },
  ritu: {
    title: "Ritu",
    short: "Season",
    long: "One of six traditional seasons of the Indian year, each spanning roughly two lunar months.",
  },
  samvat: {
    title: "Vikram Samvat",
    short: "Traditional year count",
    long: "The Vikram era calendar year, running about 57 years ahead of the Gregorian year.",
  },
  muhurta: {
    title: "Muhurta",
    short: "Auspicious & inauspicious windows",
    long: "Short time windows within the day. Auspicious ones are chosen for starting something new; inauspicious ones are usually avoided for important work.",
  },
};

/** Short English gloss for individual tithi names. */
export const TITHI_MEANINGS: Record<string, string> = {
  Pratipada: "First lunar day — a fresh start",
  Dwitiya: "Second lunar day",
  Tritiya: "Third lunar day — favoured for auspicious beginnings",
  Chaturthi: "Fourth lunar day — sacred to Ganesha",
  Panchami: "Fifth lunar day — linked to learning and the nagas",
  Shashthi: "Sixth lunar day — sacred to Skanda / Murugan",
  Saptami: "Seventh lunar day — sacred to the sun",
  Ashtami: "Eighth lunar day — sacred to Durga",
  Navami: "Ninth lunar day — sacred to the Devi",
  Dashami: "Tenth lunar day — associated with victory",
  Ekadashi: "Eleventh lunar day — the main fasting day for Vishnu devotees",
  Dwadashi: "Twelfth lunar day — when the Ekadashi fast is broken",
  Trayodashi: "Thirteenth lunar day — Pradosh, sacred to Shiva",
  Chaturdashi: "Fourteenth lunar day — sacred to Shiva",
  Purnima: "Full moon — a day for fasting, charity and temple visits",
  Amavasya: "New moon — a day for remembering ancestors",
};

/** Short English gloss for the muhurta windows we display. */
export const MUHURTA_MEANINGS: Record<string, string> = {
  "Rahu Kalam": "Avoid starting anything important",
  Yamaganda: "Avoid travel and new ventures",
  "Gulika Kalam": "Best kept for routine work",
  "Abhijit Muhurta": "The most favourable window of the day",
};

export function moonPhaseLabel(phase: number): string {
  const p = ((phase % 360) + 360) % 360;
  if (p < 15 || p >= 345) return "New moon";
  if (p < 75) return "Waxing crescent";
  if (p < 105) return "First quarter";
  if (p < 165) return "Waxing gibbous";
  if (p < 195) return "Full moon";
  if (p < 255) return "Waning gibbous";
  if (p < 285) return "Last quarter";
  return "Waning crescent";
}