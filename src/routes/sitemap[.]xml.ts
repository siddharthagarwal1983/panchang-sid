import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import {
  SITEMAP_ENTRIES,
  assertSitemapExcludesMachineRoutes,
} from "@/lib/seo/sitemap-entries";

const BASE_URL = "https://panchanga.lovable.app";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        // Runtime safety net; the same check also gates the build (vite.config.ts).
        assertSitemapExcludesMachineRoutes();
        const entries = SITEMAP_ENTRIES;
        // Machine-only endpoints (/mcp, /.mcp/*, /.well-known/*, /.lovable/*) are
        // deliberately excluded: they return JSON or 401 and are not indexable
        // pages. Listing them produced crawl errors. They are blocked in robots.txt.

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});