import { createFileRoute } from "@tanstack/react-router";

import { MoonPhaseHub } from "@/components/MoonPhaseHub";
import type { FaqItem } from "@/components/FaqSection";
import { REFERENCE_CITY, referenceMoonPhaseSnapshot } from "@/lib/panchang/moon-phase-snapshot";
import { dayKey, formatLongDate, formatTime } from "@/lib/panchang/tz";
import { canonicalLink, canonicalOgUrl, canonicalUrl } from "@/lib/seo/canonical";
import {
  SITE_URL,
  articleSchema,
  breadcrumbSchema,
  definedTermSchema,
  eventSchema,
  faqPageSchema,
  ldJson,
} from "@/lib/seo/schema";

const PATH = "/vrats/amavasya";
const URL = canonicalUrl(PATH);
const TITLE = "Is It Amavasya Today? US Dates & Times | Panchanga";
const FALLBACK =
  "Check whether it is Amavasya today in the US and see the next new moon date with its exact start and end time for your own city, not India time.";

const FAQS: FaqItem[] = [
  {
    q: "Is it Amavasya today?",
    a: "The card above answers it for the city you selected. Amavasya is the new moon tithi, and the observance day is the day whose local sunrise falls inside that tithi — so in the US it can land a day earlier or later than an India-printed panchang.",
  },
  {
    q: "When is Amavasya this month?",
    a: "Every lunar month has one Amavasya, roughly 29 to 30 days apart. The upcoming list above gives the next five dates with their exact tithi start and end times in your local clock.",
  },
  {
    q: "Why is Amavasya on a different day in the USA?",
    a: "Sunrise in New York, Chicago or California happens nine to twelve hours after Indian sunrise. Because the tithi at local sunrise decides the day, the US date frequently shifts by one day from the India date.",
  },
  {
    q: "What do people do on Amavasya?",
    a: "Amavasya is kept for pitru tarpan and shraddha for ancestors, charity, and fasting in some families. Mauni Amavasya, Somvati Amavasya and Mahalaya Amavasya carry additional observances.",
  },
  {
    q: "What is the difference between Amavasya and Purnima?",
    a: "Amavasya is the new moon, the last tithi of the waning Krishna paksha; Purnima is the full moon, the last tithi of the waxing Shukla paksha. They fall about fifteen days apart.",
  },
];

/** Real dates and times in the snippet, from the same snapshot the page renders. */
function metaDescription(): string {
  try {
    const snap = referenceMoonPhaseSnapshot("amavasya");
    const todayKey = dayKey(snap.today);
    const fmt = (d: Date | null) => formatTime(d, snap.city.tz, true);
    const today = snap.entries.find((e) => dayKey(e.date) === todayKey);
    if (today) {
      return `Yes — ${today.name} is today, ${formatLongDate(snap.today)}. The tithi runs ${fmt(
        today.start,
      )} to ${fmt(today.end)} ET, recalculated for your own city's sunrise.`;
    }
    const next = snap.entries.find((e) => dayKey(e.date) >= todayKey);
    if (next) {
      return `Not today. The next Amavasya is ${next.name} on ${formatLongDate(
        next.date,
      )}, tithi ${fmt(next.start)} to ${fmt(next.end)} ET, recalculated for your own city's sunrise.`;
    }
  } catch {
    /* fall through */
  }
  return FALLBACK;
}

export const Route = createFileRoute("/vrats/amavasya/")({
  head: () => {
    const description = metaDescription();
    const snap = (() => {
      try {
        return referenceMoonPhaseSnapshot("amavasya");
      } catch {
        return null;
      }
    })();
    const todayKey = snap ? dayKey(snap.today) : "";
    const next = snap?.entries.find((e) => dayKey(e.date) >= todayKey) ?? null;
    return {
      meta: [
        { title: TITLE },
        { name: "description", content: description },
        { property: "og:title", content: TITLE },
        { property: "og:description", content: description },
        canonicalOgUrl(PATH),
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: TITLE },
        { name: "twitter:description", content: description },
      ],
      links: [canonicalLink(PATH)],
      scripts: [
        ldJson([
          articleSchema({
            headline: "Is it Amavasya today? New moon dates and times in the US",
            description,
            url: URL,
          }),
          ...(next
            ? [
                eventSchema({
                  name: next.name,
                  description,
                  startDate: dayKey(next.date),
                  url: URL,
                  locationName: "United States",
                  address: { addressLocality: REFERENCE_CITY.name, addressCountry: "US" },
                }),
              ]
            : []),
          breadcrumbSchema([
            { name: "Home", url: `${SITE_URL}/` },
            { name: "Amavasya", url: URL },
          ]),
          faqPageSchema(FAQS),
          definedTermSchema({
            name: "Amavasya",
            alternateName: ["Amavas", "New moon tithi"],
            description:
              "The new moon tithi that closes the waning Krishna paksha, observed with tarpan for ancestors and, in some families, fasting.",
            url: URL,
          }),
        ]),
      ],
    };
  },
  component: () => <MoonPhaseHub kind="amavasya" faqs={FAQS} />,
});
