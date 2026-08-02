import type { FaqItem } from "@/components/FaqSection";

export const SITE_URL = "https://indianpanchang.com";
export const ORG_ID = `${SITE_URL}/#organization`;

/** schema.org FAQPage node built from the same items rendered on the page. */
export function faqPageSchema(items: FaqItem[]) {
  return {
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export function breadcrumbSchema(trail: { name: string; url: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: t.url,
    })),
  };
}

export function articleSchema({
  headline,
  description,
  url,
}: {
  headline: string;
  description: string;
  url: string;
}) {
  return {
    "@type": "Article",
    headline,
    description,
    mainEntityOfPage: url,
    inLanguage: "en",
    publisher: { "@id": ORG_ID },
  };
}

export function ldJson(nodes: unknown[]) {
  return {
    type: "application/ld+json",
    children: JSON.stringify({ "@context": "https://schema.org", "@graph": nodes }),
  };
}

/** A schema.org Event node for a festival, vrat or observance. */
export function eventSchema({
  name,
  description,
  startDate,
  endDate,
  url,
  locationName,
}: {
  name: string;
  description: string;
  /** ISO date (YYYY-MM-DD) or full ISO datetime. */
  startDate: string;
  endDate?: string;
  url: string;
  locationName: string;
}) {
  return {
    "@type": "Event",
    name,
    description,
    startDate,
    ...(endDate ? { endDate } : {}),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: { "@type": "Place", name: locationName },
    url,
    isAccessibleForFree: true,
    organizer: { "@id": ORG_ID },
  };
}

/** An ordered ItemList. `items` may be plain nodes or name/url pairs. */
export function itemListSchema({
  name,
  description,
  items,
}: {
  name: string;
  description?: string;
  items: unknown[];
}) {
  return {
    "@type": "ItemList",
    name,
    ...(description ? { description } : {}),
    numberOfItems: items.length,
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item,
    })),
  };
}

/** DefinedTerm for panchang concepts (tithi, nakshatra, muhurta…). */
export function definedTermSchema({
  name,
  alternateName,
  description,
  url,
}: {
  name: string;
  alternateName?: string[];
  description: string;
  url: string;
}) {
  return {
    "@type": "DefinedTerm",
    name,
    ...(alternateName ? { alternateName } : {}),
    description,
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: "Hindu Panchāṅga terms",
      url: `${SITE_URL}/`,
    },
    url,
  };
}

export function webPageSchema({
  name,
  description,
  url,
  about,
}: {
  name: string;
  description: string;
  url: string;
  about?: unknown;
}) {
  return {
    "@type": "WebPage",
    name,
    description,
    url,
    inLanguage: "en",
    isPartOf: { "@id": SITE_URL },
    ...(about ? { about } : {}),
  };
}
