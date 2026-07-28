/**
 * Diacritic-insensitive search folding.
 *
 * The app's own name is written "Panchāṅga", and place names carry marks of
 * their own (Zürich, Bengalūru, São Paulo). Nobody types those on a phone
 * keyboard, so every text comparison has to fold the query and the candidate
 * to a common ASCII form first: searching "panchang" must match "Panchāṅga".
 *
 * Folding happens in three passes:
 *  1. NFD decomposition + removal of combining marks — handles ā, ī, ü, é and
 *     the dot-below family (ṛ, ṣ, ṭ, ḍ, ṇ, ḥ) that decompose cleanly.
 *  2. An explicit map for characters that do NOT decompose (ø, đ, ł, ħ) plus
 *     the IAST letters browsers keep precomposed.
 *  3. Collapsing punctuation and whitespace so "Panchāṅga-2026" and
 *     "panchanga 2026" fold to the same token stream.
 */

/** Characters with no canonical decomposition, mapped to their ASCII base. */
const NON_DECOMPOSING: Record<string, string> = {
  ø: "o",
  Ø: "o",
  đ: "d",
  Đ: "d",
  ð: "d",
  Ð: "d",
  ł: "l",
  Ł: "l",
  ħ: "h",
  Ħ: "h",
  ı: "i",
  ŋ: "n",
  Ŋ: "n",
  þ: "th",
  Þ: "th",
  ß: "ss",
  æ: "ae",
  Æ: "ae",
  œ: "oe",
  Œ: "oe",
  "‘": "'",
  "’": "'",
  "ʼ": "'",
};

const COMBINING_MARKS = /[\u0300-\u036f\u1ab0-\u1aff\u1dc0-\u1dff\u20d0-\u20f0]/g;
const NON_ALNUM = /[^a-z0-9]+/g;

/**
 * Fold text to a lowercase, mark-free, punctuation-free comparison key.
 * "Panchāṅga" and "panchang a" both fold toward "panchanga" / "panchang a".
 */
export function foldSearch(input: string): string {
  if (!input) return "";
  let out = "";
  // Normalize first so ā -> a + U+0304, then strip the marks.
  for (const ch of input.normalize("NFD")) {
    out += NON_DECOMPOSING[ch] ?? ch;
  }
  return out
    .replace(COMBINING_MARKS, "")
    .toLowerCase()
    .replace(NON_ALNUM, " ")
    .trim();
}

/** Fold and split into tokens, dropping empties. */
export function foldTokens(input: string): string[] {
  const folded = foldSearch(input);
  return folded ? folded.split(" ") : [];
}

/**
 * True when every token in `query` appears as a prefix of some word in
 * `haystack`, after folding both. Prefix matching (not equality) means a
 * partial "panch" still matches "Panchāṅga" while typing.
 */
export function matchesQuery(haystack: string, query: string): boolean {
  const tokens = foldTokens(query);
  if (!tokens.length) return true;
  const words = foldTokens(haystack);
  if (!words.length) return false;
  const joined = words.join(" ");
  return tokens.every(
    (t) => joined.startsWith(t) || words.some((w) => w.startsWith(t)) || joined.includes(t),
  );
}

/**
 * Rank for sorting matches: lower is better. Exact fold beats
 * starts-with, which beats a match somewhere in the middle.
 */
export function matchRank(haystack: string, query: string): number {
  const q = foldSearch(query);
  const h = foldSearch(haystack);
  if (!q) return 3;
  if (h === q) return 0;
  if (h.startsWith(q)) return 1;
  return h.includes(q) ? 2 : 3;
}
