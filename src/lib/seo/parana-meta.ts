import type { FaqItem } from "@/components/FaqSection";
import { referenceParanaSnapshot } from "@/lib/panchang/parana-snapshot";
import { dayKey, formatLongDate, formatTime, type CalendarDay } from "@/lib/panchang/tz";
import { MONTHS } from "@/lib/seo/ekadashi-pages";
import { SITE_URL } from "./schema";

export const PARANA_TITLE =
  "Ekadashi Parana Time for US, UK & Canada — Your Timezone, Not India Time";
export const PARANA_DESCRIPTION =
  "Ekadashi parana time for the US, UK and Canada tuned to your timezone and local sunrise — not India time. Get today's exact Dwadashi parana window for your city.";

/** Canonical URL shared by /vrats/ekadashi/parana, /parana-time-today and /parana-time-tomorrow. */
export const PARANA_URL = `${SITE_URL}/vrats/ekadashi/parana`;

const short = (name: string) => name.replace(/ Ekadashi$/, "");
const mon = (d: CalendarDay) => (MONTHS.find((m) => m.number === d.month)?.name ?? "").slice(0, 3);

/**
 * Crawlers get concrete dates and times: the meta description is built from the
 * same reference-city snapshot that is server-rendered on the page.
 */
export function paranaDescriptionToday(): string {
  try {
    const snap = referenceParanaSnapshot();
    const todayKey = dayKey(snap.today);
    const fmt = (d: Date | null) => formatTime(d, snap.city.tz, true);
    const paranaToday = snap.entries.find((e) => dayKey(e.parana.date) === todayKey);
    const next = snap.entries.find((e) => dayKey(e.date) >= todayKey);
    if (paranaToday) {
      return `Parana time today (${formatLongDate(snap.today)}) is ${fmt(paranaToday.parana.start)}–${fmt(
        paranaToday.parana.end,
      )} ET after ${paranaToday.name}. Times recalculate for your own city and sunrise.`;
    }
    if (next && dayKey(next.date) === todayKey) {
      // Today is the fast day: the query intent shifts to "parana time tomorrow".
      return `Today is ${next.name}. Parana time tomorrow (${formatLongDate(
        next.parana.date,
      )}) is ${fmt(next.parana.start)}–${fmt(next.parana.end)} ET. Times recalculate for your own city.`;
    }
    if (next) {
      return `Parana time today: no Ekadashi fast ends today. Next is ${next.name} on ${formatLongDate(
        next.date,
      )}; parana ${formatLongDate(next.parana.date)}, ${fmt(next.parana.start)}–${fmt(
        next.parana.end,
      )} ET.`;
    }
  } catch {
    /* fall through to the static description */
  }
  return PARANA_DESCRIPTION;
}

/**
 * Snippet title carries the actual answer ("parana time today") with concrete
 * times, which is what earns the click at position ~9. Falls back to the
 * static title outside a fast period.
 */
export function paranaTitleToday(): string {
  try {
    const snap = referenceParanaSnapshot();
    const todayKey = dayKey(snap.today);
    const fmt = (d: Date | null) => formatTime(d, snap.city.tz, true);
    // Keep every branch under ~60 chars so the snippet is never truncated.
    const paranaToday = snap.entries.find((e) => dayKey(e.parana.date) === todayKey);
    if (paranaToday) {
      return `Parana Time Today: ${fmt(paranaToday.parana.start)}–${fmt(
        paranaToday.parana.end,
      )} ET (${short(paranaToday.name)})`;
    }
    const fastToday = snap.entries.find((e) => dayKey(e.date) === todayKey);
    if (fastToday) {
      return `${short(fastToday.name)} Today — Parana Tomorrow ${fmt(
        fastToday.parana.start,
      )}–${fmt(fastToday.parana.end)} ET`;
    }
    const next = snap.entries.find((e) => dayKey(e.date) >= todayKey);
    if (next) {
      return `Parana Time Today & Next: ${short(next.name)} ${mon(next.date)} ${next.date.day}`;
    }
  } catch {
    /* fall through to the static title */
  }
  return PARANA_TITLE;
}

/**
 * Hub metadata for the canonical /vrats/ekadashi/parana page, kept distinct
 * from the /parana-time-today entry page so no two routes share a title,
 * description or social preview.
 */
export function paranaTitleHub(): string {
  try {
    const snap = referenceParanaSnapshot();
    const next = snap.entries.find((e) => dayKey(e.date) >= dayKey(snap.today));
    if (next) {
      return `${short(next.name)} Parana Time for US, UK & Canada — ${mon(next.date)} ${next.date.day}`;
    }
  } catch {
    /* fall through to the static title */
  }
  return PARANA_TITLE;
}

export function paranaDescriptionHub(): string {
  try {
    const snap = referenceParanaSnapshot();
    const fmt = (d: Date | null) => formatTime(d, snap.city.tz, true);
    const next = snap.entries.find((e) => dayKey(e.date) >= dayKey(snap.today));
    if (next) {
      return `Ekadashi parana rules and exact Hari Vasara / Dwadashi windows for the US, UK and Canada — not India time. Next is ${
        next.name
      } on ${formatLongDate(next.date)}; parana ${formatLongDate(next.parana.date)}, ${fmt(
        next.parana.start,
      )}–${fmt(next.parana.end)} ET, recomputed for your timezone and local sunrise.`;
    }
  } catch {
    /* fall through to the static description */
  }
  return PARANA_DESCRIPTION;
}



/** Tomorrow-focused title for /parana-time-tomorrow (canonical → parana page). */
export function paranaTitleTomorrow(): string {
  try {
    const snap = referenceParanaSnapshot();
    const tomorrowKey = dayKey(snap.tomorrow);
    const fmt = (d: Date | null) => formatTime(d, snap.city.tz, true);
    const paranaTomorrow = snap.entries.find((e) => dayKey(e.parana.date) === tomorrowKey);
    if (paranaTomorrow) {
      return `Parana Time Tomorrow: ${fmt(paranaTomorrow.parana.start)}–${fmt(
        paranaTomorrow.parana.end,
      )} ET (${short(paranaTomorrow.name)})`;
    }
    const fastTomorrow = snap.entries.find((e) => dayKey(e.date) === tomorrowKey);
    if (fastTomorrow) {
      return `${short(fastTomorrow.name)} Tomorrow — Parana ${fmt(
        fastTomorrow.parana.start,
      )}–${fmt(fastTomorrow.parana.end)} ET`;
    }
    const next = snap.entries.find((e) => dayKey(e.date) >= dayKey(snap.today));
    if (next) {
      return `Parana Time Tomorrow & Next: ${short(next.name)} ${mon(next.date)} ${next.date.day}`;
    }
  } catch {
    /* fall through to the static title */
  }
  return "Parana Time Tomorrow — Ekadashi Fast Breaking (Your Timezone)";
}

/** Tomorrow-focused description for /parana-time-tomorrow. */
export function paranaDescriptionTomorrow(): string {
  try {
    const snap = referenceParanaSnapshot();
    const tomorrowKey = dayKey(snap.tomorrow);
    const fmt = (d: Date | null) => formatTime(d, snap.city.tz, true);
    const paranaTomorrow = snap.entries.find((e) => dayKey(e.parana.date) === tomorrowKey);
    if (paranaTomorrow) {
      return `Parana time tomorrow (${formatLongDate(snap.tomorrow)}) is ${fmt(
        paranaTomorrow.parana.start,
      )}–${fmt(paranaTomorrow.parana.end)} ET after ${paranaTomorrow.name}. Times recalculate for your own city and sunrise.`;
    }
    const fastTomorrow = snap.entries.find((e) => dayKey(e.date) === tomorrowKey);
    if (fastTomorrow) {
      return `Tomorrow is ${fastTomorrow.name}, the fasting day — no parana tomorrow. Its parana window is ${formatLongDate(
        fastTomorrow.parana.date,
      )}, ${fmt(fastTomorrow.parana.start)}–${fmt(fastTomorrow.parana.end)} ET.`;
    }
    const next = snap.entries.find((e) => dayKey(e.date) >= dayKey(snap.today));
    if (next) {
      return `No parana tomorrow — no Ekadashi fast ends tomorrow. Next is ${next.name} on ${formatLongDate(
        next.date,
      )}; parana ${formatLongDate(next.parana.date)}, ${fmt(next.parana.start)}–${fmt(
        next.parana.end,
      )} ET.`;
    }
  } catch {
    /* fall through to the static description */
  }
  return PARANA_DESCRIPTION;
}

/** Visible FAQ items and FAQPage JSON-LD share this exact-match question set. */
export const PARANA_FAQS: FaqItem[] = [
  {
    q: "When is parana time today?",
    a: "Parana is taken the morning after the fast, after sunrise, during Dwadashi and after Hari Vasara (the first quarter of Dwadashi) has ended. Sign in above to see today's window in your own clock time; if no fast ended today the page tells you the next date a parana window falls.",
  },
  {
    q: "What is the today parana time for my city?",
    a: "The today parana time is computed from your own city's sunrise, not India time: it opens after sunrise once Hari Vasara ends and closes when Dwadashi tithi ends. Two cities in different US time zones can legitimately show different parana windows for the same Ekadashi.",
  },
  {
    q: "What is the parana time tomorrow?",
    a: "If you are fasting today, tomorrow's window is shown on this page with its start and end time for your city. Break the fast inside that window — after it closes the parana is considered late.",
  },
  {
    q: "What is Dwadashi parana time?",
    a: "Dwadashi parana time is the same window: the Ekadashi fast must be broken on Dwadashi tithi. If Dwadashi ends early in the morning, parana has to be completed before it ends, which is why the window can be very short on some days.",
  },
  {
    q: "Which Ekadashi is today or tomorrow?",
    a: "Each of the 24 yearly Ekadashis has its own name, decided by the lunar month and paksha. The page names the current or next one for your location, because the fasting day is set by the tithi running at your local sunrise, not by India time.",
  },
  {
    q: "When is the next Ekadashi?",
    a: "Ekadashi falls twice each lunar month, roughly every 14 to 15 days. The next fasting date is computed for your city's sunrise on this page.",
  },
];
