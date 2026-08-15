import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { AppHeader } from "@/components/AppHeader";
import { FaqSection, type FaqItem } from "@/components/FaqSection";
import { REFERENCE_CITY } from "@/lib/panchang/parana-snapshot";
import { scanMoonPhases, type MoonPhaseEntry } from "@/lib/panchang/moon-phase";
import type { City } from "@/lib/panchang/cities";
import { dayKey, formatLongDate, formatTime, tzAbbr } from "@/lib/panchang/tz";
import { usePrefs } from "@/lib/prefs";
import { MONTHS, isEkadashiYear, monthBySlug } from "@/lib/seo/ekadashi-pages";
import { canonicalLink, canonicalOgUrl, canonicalUrl } from "@/lib/seo/canonical";
import {
  SITE_URL,
  articleSchema,
  breadcrumbSchema,
  eventSchema,
  faqPageSchema,
  ldJson,
} from "@/lib/seo/schema";

const DAYS_IN_MONTH = (year: number, month: number) =>
  new Date(Date.UTC(year, month, 0)).getUTCDate();

/** Amavasya days inside one calendar month for a city (cheap ~31-day scan). */
function amavasyaInMonth(city: City, year: number, month: number): MoonPhaseEntry[] {
  return scanMoonPhases({ year, month, day: 1 }, DAYS_IN_MONTH(year, month), city, "amavasya");
}

const titleFor = (month: string, year: string) => `Amavasya ${month} ${year} — Date & Time (US)`;

function descriptionFor(month: string, year: string, entries: MoonPhaseEntry[]): string {
  const fmt = (d: Date | null) => formatTime(d, REFERENCE_CITY.tz, true);
  if (entries.length > 0) {
    const e = entries[0];
    return `Amavasya in ${month} ${year} falls on ${formatLongDate(e.date)}, with the tithi running ${fmt(
      e.start,
    )} to ${fmt(e.end)} ET. Recalculated for your own city's sunrise, not India time.`;
  }
  return `Amavasya dates in ${month} ${year} with the exact new moon tithi start and end times for your own city's sunrise, not India time.`;
}

const faqsFor = (month: string, year: string): FaqItem[] => [
  {
    q: `When is Amavasya in ${month} ${year}?`,
    a: `The date and exact tithi window for ${month} ${year} are listed above for the city you selected, because Amavasya is fixed by the tithi running at your own sunrise.`,
  },
  {
    q: `Can the ${month} ${year} Amavasya date differ from an Indian calendar?`,
    a: "Yes. US sunrise falls nine to twelve hours after Indian sunrise, so the udaya tithi — and therefore the observance day — can land a day earlier or later.",
  },
  {
    q: "What is done on Amavasya?",
    a: "It is the traditional day for pitru tarpan and shraddha, charity and, in some families, a fast. Somvati Amavasya (a Monday Amavasya) is considered especially auspicious.",
  },
];

export const Route = createFileRoute("/vrats/amavasya/$year/$month")({
  beforeLoad: ({ params }) => {
    if (!isEkadashiYear(params.year) || !monthBySlug(params.month)) throw notFound();
  },
  head: ({ params }) => {
    const meta = monthBySlug(params.month);
    const monthName = meta?.name ?? params.month;
    const path = `/vrats/amavasya/${params.year}/${params.month}`;
    const url = canonicalUrl(path);
    let entries: MoonPhaseEntry[] = [];
    try {
      if (meta) entries = amavasyaInMonth(REFERENCE_CITY, Number(params.year), meta.number);
    } catch {
      /* fall back to the generic description */
    }
    const title = titleFor(monthName, params.year);
    const description = descriptionFor(monthName, params.year, entries);
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        canonicalOgUrl(path),
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
      links: [canonicalLink(path)],
      scripts: [
        ldJson([
          articleSchema({
            headline: `Amavasya in ${monthName} ${params.year} — date and time`,
            description,
            url,
          }),
          ...entries.map((e) =>
            eventSchema({
              name: e.name,
              description,
              startDate: dayKey(e.date),
              url,
              locationName: "United States",
              address: { addressLocality: REFERENCE_CITY.name, addressCountry: "US" },
            }),
          ),
          breadcrumbSchema([
            { name: "Home", url: `${SITE_URL}/` },
            { name: "Amavasya", url: canonicalUrl("/vrats/amavasya") },
            { name: `${monthName} ${params.year}`, url },
          ]),
          faqPageSchema(faqsFor(monthName, params.year)),
        ]),
      ],
    };
  },
  component: AmavasyaMonthPage,
});

function AmavasyaMonthPage() {
  const { year, month } = Route.useParams();
  const monthMeta = monthBySlug(month)!;
  const monthName = monthMeta.name;
  const y = Number(year);
  const { city, prefs, hydrated } = usePrefs();
  const now = useMemo(() => new Date(), []);

  // Server-rendered with the reference city so the HTML ships real dates, then
  // recomputed for the visitor's own location after hydration.
  const [view, setView] = useState(() => ({
    city: REFERENCE_CITY,
    entries: amavasyaInMonth(REFERENCE_CITY, y, monthMeta.number),
  }));

  useEffect(() => {
    if (!hydrated || city.id === REFERENCE_CITY.id) return;
    const id = window.setTimeout(
      () => setView({ city, entries: amavasyaInMonth(city, y, monthMeta.number) }),
      0,
    );
    return () => window.clearTimeout(id);
  }, [hydrated, city, y, monthMeta.number]);

  const zone = tzAbbr(now, view.city.tz);
  const t = (d: Date | null) => formatTime(d, view.city.tz, prefs.hour12);

  return (
    <main className="mx-auto max-w-md">
      <AppHeader
        title={`Amavasya ${monthName} ${year}`}
        headingSuffix={`— Amavasya date and tithi time in ${monthName} ${year}`}
        subtitle={`${view.city.name}, ${view.city.state}${zone ? ` · ${zone}` : ""}`}
        showLocation
      />

      <div className="space-y-4 px-5 py-5">
        <section className="panel px-5 py-5">
          <h2 className="text-sm font-semibold text-foreground">
            Amavasya in {monthName} {year}
          </h2>
          {view.entries.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              No Amavasya falls in {monthName} {year} for {view.city.name}. Check the{" "}
              <Link to="/vrats/amavasya" className="text-primary underline-offset-2 hover:underline">
                Amavasya hub
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {view.entries.map((e) => (
                <li key={dayKey(e.date)} className="rounded-xl border border-border px-3 py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-sm font-medium text-foreground">{e.name}</p>
                    <p className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {formatLongDate(e.date)}
                    </p>
                  </div>
                  <p className="mt-1.5 text-xs tabular-nums text-muted-foreground">
                    Tithi {t(e.start)} – {t(e.end)} · sunrise {t(e.sunrise)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel px-5 py-4">
          <h2 className="text-sm font-semibold text-foreground">Other months in {year}</h2>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {MONTHS.map((m) => (
              <Link
                key={m.slug}
                to="/vrats/amavasya/$year/$month"
                params={{ year, month: m.slug }}
                className={`rounded-full border px-2.5 py-1 text-[11px] ${
                  m.slug === month ? "border-primary text-primary" : "border-border text-muted-foreground"
                }`}
              >
                {m.name.slice(0, 3)}
              </Link>
            ))}
          </div>
        </section>

        <FaqSection items={faqsFor(monthName, year)} />

        <p className="px-1 text-xs text-muted-foreground">
          See{" "}
          <Link to="/vrats/amavasya" className="text-primary underline-offset-2 hover:underline">
            is it Amavasya today
          </Link>{" "}
          or{" "}
          <Link to="/vrats/purnima" className="text-primary underline-offset-2 hover:underline">
            Purnima dates
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
