import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { AppHeader } from "@/components/AppHeader";
import { FaqSection, type FaqItem } from "@/components/FaqSection";
import { ekadashiCalendar, type EkadashiEntry } from "@/lib/panchang/ekadashi";
import { dayKey, formatLongDate, formatTime, toCalendarDay, tzAbbr } from "@/lib/panchang/tz";
import { usePrefs } from "@/lib/prefs";
import {
  EKADASHI_SITEMAP_YEARS,
  MONTHS,
  isEkadashiYear,
} from "@/lib/seo/ekadashi-pages";
import {
  SITE_URL,
  articleSchema,
  breadcrumbSchema,
  faqPageSchema,
  itemListSchema,
  ldJson,
} from "@/lib/seo/schema";
import { ekadashiEventNodes } from "@/lib/seo/observance-events";

const titleFor = (year: string) => `Ekadashi ${year} Dates & Parana Times | Panchanga`;
const descriptionFor = (year: string) =>
  `All ${year} Ekadashi dates, names and parana (fast-breaking) windows calculated for your own city's sunrise instead of India time.`;

const faqsFor = (year: string): FaqItem[] => [
  {
    q: `How many Ekadashi fasts are there in ${year}?`,
    a: `There are two Ekadashis in each lunar month — 24 in a normal year and 26 when an Adhika Masa adds Padmini and Parama Ekadashi. The list below shows every one that falls in the ${year} calendar year for your location.`,
  },
  {
    q: `When is the next Ekadashi in ${year}?`,
    a: `The upcoming fast is highlighted in the list below, with its parana window for the morning after. Ekadashi recurs roughly every 14 to 15 days.`,
  },
  {
    q: `Why do these ${year} dates differ from an Indian calendar?`,
    a: `The fasting day is the day whose local sunrise falls inside Ekadashi tithi. Sunrise outside India happens many hours later, so the date can shift by a day. Every date here is recomputed for the city you selected.`,
  },
  {
    q: "What is the parana time for each fast?",
    a: "Parana is taken the next morning after sunrise, inside Dwadashi and after Hari Vasara has passed. Each entry lists that window in your local clock time.",
  },
];

export const Route = createFileRoute("/vrats/ekadashi/$year/")({
  beforeLoad: ({ params }) => {
    if (!isEkadashiYear(params.year)) throw notFound();
  },
  head: ({ params }) => {
    const url = `${SITE_URL}/vrats/ekadashi/${params.year}`;
    return {
      meta: [
        { title: titleFor(params.year) },
        { name: "description", content: descriptionFor(params.year) },
        { property: "og:title", content: titleFor(params.year) },
        { property: "og:description", content: descriptionFor(params.year) },
        { property: "og:url", content: url },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        ldJson([
          articleSchema({
            headline: `Ekadashi ${params.year} dates and parana times`,
            description: descriptionFor(params.year),
            url,
          }),
          breadcrumbSchema([
            { name: "Home", url: `${SITE_URL}/` },
            { name: "Ekadashi", url: `${SITE_URL}/vrats/ekadashi` },
            { name: `Ekadashi ${params.year}`, url },
          ]),
          faqPageSchema(faqsFor(params.year)),
          itemListSchema({
            name: `Ekadashi fasting dates ${params.year}`,
            description: descriptionFor(params.year),
            items: ekadashiEventNodes(Number(params.year)),
          }),
        ]),
      ],
    };
  },
  component: EkadashiYearPage,
});

function EkadashiYearPage() {
  const { year } = Route.useParams();
  const y = Number(year);
  const { city, prefs, hydrated } = usePrefs();
  const now = useMemo(() => new Date(), []);
  const today = useMemo(() => toCalendarDay(now, city.tz), [now, city.tz]);
  const [entries, setEntries] = useState<EkadashiEntry[] | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    setEntries(null);
    const id = window.setTimeout(() => setEntries(ekadashiCalendar(y, city)), 0);
    return () => window.clearTimeout(id);
  }, [hydrated, y, city]);

  const zone = tzAbbr(now, city.tz);
  const t = (d: Date | null) => formatTime(d, city.tz, prefs.hour12);
  const todayKey = dayKey(today);
  const nextKey = entries?.find((e) => dayKey(e.date) >= todayKey)?.date;

  return (
    <main className="mx-auto max-w-md">
      <AppHeader
        title={`Ekadashi ${year}`}
        headingSuffix={`— all ${year} Ekadashi dates and parana times`}
        subtitle={`${city.name}, ${city.state}${zone ? ` · ${zone}` : ""}`}
        showLocation
      />

      <div className="space-y-4 px-5 py-5">
        <section className="panel px-5 py-5">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Every Ekadashi vrat of {year} with its name, lunar month and the parana window for the
            following morning, recomputed for {city.name}. Jump to a month, or open{" "}
            <Link
              to="/vrats/ekadashi/parana"
              className="text-primary underline-offset-2 hover:underline"
            >
              today's parana time
            </Link>
            .
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {MONTHS.map((m) => (
              <Link
                key={m.slug}
                to="/vrats/ekadashi/$year/$month"
                params={{ year, month: m.slug }}
                className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                {m.name.slice(0, 3)}
              </Link>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {EKADASHI_SITEMAP_YEARS.map((v) => (
              <Link
                key={v}
                to="/vrats/ekadashi/$year"
                params={{ year: String(v) }}
                className={`rounded-full border px-3 py-1 text-xs ${
                  String(v) === year ? "border-primary text-primary" : "border-border text-muted-foreground"
                }`}
              >
                Ekadashi {v}
              </Link>
            ))}
          </div>
        </section>

        {!entries ? (
          <section className="panel px-5 py-5 text-sm text-muted-foreground">
            Calculating {year} Ekadashi dates for {city.name}…
          </section>
        ) : (
          <section className="panel px-5 py-5">
            <h2 className="text-sm font-semibold text-foreground">
              Ekadashi list for {year} ({entries.length} fasts)
            </h2>
            <ul className="mt-3 space-y-3">
              {entries.map((e) => {
                const key = dayKey(e.date);
                const isNext = nextKey ? key === dayKey(nextKey) : false;
                return (
                  <li
                    key={key}
                    className={`rounded-xl border px-3 py-3 ${
                      isNext ? "border-gold/50 bg-gold/10" : "border-border"
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-sm font-medium text-foreground">{e.name}</p>
                      <p className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {formatLongDate(e.date)}
                      </p>
                    </div>
                    <p className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                      {e.masa} · {e.paksha} paksha
                      {isNext ? " · next fast" : ""}
                    </p>
                    <p className="mt-1.5 text-xs tabular-nums text-muted-foreground">
                      Parana {formatLongDate(e.parana.date)} · {t(e.parana.start)} –{" "}
                      {t(e.parana.end)}
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <FaqSection items={faqsFor(year)} />
      </div>
    </main>
  );
}