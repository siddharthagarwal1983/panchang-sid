import { useMemo } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays } from "lucide-react";

import { AppHeader } from "@/components/AppHeader";
import { usePrefs } from "@/lib/prefs";
import { scanFestivals } from "@/lib/panchang/festivals";
import { FESTIVAL_DETAILS } from "@/lib/panchang/festivalDetails";
import { formatLongDate } from "@/lib/panchang/tz";

const YEARS = ["2025", "2026"] as const;

const BASE_URL = "https://panchanga.lovable.app";

function titleFor(year: string) {
  return `Hindu Festival Calendar ${year} — Dates in Your Local Time | Panchanga`;
}

function descriptionFor(year: string) {
  return `Every major Hindu festival of ${year} — Holi, Ram Navami, Raksha Bandhan, Janmashtami, Navratri, Diwali and more — with dates recalculated for your own sunrise instead of India time.`;
}

export const Route = createFileRoute("/festivals/$year")({
  beforeLoad: ({ params }) => {
    if (!YEARS.includes(params.year as (typeof YEARS)[number])) throw notFound();
  },
  head: ({ params }) => ({
    meta: [
      { title: titleFor(params.year) },
      { name: "description", content: descriptionFor(params.year) },
      { property: "og:title", content: titleFor(params.year) },
      { property: "og:description", content: descriptionFor(params.year) },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: `${BASE_URL}/festivals/${params.year}` }],
  }),
  component: FestivalYearPage,
});

function FestivalYearPage() {
  const { year } = Route.useParams();
  const { city } = usePrefs();
  const y = Number(year);

  const months = useMemo(() => {
    const days = scanFestivals({ year: y, month: 1, day: 1 }, y % 4 === 0 ? 366 : 365, city);
    const buckets: { label: string; items: { date: string; name: string; note: string; about?: string }[] }[] = [];
    for (let m = 1; m <= 12; m++) {
      buckets.push({
        label: new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" }).format(
          new Date(Date.UTC(y, m - 1, 1)),
        ),
        items: [],
      });
    }
    for (const day of days) {
      for (const f of day.festivals) {
        if (f.category !== "major" && f.category !== "solar") continue;
        buckets[day.date.month - 1].items.push({
          date: formatLongDate(day.date),
          name: f.name,
          note: f.note,
          about: FESTIVAL_DETAILS[f.id]?.about,
        });
      }
    }
    return buckets.filter((b) => b.items.length > 0);
  }, [y, city]);

  const total = months.reduce((n, m) => n + m.items.length, 0);

  return (
    <main className="mx-auto max-w-md">
      <AppHeader title="Festivals" subtitle={`${year} guide`} headingSuffix={`— Hindu festival calendar ${year} in your local time`} />

      <div className="px-5 py-5">
        <Link
          to="/"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to today
        </Link>

        <article className="panel px-5 py-5">
          <h2 className="font-display text-lg text-foreground">
            Hindu festivals in {year}, dated for where you live
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Most panchang calendars publish festival dates for India. Because a tithi is read at{" "}
            <em>local sunrise</em>, the same festival can fall a day earlier or later in the United States,
            Canada, the UK or Australia. Every date below is recomputed with Drik Ganita and the Lahiri
            ayanamsa for <strong>{city.name}</strong> ({city.tz}), so you can plan pujas, fasts and time off
            with confidence.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {total} major observances are listed for {year}. Change your location from the pin in the header
            and the whole list recalculates.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {YEARS.map((v) => (
              <Link
                key={v}
                to="/festivals/$year"
                params={{ year: v }}
                className={`rounded-full border px-3 py-1 text-xs ${
                  v === year ? "border-primary text-primary" : "border-border text-muted-foreground"
                }`}
              >
                {v} calendar
              </Link>
            ))}
          </div>
        </article>

        {months.map((month) => (
          <section key={month.label} className="panel mt-4 px-5 py-4">
            <h2 className="font-display text-base text-foreground">
              {month.label} {year}
            </h2>
            <ul className="mt-3 space-y-3">
              {month.items.map((item, i) => (
                <li key={`${item.name}-${i}`} className="border-t border-border/60 pt-3 first:border-0 first:pt-0">
                  <h3 className="text-sm font-medium text-foreground">{item.name}</h3>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarDays className="size-3.5" />
                    {item.date}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {item.about ?? item.note}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <section className="panel mt-4 px-5 py-4 text-sm leading-relaxed text-muted-foreground">
          <h2 className="font-display text-base text-foreground">Why these dates differ from an India panchang</h2>
          <p className="mt-2">
            A tithi begins and ends at a precise moment worldwide, but the festival is observed on the day
            that tithi is running at your sunrise. If a tithi ends mid-morning in India, it may still be
            running at sunrise in New York — which is why diaspora families often celebrate a day apart from
            relatives back home. Panchanga resolves this automatically from your coordinates.
          </p>
          <p className="mt-2">
            For live tithi, nakshatra, Rahu Kalam and fasting windows, open{" "}
            <Link to="/" className="text-primary underline-offset-2 hover:underline">
              today's panchang
            </Link>{" "}
            or browse the{" "}
            <Link to="/calendar" className="text-primary underline-offset-2 hover:underline">
              month calendar
            </Link>
            .
          </p>
        </section>
      </div>
    </main>
  );
}