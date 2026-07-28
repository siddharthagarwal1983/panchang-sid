import type { FaqItem } from "@/components/FaqSection";

export const SITE_URL = "https://panchanga.lovable.app";
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
