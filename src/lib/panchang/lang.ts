/**
 * Script / language layer.
 *
 * Every panchang term can be rendered three ways:
 *  - `devanagari` — देवनागरी for readers of Hindi/Sanskrit
 *  - `iast`       — transliterated English (default, e.g. "Sankashti Chaturthi")
 *  - `english`    — plain English explanation for second-generation readers
 */
export type ScriptMode = "devanagari" | "iast" | "english";

export const SCRIPT_OPTIONS: { id: ScriptMode; short: string; label: string }[] = [
  { id: "devanagari", short: "अ", label: "Devanagari" },
  { id: "iast", short: "Aa", label: "Transliterated" },
  { id: "english", short: "EN", label: "Plain English" },
];

type Entry = { dev: string; en: string };

const TITHI: Record<string, Entry> = {
  Pratipada: { dev: "प्रतिपदा", en: "1st lunar day" },
  Dwitiya: { dev: "द्वितीया", en: "2nd lunar day" },
  Tritiya: { dev: "तृतीया", en: "3rd lunar day" },
  Chaturthi: { dev: "चतुर्थी", en: "4th lunar day" },
  Panchami: { dev: "पंचमी", en: "5th lunar day" },
  Shashthi: { dev: "षष्ठी", en: "6th lunar day" },
  Saptami: { dev: "सप्तमी", en: "7th lunar day" },
  Ashtami: { dev: "अष्टमी", en: "8th lunar day" },
  Navami: { dev: "नवमी", en: "9th lunar day" },
  Dashami: { dev: "दशमी", en: "10th lunar day" },
  Ekadashi: { dev: "एकादशी", en: "11th lunar day" },
  Dwadashi: { dev: "द्वादशी", en: "12th lunar day" },
  Trayodashi: { dev: "त्रयोदशी", en: "13th lunar day" },
  Chaturdashi: { dev: "चतुर्दशी", en: "14th lunar day" },
  Purnima: { dev: "पूर्णिमा", en: "Full moon" },
  Amavasya: { dev: "अमावस्या", en: "New moon" },
};

const PAKSHA: Record<string, Entry> = {
  Shukla: { dev: "शुक्ल", en: "Waxing moon" },
  Krishna: { dev: "कृष्ण", en: "Waning moon" },
};

const VAARA: Record<string, Entry> = {
  Ravivara: { dev: "रविवार", en: "Sunday" },
  Somavara: { dev: "सोमवार", en: "Monday" },
  Mangalavara: { dev: "मंगलवार", en: "Tuesday" },
  Budhavara: { dev: "बुधवार", en: "Wednesday" },
  Guruvara: { dev: "गुरुवार", en: "Thursday" },
  Shukravara: { dev: "शुक्रवार", en: "Friday" },
  Shanivara: { dev: "शनिवार", en: "Saturday" },
};

const MASA: Record<string, Entry> = {
  Chaitra: { dev: "चैत्र", en: "Chaitra (Mar–Apr)" },
  Vaishakha: { dev: "वैशाख", en: "Vaishakha (Apr–May)" },
  Jyeshtha: { dev: "ज्येष्ठ", en: "Jyeshtha (May–Jun)" },
  Ashadha: { dev: "आषाढ़", en: "Ashadha (Jun–Jul)" },
  Shravana: { dev: "श्रावण", en: "Shravana (Jul–Aug)" },
  Bhadrapada: { dev: "भाद्रपद", en: "Bhadrapada (Aug–Sep)" },
  Ashwina: { dev: "आश्विन", en: "Ashwina (Sep–Oct)" },
  Kartika: { dev: "कार्तिक", en: "Kartika (Oct–Nov)" },
  Margashirsha: { dev: "मार्गशीर्ष", en: "Margashirsha (Nov–Dec)" },
  Pausha: { dev: "पौष", en: "Pausha (Dec–Jan)" },
  Magha: { dev: "माघ", en: "Magha (Jan–Feb)" },
  Phalguna: { dev: "फाल्गुन", en: "Phalguna (Feb–Mar)" },
};

const NAKSHATRA: Record<string, Entry> = {
  Ashwini: { dev: "अश्विनी", en: "Ashwini — the horsemen" },
  Bharani: { dev: "भरणी", en: "Bharani — the bearer" },
  Krittika: { dev: "कृत्तिका", en: "Krittika — the Pleiades" },
  Rohini: { dev: "रोहिणी", en: "Rohini — the red star" },
  Mrigashira: { dev: "मृगशिरा", en: "Mrigashira — deer's head" },
  Ardra: { dev: "आर्द्रा", en: "Ardra — the storm star" },
  Punarvasu: { dev: "पुनर्वसु", en: "Punarvasu — return of light" },
  Pushya: { dev: "पुष्य", en: "Pushya — the nourisher" },
  Ashlesha: { dev: "आश्लेषा", en: "Ashlesha — the embrace" },
  Magha: { dev: "मघा", en: "Magha — the throne" },
  "Purva Phalguni": { dev: "पूर्वा फाल्गुनी", en: "Purva Phalguni — early fig" },
  "Uttara Phalguni": { dev: "उत्तरा फाल्गुनी", en: "Uttara Phalguni — later fig" },
  Hasta: { dev: "हस्त", en: "Hasta — the hand" },
  Chitra: { dev: "चित्रा", en: "Chitra — the bright jewel" },
  Swati: { dev: "स्वाति", en: "Swati — the independent" },
  Vishakha: { dev: "विशाखा", en: "Vishakha — the forked" },
  Anuradha: { dev: "अनुराधा", en: "Anuradha — the devoted" },
  Jyeshtha: { dev: "ज्येष्ठा", en: "Jyeshtha — the eldest" },
  Mula: { dev: "मूल", en: "Mula — the root" },
  "Purva Ashadha": { dev: "पूर्वाषाढ़ा", en: "Purva Ashadha — early victory" },
  "Uttara Ashadha": { dev: "उत्तराषाढ़ा", en: "Uttara Ashadha — later victory" },
  Shravana: { dev: "श्रवण", en: "Shravana — the listener" },
  Dhanishta: { dev: "धनिष्ठा", en: "Dhanishta — the wealthiest" },
  Shatabhisha: { dev: "शतभिषा", en: "Shatabhisha — hundred healers" },
  "Purva Bhadrapada": { dev: "पूर्वभाद्रपदा", en: "Purva Bhadrapada — early blessing" },
  "Uttara Bhadrapada": { dev: "उत्तरभाद्रपदा", en: "Uttara Bhadrapada — later blessing" },
  Revati: { dev: "रेवती", en: "Revati — the prosperous" },
};

const MUHURTA: Record<string, Entry> = {
  "Rahu Kalam": { dev: "राहु काल", en: "Avoid new beginnings" },
  Yamaganda: { dev: "यमगण्ड", en: "Avoid travel & signings" },
  "Gulika Kalam": { dev: "गुलिक काल", en: "Avoid lasting commitments" },
  "Abhijit Muhurta": { dev: "अभिजित मुहूर्त", en: "Best time for anything new" },
  Madhyahna: { dev: "मध्याह्न", en: "Midday window (Ganesh Chaturthi etc.)" },
  Pradosha: { dev: "प्रदोष", en: "Evening window (Diwali, Pradosh vrat)" },
  Nishita: { dev: "निशीथ", en: "Midnight window (Janmashtami, Shivratri)" },
};

const GENERIC: Record<string, Entry> = {
  ...TITHI,
  ...PAKSHA,
  ...VAARA,
  ...MASA,
  ...NAKSHATRA,
  ...MUHURTA,
};

function render(table: Record<string, Entry>, value: string, mode: ScriptMode): string {
  const hit = table[value];
  if (!hit) return value;
  if (mode === "devanagari") return hit.dev;
  if (mode === "english") return hit.en;
  return value;
}

/** Translate any known panchang term into the chosen script. */
export function term(value: string, mode: ScriptMode): string {
  return render(GENERIC, value, mode);
}

export function tithiTerm(value: string, mode: ScriptMode): string {
  return render(TITHI, value, mode);
}

export function pakshaTerm(value: string, mode: ScriptMode): string {
  return render(PAKSHA, value, mode);
}

export function muhurtaTerm(value: string, mode: ScriptMode): string {
  return render(MUHURTA, value, mode);
}

/** Short plain-English gloss shown as a secondary line, whatever the mode. */
export function gloss(value: string): string | null {
  return GENERIC[value]?.en ?? null;
}

export type FastingStatus = {
  /** Short label, e.g. "Ekadashi fast" */
  label: string;
  /** One-line plain guidance. */
  detail: string;
} | null;

/** Whether the given tithi is a commonly observed fasting day. */
export function fastingStatus(tithiName: string, paksha: string): FastingStatus {
  switch (tithiName) {
    case "Ekadashi":
      return {
        label: "Ekadashi fast",
        detail: "Grain-free fast today; break it (parana) after sunrise tomorrow.",
      };
    case "Chaturthi":
      return paksha === "Krishna"
        ? { label: "Sankashti fast", detail: "Fast until moonrise, then offer arghya to Ganesha." }
        : { label: "Vinayaka fast", detail: "Light fast until the midday Ganesha puja." };
    case "Trayodashi":
      return { label: "Pradosh fast", detail: "Fast observed until the evening Pradosh window." };
    case "Purnima":
      return { label: "Purnima fast", detail: "Full-moon fast, broken after seeing the moon." };
    case "Amavasya":
      return { label: "Amavasya observance", detail: "New moon — tarpan and ancestor offerings." };
    case "Ashtami":
      return paksha === "Krishna"
        ? { label: "Kalashtami", detail: "Optional fast dedicated to Bhairava." }
        : { label: "Durgashtami", detail: "Optional fast dedicated to Durga." };
    default:
      return null;
  }
}
