import { createFileRoute } from "@tanstack/react-router";

import { ParanaPage } from "@/components/parana/ParanaPage";
import { canonicalLink } from "@/lib/seo/canonical";
import {
  PARANA_FAQS,
  PARANA_URL,
  paranaDescriptionHub,
  paranaTitleHub,
} from "@/lib/seo/parana-meta";
import {
  SITE_URL,
  articleSchema,
  breadcrumbSchema,
  definedTermSchema,
  faqPageSchema,
  ldJson,
} from "@/lib/seo/schema";

export const Route = createFileRoute("/vrats/ekadashi/parana")({
  head: () => {
    const title = paranaTitleHub();
    const description = paranaDescriptionHub();
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: PARANA_URL },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
      links: [canonicalLink("/vrats/ekadashi/parana")],
      scripts: [
        ldJson([
          articleSchema({
            headline: "Ekadashi parana time today and tomorrow",
            description,
            url: PARANA_URL,
          }),
          breadcrumbSchema([
            { name: "Home", url: `${SITE_URL}/` },
            { name: "Ekadashi", url: `${SITE_URL}/vrats/ekadashi` },
            { name: "Parana time today and tomorrow", url: PARANA_URL },
          ]),
          faqPageSchema(PARANA_FAQS),
          definedTermSchema({
            name: "Parana",
            alternateName: ["Ekadashi parana", "Dwadashi parana"],
            description:
              "The meal that ends an Ekadashi fast, taken after sunrise on Dwadashi once Hari Vasara has passed and before Dwadashi tithi ends.",
            url: PARANA_URL,
          }),
        ]),
      ],
    };
  },
  component: ParanaPage,
});
