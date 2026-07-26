/**
 * Plain-English meanings for the Sanskrit terms used across the app, so the
 * traditional almanac detail stays intact while newer readers get context.
 */

export const CONCEPTS: Record<
  string,
  { title: string; short: string; long: string; example?: string }
> = {
  tithi: {
    title: "Tithi",
    short: "Lunar day",
    long: "A lunar day — the time the moon takes to move 12° ahead of the sun. Fasts and festivals are fixed to tithis, not to calendar dates, which is why they shift each year.",
    example:
      "Example: Diwali is always Kartika Amavasya, so it lands on a different Gregorian date each year.",
  },
  paksha: {
    title: "Paksha",
    short: "Half of the lunar month",
    long: "Shukla paksha is the bright fortnight when the moon waxes toward the full moon; Krishna paksha is the dark fortnight when it wanes toward the new moon.",
    example: "Example: Holi burns on Phalguna Purnima, the last night of shukla paksha.",
  },
  nakshatra: {
    title: "Nakshatra",
    short: "Moon's star constellation",
    long: "One of 27 star groups the moon travels through. The nakshatra at birth gives your traditional star name, and many rituals are timed to specific nakshatras.",
    example:
      "Example: a baby born while the moon is in Rohini is called a Rohini-nakshatra child at naming ceremonies.",
  },
  yoga: {
    title: "Yoga",
    short: "Sun-moon combination",
    long: "A quality of the day derived from the combined positions of the sun and moon. Some yogas are considered favourable for new beginnings, others are avoided.",
    example:
      "Example: Siddhi yoga is welcomed for signing a deal; Vyatipata yoga is usually skipped.",
  },
  karana: {
    title: "Karana",
    short: "Half of a lunar day",
    long: "Each tithi is split into two karanas. They are mainly used to pick the right window for practical tasks such as travel or signing agreements.",
    example: "Example: elders avoid setting out on a journey during Vishti (Bhadra) karana.",
  },
  vaara: {
    title: "Vaara",
    short: "Day of the week",
    long: "The weekday, each ruled by a planet — Sunday by the sun, Monday by the moon, and so on. Many weekly fasts are tied to the vaara.",
    example: "Example: Somavara (Monday) fasts are kept for Shiva, Shanivara (Saturday) for Shani.",
  },
  masa: {
    title: "Masa",
    short: "Lunar month",
    long: "The Hindu lunar month. It runs new moon to new moon (amanta, common in the south and west) or full moon to full moon (purnimanta, common in the north).",
    example:
      "Example: the same night can be Shravana in the north and Ashadha in the south — same festival, different month name.",
  },
  ritu: {
    title: "Ritu",
    short: "Season",
    long: "One of six traditional seasons of the Indian year, each spanning roughly two lunar months.",
    example: "Example: Vasanta ritu (spring) is the season of Holi and Ugadi.",
  },
  samvat: {
    title: "Vikram Samvat",
    short: "Traditional year count",
    long: "The Vikram era calendar year, running about 57 years ahead of the Gregorian year.",
    example: "Example: 2026 CE falls mostly in Vikram Samvat 2083.",
  },
  muhurta: {
    title: "Muhurta",
    short: "Auspicious & inauspicious windows",
    long: "Short time windows within the day. Auspicious ones are chosen for starting something new; inauspicious ones are usually avoided for important work.",
    example:
      "Example: families schedule a griha pravesh inside Abhijit muhurta and outside Rahu kalam.",
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
  "Rahu Kalam": "Ruled by Rahu — avoid starting anything important",
  Yamaganda: "Ruled by Yama — avoid travel and new ventures",
  "Gulika Kalam": "Ruled by Gulika — best kept for routine work",
  "Abhijit Muhurta": "Midday sliver — the most favourable window of the day",
};

/** Longer English notes for the muhurta windows, with everyday examples. */
export const MUHURTA_DETAILS: Record<string, string> = {
  "Rahu Kalam":
    "A roughly 90-minute window whose position shifts with the weekday. Purchases, journeys and new work are postponed until it passes — ongoing routine activity is fine.",
  Yamaganda:
    "Named for Yama, this window is considered unhelpful for travel, examinations and new agreements.",
  "Gulika Kalam":
    "Whatever is begun here is said to repeat, so it is avoided for one-off events like weddings but is harmless for daily chores.",
  "Abhijit Muhurta":
    "About 48 minutes centred on local noon. Considered good for almost any beginning — job offers, house-warmings, opening a shop.",
};

/** Plain-English notes for the 27 nakshatras. */
export const NAKSHATRA_MEANINGS: Record<string, string> = {
  Ashwini: "The horse twins — speed, healing and quick starts",
  Bharani: "The bearer — endurance and transformation",
  Krittika: "The flame — cutting through, sharpness and cooking rituals",
  Rohini: "The red one — growth, fertility and beauty; Krishna's star",
  Mrigashira: "The deer's head — searching, curiosity and travel",
  Ardra: "The teardrop — storms, upheaval and renewal",
  Punarvasu: "Return of the light — second chances and homecoming",
  Pushya: "The nourisher — considered the most auspicious star of all",
  Ashlesha: "The embrace — insight, intensity and the serpent's wisdom",
  Magha: "The throne — ancestors, lineage and honour",
  "Purva Phalguni": "The front fig tree — rest, pleasure and marriage",
  "Uttara Phalguni": "The latter fig tree — friendship, contracts and support",
  Hasta: "The hand — craft, skill and things made well",
  Chitra: "The bright jewel — design, architecture and beauty",
  Swati: "The independent one — wind, trade and self-reliance",
  Vishakha: "The forked branch — ambition and single-minded effort",
  Anuradha: "The devoted one — friendship, teamwork and devotion",
  Jyeshtha: "The eldest — seniority, protection and responsibility",
  Mula: "The root — digging to the source, endings and research",
  "Purva Ashadha": "Early invincibility — courage and water",
  "Uttara Ashadha": "Later invincibility — lasting victory and integrity",
  Shravana: "The ear — listening, learning and scripture",
  Dhanishta: "The wealthy — music, rhythm and prosperity",
  Shatabhisha: "The hundred healers — medicine, secrets and solitude",
  "Purva Bhadrapada": "Early blessed feet — austerity and vision",
  "Uttara Bhadrapada": "Later blessed feet — depth, calm and wisdom",
  Revati: "The wealthy shepherd — safe journeys and gentle endings",
};

/** Plain-English notes for the 27 yogas. */
export const YOGA_MEANINGS: Record<string, string> = {
  Vishkambha: "Support — steady but slow going",
  Priti: "Affection — good for relationships",
  Ayushman: "Long life — health and vitality",
  Saubhagya: "Good fortune — favourable for most work",
  Shobhana: "Splendour — auspicious and bright",
  Atiganda: "Obstacles — take care with new starts",
  Sukarma: "Good deeds — favourable for service and charity",
  Dhriti: "Steadiness — good for commitments",
  Shula: "The spear — friction; avoid disputes",
  Ganda: "Knot — a difficult, tangled day",
  Vriddhi: "Growth — good for investment and study",
  Dhruva: "Fixed — good for anything meant to last",
  Vyaghata: "Blow — avoid risky travel",
  Harshana: "Joy — celebrations and gatherings",
  Vajra: "Thunderbolt — forceful; handle with care",
  Siddhi: "Accomplishment — very favourable",
  Vyatipata: "Calamity — traditionally avoided entirely",
  Variyana: "Comfort — relaxed, easy-going work",
  Parigha: "Barrier — expect resistance",
  Shiva: "Auspicious — worship and spiritual practice",
  Siddha: "Achieved — rituals succeed",
  Sadhya: "Attainable — good for finishing things",
  Shubha: "Auspicious — favourable for ceremonies",
  Shukla: "Bright — clarity and communication",
  Brahma: "Creator — learning, teaching and new ideas",
  Indra: "The king — leadership and authority",
  Vaidhriti: "Divided — traditionally avoided for new starts",
};

/** Plain-English notes for the karanas. */
export const KARANA_MEANINGS: Record<string, string> = {
  Bava: "Lion — good for beginnings and worship",
  Balava: "Tiger — favourable for study and rituals",
  Kaulava: "Boar — good for friendships and agreements",
  Taitila: "Donkey — suits trade and steady work",
  Gara: "Elephant — favourable for farming and building",
  Vanija: "Cow — the merchant's karana, good for business",
  Vishti: "Bhadra — avoided for travel and auspicious events",
  Shakuni: "Bird — good for medicine and quiet work",
  Chatushpada: "Four-footed — suited to cattle, land and ancestors",
  Naga: "Serpent — fixed and slow; avoid new ventures",
  Kimstughna: "Slayer of doubt — auspicious for starting the lunar month",
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