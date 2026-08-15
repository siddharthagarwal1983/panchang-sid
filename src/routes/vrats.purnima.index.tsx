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

const PATH = "/vrats/purnima";
const URL = canonicalUrl(PATH);
const TITLE = "Is It Purnima Today? US Full Moon Dates | Panchanga";
const FALLBACK =
  "Check whether it is Purnima today in the US and see the next full moon date with its exact tithi start and end time for your own city, not India time.";

const FAQS: FaqItem[] = [
  {
    q: "Is it Purnima today?",
    a: "The card above answers it for the city you selected. Purnima is the full moon tithi, and the vrat day is the day whose local sunrise falls inside that tithi, so the US date can differ from the India date.",
  },
  {
    q: "When is Purnima this month?",
    a: "One Purnima falls in each lunar month, about 29 to 30 days apart. The list above gives the next five dates with their exact tithi start and end times in your local clock.",
  },
  {
    q: "Why does the Purnima vrat date differ from Indian calendars?",
    a: "The fast follows the tithi running at your own sunrise. Because US sunrise comes nine to twelve hours after Indian sunrise, the udaya tithi — and therefore the vrat day — often shifts by a day.",
  },
  {
    q: "Which Purnimas are major?",
    a: "Guru Purnima (Ashadha), Raksha Bandhan (Shravana), Sharad Purnima (Ashwina), Kartika Purnima and Holika Dahan on Phalguna Purnima are the most widely observed.",
  },
  {
    q: "How is the Purnima fast kept?",
    a: "Many observers take a single grain-free meal and break the fast after seeing the moon or after moonrise puja. Satyanarayan katha is commonly performed on this day.",
  },
];

function metaDescription(): string {
  try {
    const snap = referenceMoonPhaseSnapshot("purnima");
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
      return `Not today. The next Purnima is ${next.name} on ${formatLongDate(
        next.date,
      )}, tithi ${fmt(next.start)} to ${fmt(next.end)} ET, recalculated for your own city's sunrise.`;
    }
  } catch {
    /* fall through */
  }
  return FALLBACK;
}

export const Route = createFileRoute("/vrats/purnima/")({
  head: () => {
    const description = metaDescription();
    const snap = (() => {
      try {
        return referenceMoonPhaseSnapshot("purnima");
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
            headline: "Is it Purnima today? Full moon dates and times in the US",
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
            { name: "Purnima", url: URL },
          ]),
          faqPageSchema(FAQS),
          definedTermSchema({
            name: "Purnima",
            alternateName: ["Poornima", "Full moon tithi"],
            description:
              "The full moon tithi that closes the waxing Shukla paksha, kept as a vrat and the day of Satyanarayan puja.",
            url: URL,
          }),
        ]),
      ],
    };
  },
  component: () => <MoonPhaseHub kind="purnima" faqs={FAQS} />,
});
