import { createFileRoute } from "@tanstack/react-router";

import { ParanaPage } from "@/components/parana/ParanaPage";
import { canonicalLink } from "@/lib/seo/canonical";
import {
  PARANA_FAQS,
  PARANA_URL,
  paranaDescriptionTomorrow,
  paranaTitleTomorrow,
} from "@/lib/seo/parana-meta";
import { SITE_URL, breadcrumbSchema, faqPageSchema, ldJson } from "@/lib/seo/schema";

/**
 * Exact-match entry page for "parana time tomorrow" queries. Renders the same
 * SSR content as /vrats/ekadashi/parana and canonicalizes to it so link
 * equity consolidates on a single URL instead of splitting across duplicates.
 */
export const Route = createFileRoute("/parana-time-tomorrow")({
  head: () => {
    const title = paranaTitleTomorrow();
    const description = paranaDescriptionTomorrow();
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: PARANA_URL },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [canonicalLink("/vrats/ekadashi/parana")],
      scripts: [
        ldJson([
          breadcrumbSchema([
            { name: "Home", url: `${SITE_URL}/` },
            { name: "Ekadashi", url: `${SITE_URL}/vrats/ekadashi` },
            { name: "Parana time tomorrow", url: PARANA_URL },
          ]),
          faqPageSchema(PARANA_FAQS),
        ]),
      ],
    };
  },
  component: ParanaPage,
});
