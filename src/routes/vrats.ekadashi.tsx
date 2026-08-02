import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { AppHeader } from "@/components/AppHeader";
import { FaqSection, type FaqItem } from "@/components/FaqSection";
import { ekadashiCalendar } from "@/lib/panchang/ekadashi";
import { formatTime, formatLongDate, toCalendarDay, tzAbbr } from "@/lib/panchang/tz";
import { usePrefs } from "@/lib/prefs";
import {
  SITE_URL,
  articleSchema,
  breadcrumbSchema,
  definedTermSchema,
  faqPageSchema,
  itemListSchema,
  ldJson,
} from "@/lib/seo/schema";
import { ekadashiEventNodes } from "@/lib/seo/observance-events";

const TITLE = "Ekadashi 2026 Dates & Parana Times | Panchanga";
const DESCRIPTION =
  "Every Ekadashi date with the exact parana (fast-breaking) window calculated for your own city's sunrise and Dwadashi end — not India time.";
const URL = `${SITE_URL}/vrats/ekadashi`;

const FAQS: FaqItem[] = [
  {
    q: "What is Ekadashi parana time?",
    a: "Parana is the meal that ends the Ekadashi fast. It is taken the morning after the fast, after sunrise, within Dwadashi tithi and after Hari Vasara — the first quarter of Dwadashi — has passed. This page shows that window in your local clock time.",
  },
  {
    q: "Why do my Ekadashi dates differ from Indian calendars?",
    a: "Ekadashi is fixed by the tithi running at local sunrise. Sunrise in the US, Canada or the UK happens many hours after sunrise in India, so the fasting day can fall a day earlier or later than an India-printed panchang. Every date on this page is computed for the city you selected.",
  },
  {
    q: "What happens when Ekadashi falls on two days?",
    a: "When Ekadashi tithi covers two consecutive sunrises (vriddhi), Smarta householders fast on the first day and Vaishnavas fast on the second. Both days are listed here and labelled so you can follow your own tradition.",
  },
  {
    q: "What can I eat on Ekadashi?",
    a: "The fast is grain-free: no rice, wheat or lentils. Fruit, milk, nuts, potato and sabudana (phalahar) are allowed, with rock salt only. Nirjala observers take no food or water until parana.",
  },
  {
    q: "How many Ekadashi fasts are there in a year?",
    a: "Two each lunar month, one in the waxing Shukla paksha and one in the waning Krishna paksha — 24 in a normal year, and 26 in a year with an Adhika Masa, when Padmini and Parama Ekadashi are added.",
  },
];

export const Route = createFileRoute("/vrats/ekadashi")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: URL },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      ldJson([
        articleSchema({
          headline: "Ekadashi dates and parana times for your location",
          description: DESCRIPTION,
          url: URL,
        }),
        breadcrumbSchema([
          { name: "Home", url: `${SITE_URL}/` },
          { name: "Ekadashi dates and parana", url: URL },
        ]),
        faqPageSchema(FAQS),
        itemListSchema({
          name: `Ekadashi fasting dates ${new Date().getUTCFullYear()}`,
          description:
            "Every Ekadashi vrat of the year with its parana (fast-breaking) window.",
          items: ekadashiEventNodes(new Date().getUTCFullYear()),
        }),
        definedTermSchema({
          name: "Ekadashi",
          alternateName: ["Ekadasi", "Ekadashi vrat"],
          description:
            "The eleventh tithi of each lunar fortnight, observed as a grain-free fast that is broken during the parana window the following morning.",
          url: URL,
        }),
      ]),
    ],
  }),
  component: EkadashiPage,
});

function EkadashiPage() {
  const { city, prefs, hydrated } = usePrefs();
  const now = useMemo(() => new Date(), []);
  const today = useMemo(() => toCalendarDay(now, city.tz), [now, city.tz]);
  const [year, setYear] = useState(() => today.year);
  const [entries, setEntries] = useState<ReturnType<typeof ekadashiCalendar> | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    setEntries(null);
    // Yield a frame so the loading state paints before the year-long scan.
    const id = window.setTimeout(() => setEntries(ekadashiCalendar(year, city)), 0);
    return () => window.clearTimeout(id);
  }, [hydrated, year, city]);

  const zone = tzAbbr(now, city.tz);
  const t = (d: Date | null) => formatTime(d, city.tz, prefs.hour12);
  const years = [today.year, today.year + 1];
  const todayKey = `${today.year}-${today.month}-${today.day}`;

  return (
    <main className="mx-auto max-w-md">
      <AppHeader
        title={`Ekadashi ${year}`}
        headingSuffix="— fasting dates and local parana times"
        subtitle={`${city.name}, ${city.state}${zone ? ` · ${zone}` : ""}`}
        showLocation
      />

      <div className="space-y-4 px-5 py-5">
        <section className="panel px-5 py-5">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Each fast below is the Ekadashi tithi running at sunrise in {city.name}. Parana is the
            next morning, after sunrise, within Dwadashi and after Hari Vasara has passed — shown
            here in your local time.
          </p>
          <div className="mt-3 flex gap-1 rounded-full border border-border bg-secondary/40 p-1">
            {years.map((y) => (
              <button
                key={y}
                onClick={() => setYear(y)}
                aria-pressed={y === year}
                className={`flex-1 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                  y === year ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {y}
              </button>
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
              Ekadashi dates and parana windows in {year}
            </h2>
            <ul className="mt-3 space-y-3">
              {entries.map((e) => {
                const key = `${e.date.year}-${e.date.month}-${e.date.day}`;
                return (
                  <li
                    key={key}
                    className={`rounded-xl border px-3 py-3 ${
                      key === todayKey ? "border-gold/50 bg-gold/10" : "border-border"
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
                      {e.vriddhi
                        ? e.vriddhi === "smarta"
                          ? " · Smarta fast"
                          : " · Vaishnava fast"
                        : ""}
                    </p>
                    <dl className="mt-2 space-y-1 text-xs">
                      <Row label="Sunrise" value={t(e.sunrise)} />
                      <Row label="Ekadashi ends" value={t(e.tithiEnd)} />
                      <Row
                        label={`Parana ${formatLongDate(e.parana.date)}`}
                        value={
                          e.parana.start && e.parana.end
                            ? `${t(e.parana.start)} – ${t(e.parana.end)}`
                            : "After sunrise"
                        }
                      />
                    </dl>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                      {e.parana.note}
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <section className="panel px-5 py-5">
          <h2 className="text-sm font-semibold text-foreground">How parana time is calculated</h2>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Parana must be done on Dwadashi, after sunrise and after Hari Vasara — the first quarter
            of Dwadashi tithi. The preferred window is the first fifth of the day after sunrise. If
            Dwadashi ends before that, parana is taken before Dwadashi ends; if Dwadashi has already
            ended at sunrise, the fast is broken soon after sunrise. All timings use true sun and
            moon positions with the Lahiri ayanamsa at your own coordinates.
          </p>
        </section>

        <FaqSection items={FAQS} />

        <p className="px-1 text-xs text-muted-foreground">
          See also{" "}
          <Link to="/tithi-today" className="text-primary underline-offset-2 hover:underline">
            today's tithi
          </Link>{" "}
          and{" "}
          <Link
            to="/festivals/$year"
            params={{ year: String(year) }}
            className="text-primary underline-offset-2 hover:underline"
          >
            {year} festival dates
          </Link>
          .
        </p>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular-nums text-foreground">{value}</dd>
    </div>
  );
}