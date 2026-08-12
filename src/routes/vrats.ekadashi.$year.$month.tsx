import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { AppHeader } from "@/components/AppHeader";
import { FaqSection, type FaqItem } from "@/components/FaqSection";
import { ekadashiCalendar, type EkadashiEntry } from "@/lib/panchang/ekadashi";
import { dayKey, formatLongDate, formatTime, tzAbbr } from "@/lib/panchang/tz";
import { usePrefs } from "@/lib/prefs";
import { MONTHS, isEkadashiYear, monthBySlug } from "@/lib/seo/ekadashi-pages";
import { ekadashiDatesIn } from "@/lib/seo/ekadashi-dates";
import {
  SITE_URL,
  articleSchema,
  breadcrumbSchema,
  faqPageSchema,
  ldJson,
} from "@/lib/seo/schema";

const titleFor = (month: string, year: string) =>
  `Ekadashi in ${month} ${year} — Dates & Parana Time | Panchanga`;
const descriptionFor = (month: string, year: string) =>
  `Ekadashi dates in ${month} ${year} with names, fasting day and the exact parana window for your city's sunrise, not India time.`;

const faqsFor = (month: string, year: string): FaqItem[] => [
  {
    q: `When is Ekadashi in ${month} ${year}?`,
    a: `${month} ${year} normally has two Ekadashi fasts, one in the waxing Shukla paksha and one in the waning Krishna paksha. The exact dates are listed above for the city you selected, because the fast follows the tithi running at your own sunrise.`,
  },
  {
    q: `What is the parana time for ${month} ${year} Ekadashi?`,
    a: "Each entry shows the parana window for the next morning: after sunrise, inside Dwadashi and after Hari Vasara has passed.",
  },
  {
    q: "Can the date differ from an Indian panchang?",
    a: "Yes. Sunrise in the US, Canada, the UK or Australia falls many hours after Indian sunrise, so the udaya tithi — and therefore the fasting day — can land a day earlier or later.",
  },
];

export const Route = createFileRoute("/vrats/ekadashi/$year/$month")({
  beforeLoad: ({ params }) => {
    if (!isEkadashiYear(params.year) || !monthBySlug(params.month)) throw notFound();
  },
  head: ({ params }) => {
    const monthName = monthBySlug(params.month)?.name ?? params.month;
    const url = `${SITE_URL}/vrats/ekadashi/${params.year}/${params.month}`;
    return {
      meta: [
        { title: titleFor(monthName, params.year) },
        { name: "description", content: descriptionFor(monthName, params.year) },
        { property: "og:title", content: titleFor(monthName, params.year) },
        { property: "og:description", content: descriptionFor(monthName, params.year) },
        { property: "og:url", content: url },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        ldJson([
          articleSchema({
            headline: `Ekadashi in ${monthName} ${params.year}`,
            description: descriptionFor(monthName, params.year),
            url,
          }),
          breadcrumbSchema([
            { name: "Home", url: `${SITE_URL}/` },
            { name: "Ekadashi", url: `${SITE_URL}/vrats/ekadashi` },
            { name: `Ekadashi ${params.year}`, url: `${SITE_URL}/vrats/ekadashi/${params.year}` },
            { name: `${monthName} ${params.year}`, url },
          ]),
          faqPageSchema(faqsFor(monthName, params.year)),
        ]),
      ],
    };
  },
  component: EkadashiMonthPage,
});

function EkadashiMonthPage() {
  const { year, month } = Route.useParams();
  const monthMeta = monthBySlug(month);
  const monthName = monthMeta?.name ?? month;
  const y = Number(year);
  const { city, prefs, hydrated } = usePrefs();
  const now = useMemo(() => new Date(), []);
  const [entries, setEntries] = useState<EkadashiEntry[] | null>(null);

  useEffect(() => {
    if (!hydrated || !monthMeta) return;
    setEntries(null);
    const id = window.setTimeout(
      () => setEntries(ekadashiCalendar(y, city).filter((e) => e.date.month === monthMeta.number)),
      0,
    );
    return () => window.clearTimeout(id);
  }, [hydrated, y, city, monthMeta]);

  const zone = tzAbbr(now, city.tz);
  const t = (d: Date | null) => formatTime(d, city.tz, prefs.hour12);

  return (
    <main className="mx-auto max-w-md">
      <AppHeader
        title={`Ekadashi ${monthName} ${year}`}
        headingSuffix={`— Ekadashi dates and parana times in ${monthName} ${year}`}
        subtitle={`${city.name}, ${city.state}${zone ? ` · ${zone}` : ""}`}
        showLocation
      />

      <div className="space-y-4 px-5 py-5">
        {!entries ? (
          <section className="panel px-5 py-5 text-sm text-muted-foreground">
            Calculating {monthName} {year} dates for {city.name}…
          </section>
        ) : entries.length === 0 ? (
          <section className="panel px-5 py-5 text-sm text-muted-foreground">
            No Ekadashi falls in {monthName} {year} for {city.name}. Check the{" "}
            <Link
              to="/vrats/ekadashi/$year"
              params={{ year }}
              className="text-primary underline-offset-2 hover:underline"
            >
              full {year} calendar
            </Link>
            .
          </section>
        ) : (
          <section className="panel px-5 py-5">
            <h2 className="text-sm font-semibold text-foreground">
              Ekadashi dates in {monthName} {year}
            </h2>
            <ul className="mt-3 space-y-3">
              {entries.map((e) => (
                <li key={dayKey(e.date)} className="rounded-xl border border-border px-3 py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-sm font-medium text-foreground">{e.name}</p>
                    <p className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {formatLongDate(e.date)}
                    </p>
                  </div>
                  <p className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                    {e.masa} · {e.paksha} paksha
                  </p>
                  <p className="mt-1.5 text-xs tabular-nums text-muted-foreground">
                    Sunrise {t(e.sunrise)} · Ekadashi ends {t(e.tithiEnd)}
                  </p>
                  <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                    Parana {formatLongDate(e.parana.date)} · {t(e.parana.start)} – {t(e.parana.end)}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                    {e.parana.note}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {monthMeta && ekadashiDatesIn(Number(year), monthMeta.number).length > 0 && (
          <section className="panel px-5 py-4">
            <h2 className="text-sm font-semibold text-foreground">
              Each fast in {monthName} {year}
            </h2>
            <ul className="mt-3 space-y-1.5">
              {ekadashiDatesIn(Number(year), monthMeta.number).map((s) => (
                <li key={`${s.month}-${s.day}`}>
                  <Link
                    to="/vrats/ekadashi/$year/$month/$day"
                    params={{ year, month: s.monthSlug, day: String(s.day) }}
                    className="text-xs text-primary underline-offset-2 hover:underline"
                  >
                    {s.name} — {monthName} {s.day}, {s.year} parana time
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="panel px-5 py-4">
          <h2 className="text-sm font-semibold text-foreground">Other months in {year}</h2>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {MONTHS.map((m) => (
              <Link
                key={m.slug}
                to="/vrats/ekadashi/$year/$month"
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
          <Link
            to="/vrats/ekadashi/parana"
            className="text-primary underline-offset-2 hover:underline"
          >
            today's parana time
          </Link>{" "}
          or the{" "}
          <Link to="/vrats/ekadashi" className="text-primary underline-offset-2 hover:underline">
            Ekadashi hub
          </Link>
          .
        </p>
      </div>
    </main>
  );
}