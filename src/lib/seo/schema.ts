import type { FaqItem } from "@/components/FaqSection";

export const SITE_URL = "https://indianpanchang.com";
export const ORG_ID = `${SITE_URL}/#organization`;
export const SITE_ID = `${SITE_URL}/#website`;
/** Absolute image used for Article/Event `image` (Google requires absolute URLs). */
export const SITE_IMAGE = `${SITE_URL}/app-icon-512.png`;
/** Static dates keep SSR and hydration output identical. */
export const SITE_PUBLISHED = "2026-01-01";
export const SITE_MODIFIED = "2026-08-02";

export const ORG_NODE = {
  "@type": "Organization",
  "@id": ORG_ID,
  name: "Panchāṅga",
  alternateName: ["Panchang", "Panchanga"],
  url: SITE_URL,
  logo: {
    "@type": "ImageObject",
    url: SITE_IMAGE,
    width: 512,
    height: 512,
  },
};

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
  datePublished = SITE_PUBLISHED,
  dateModified = SITE_MODIFIED,
  image = SITE_IMAGE,
}: {
  headline: string;
  description: string;
  url: string;
  datePublished?: string;
  dateModified?: string;
  image?: string;
}) {
  return {
    "@type": "Article",
    headline,
    description,
    image: [image],
    datePublished,
    dateModified,
    isAccessibleForFree: true,
    author: { "@id": ORG_ID },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
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
  address,
  image = SITE_IMAGE,
}: {
  name: string;
  description: string;
  /** ISO date (YYYY-MM-DD) or full ISO datetime. */
  startDate: string;
  endDate?: string;
  url: string;
  locationName: string;
  address?: { addressLocality: string; addressRegion?: string; addressCountry: string };
  image?: string;
}) {
  return {
    "@type": "Event",
    name,
    description,
    startDate,
    endDate: endDate ?? startDate,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: locationName,
      address: address
        ? { "@type": "PostalAddress", ...address }
        : { "@type": "PostalAddress", addressCountry: "US" },
    },
    image: [image],
    url,
    isAccessibleForFree: true,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url,
      validFrom: SITE_PUBLISHED,
    },
    performer: { "@id": ORG_ID },
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
    "@id": url,
    name,
    description,
    url,
    inLanguage: "en",
    isPartOf: { "@id": SITE_ID },
    primaryImageOfPage: { "@type": "ImageObject", url: SITE_IMAGE },
    datePublished: SITE_PUBLISHED,
    dateModified: SITE_MODIFIED,
    ...(about ? { about } : {}),
  };
}
