/**
 * Typography helpers for IAST text.
 *
 * Verified against the shipped WOFF2 subsets with fontTools: Marcellus (our
 * display face) and Karla (body) contain ā ī ū ś, but have NO glyph for
 * ṅ ṁ ṇ ṛ ṣ ṭ ḍ ḥ. The CSS stack falls back to Noto Serif / Noto Sans for
 * those, so nothing renders as tofu on iOS or Android — but inside a single
 * word the substituted letter is visibly a different typeface, e.g. the ṅ in
 * "Panchāṅga".
 *
 * For headline-sized text we therefore switch the whole string to Noto Serif,
 * which covers the entire IAST set in one family, so every letter matches.
 */

/** Letters absent from Marcellus and Karla; presence forces the fallback face. */
const MISSING_FROM_BRAND_FONTS = /[\u1E45\u1E43\u1E47\u1E5B\u1E63\u1E6D\u1E0D\u1E25\u1E37\u1E44\u1E42\u1E46\u1E5A\u1E62\u1E6C\u1E0C\u1E24\u1E36]/;

/** True when `text` contains a glyph Marcellus/Karla cannot render themselves. */
export function needsFullIastFont(text: string): boolean {
  return MISSING_FROM_BRAND_FONTS.test(text);
}

/**
 * Pick the display class for a heading: the normal Marcellus stack, or the
 * single-family Noto Serif stack when the text needs glyphs Marcellus lacks.
 */
export function displayFontClass(text: string): string {
  return needsFullIastFont(text) ? "font-wordmark" : "font-display";
}
