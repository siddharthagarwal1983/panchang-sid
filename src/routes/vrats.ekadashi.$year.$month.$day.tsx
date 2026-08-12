import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { AppHeader } from "@/components/AppHeader";
import { FaqSection, type FaqItem } from "@/components/FaqSection";
import type { EkadashiEntry } from "@/lib/panchang/ekadashi";
import { ekadashiNearDay } from "@/lib/panchang/ekadashi-day";
import { REFERENCE_CITY } from "@/lib/panchang/parana-snapshot";
import { dayKey, formatLongDate, formatTime, tzAbbr } from "@/lib/panchang/tz";
import { usePrefs } from "@/lib/prefs";
import {
  adjacentEkadashi,
  ekadashiPath,
  findEkadashiDate,
  type EkadashiDateStub,
} from "@/lib/seo/ekadashi-dates";
import { monthBySlug } from "@/lib/seo/ekadashi-pages";
import {
  SITE_URL,
  articleSchema,
  breadcrumbSchema,
  eventSchema,
  faqPageSchema,
  ldJson,
} from "@/lib/seo/schema";

const iso = (y: number, m: number, d: number) =>
  `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

const longDate = (s: EkadashiDateStub) => formatLongDate({ year: s.year, month: s.month, day: s.day });

/** Short date keeps the title under ~60 characters. */
const shortDate = (s: EkadashiDateStub) =>
  `${(monthBySlug(s.monthSlug)?.name ?? s.monthSlug).slice(0, 3)} ${s.day}, ${s.year}`;

const titleFor = (s: EkadashiDateStub) => `${s.name} ${shortDate(s)} — Parana Time`;

/** Concrete reference-city times so the snippet carries real numbers. */
function referenceEntry(s: EkadashiDateStub): EkadashiEntry | null {
  try {
    return ekadashiNearDay(REFERENCE_CITY, { year: s.year, month: s.month, day: s.day });
  } catch {
    return null;
  }
}

function descriptionFor(s: EkadashiDateStub, entry: EkadashiEntry | null): string {
  const t = (d: Date | null) => formatTime(d, REFERENCE_CITY.tz, true);
  if (entry) {
    return `${s.name} is on ${longDate(s)}. Parana on ${formatLongDate(entry.parana.date)} between ${t(
      entry.parana.start,
    )} and ${t(entry.parana.end)} ET, recalculated for your own city's sunrise.`;
  }
  return `${s.name} on ${longDate(s)} with its fasting rules and the exact parana window for your own city's sunrise, not India time.`;
}

const faqsFor = (s: EkadashiDateStub): FaqItem[] => [
  {
    q: `What is the parana time for ${s.name} on ${longDate(s)}?`,
    a: "Parana is taken the next morning after sunrise, inside Dwadashi and once Hari Vasara — the first quarter of Dwadashi — has passed. The exact window for your city is shown above.",
  },
  {
    q: `Is ${s.name} on ${longDate(s)} in the US too?`,
    a: "The fast follows the tithi running at your own sunrise, so in far-western US cities it can land a day earlier or later than an India-printed panchang. Set your city with the location pin and the date and window are recomputed.",
  },
  {
    q: "What can I eat on this fast?",
    a: "The vrat is grain-free: no rice, wheat or lentils. Fruit, milk, nuts, potato and sabudana are allowed, with rock salt only. Nirjala observers take neither food nor water until parana.",
  },
];

export const Route = createFileRoute("/vrats/ekadashi/$year/$month/$day")({
  beforeLoad: ({ params }) => {
    if (!findEkadashiDate(params.year, params.month, params.day)) throw notFound();
  },
  head: ({ params }) => {
    const stub = findEkadashiDate(params.year, params.month, params.day);
    if (!stub) {
      return { meta: [{ title: "Ekadashi not found" }, { name: "robots", content: "noindex" }] };
    }
    const url = `${SITE_URL}${ekadashiPath(stub)}`;
    const entry = referenceEntry(stub);
    const title = titleFor(stub);
    const description = descriptionFor(stub, entry);
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        ldJson([
          articleSchema({
            headline: `${stub.name} ${longDate(stub)} — date and parana time`,
            description,
            url,
          }),
          eventSchema({
            name: `${stub.name} ${stub.year}`,
            description,
            startDate: iso(stub.year, stub.month, stub.day),
            url,
            locationName: "United States",
            address: { addressLocality: REFERENCE_CITY.name, addressCountry: "US" },
          }),
          breadcrumbSchema([
            { name: "Home", url: `${SITE_URL}/` },
            { name: "Ekadashi", url: `${SITE_URL}/vrats/ekadashi` },
            { name: `Ekadashi ${stub.year}`, url: `${SITE_URL}/vrats/ekadashi/${stub.year}` },
            {
              name: `${monthBySlug(stub.monthSlug)?.name ?? stub.monthSlug} ${stub.year}`,
              url: `${SITE_URL}/vrats/ekadashi/${stub.year}/${stub.monthSlug}`,
            },
            { name: `${stub.name} ${longDate(stub)}`, url },
          ]),
          faqPageSchema(faqsFor(stub)),
        ]),
      ],
    };
  },
  component: EkadashiDatePage,
});

function EkadashiDatePage() {
  const params = Route.useParams();
  const stub = findEkadashiDate(params.year, params.month, params.day)!;
  const target = { year: stub.year, month: stub.month, day: stub.day };
  const { city, prefs, hydrated } = usePrefs();
  const now = useMemo(() => new Date(), []);

  // Server-rendered with the reference city so the HTML ships real times, then
  // recomputed for the visitor's own location after hydration.
  const [view, setView] = useState(() => ({
    city: REFERENCE_CITY,
    entry: referenceEntry(stub),
  }));

  useEffect(() => {
    if (!hydrated || city.id === REFERENCE_CITY.id) return;
    const id = window.setTimeout(
      () => setView({ city, entry: ekadashiNearDay(city, target) }),
      0,
    );
    return () => window.clearTimeout(id);
  }, [hydrated, city, target.year, target.month, target.day]);

  const entry = view.entry;
  const zone = tzAbbr(now, view.city.tz);
  const t = (d: Date | null) => formatTime(d, view.city.tz, prefs.hour12);
  const shifted = entry ? dayKey(entry.date) !== dayKey(target) : false;
  const { prev, next } = adjacentEkadashi(stub);
  const monthName = monthBySlug(stub.monthSlug)?.name ?? stub.monthSlug;

  return (
    <main className="mx-auto max-w-md">
      <AppHeader
        title={stub.name}
        headingSuffix={`— ${longDate(stub)} date and parana time`}
        subtitle={`${view.city.name}, ${view.city.state}${zone ? ` · ${zone}` : ""}`}
        showLocation
      />

      <div className="space-y-4 px-5 py-5">
        <section className="panel px-5 py-5">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {stub.masa} · {stub.paksha} paksha
            {stub.vriddhi ? ` · ${stub.vriddhi === "smarta" ? "Smarta day" : "Vaishnava day"}` : ""}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-foreground">
            {stub.name} — {longDate(stub)}
          </h2>
          {entry ? (
            <>
              <p className="mt-2 text-xs tabular-nums text-muted-foreground">
                Fast day {formatLongDate(entry.date)} · sunrise {t(entry.sunrise)} · Ekadashi tithi
                ends {t(entry.tithiEnd)}
              </p>
              <p className="mt-3 text-[11px] uppercase tracking-wider text-muted-foreground">
                Parana — {formatLongDate(entry.parana.date)}
              </p>
              <p className="mt-1 text-2xl tabular-nums text-foreground">
                {t(entry.parana.start)} – {t(entry.parana.end)}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {entry.parana.note}
              </p>
              {shifted && (
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  In {view.city.name} the udaya tithi puts this fast on{" "}
                  <strong className="text-foreground">{formatLongDate(entry.date)}</strong> rather
                  than {longDate(stub)} — local sunrise decides the day.
                </p>
              )}
            </>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Calculating times for {view.city.name}…
            </p>
          )}
          {view.city.id === REFERENCE_CITY.id && (
            <p className="mt-3 text-xs text-muted-foreground">
              Showing times for {view.city.name}, {view.city.state}. Tap the location pin to
              recalculate for your own city.
            </p>
          )}
        </section>

        <section className="panel px-5 py-5">
          <h2 className="text-sm font-semibold text-foreground">How this fast is kept</h2>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {stub.name} falls in the {stub.paksha} paksha of {stub.masa}. The vrat begins at sunrise
            on {longDate(stub)} and is grain-free through the day; devotees keep a night vigil,
            recite Vishnu Sahasranama and break the fast the next morning inside the parana window
            above — after sunrise, inside Dwadashi and once Hari Vasara has passed.
          </p>
        </section>

        <section className="panel px-5 py-4">
          <h2 className="text-sm font-semibold text-foreground">Nearby Ekadashi dates</h2>
          <div className="mt-3 flex flex-col gap-2 text-xs">
            {prev && (
              <Link
                to="/vrats/ekadashi/$year/$month/$day"
                params={{ year: String(prev.year), month: prev.monthSlug, day: String(prev.day) }}
                className="text-primary underline-offset-2 hover:underline"
              >
                ← {prev.name} · {longDate(prev)}
              </Link>
            )}
            {next && (
              <Link
                to="/vrats/ekadashi/$year/$month/$day"
                params={{ year: String(next.year), month: next.monthSlug, day: String(next.day) }}
                className="text-primary underline-offset-2 hover:underline"
              >
                {next.name} · {longDate(next)} →
              </Link>
            )}
          </div>
        </section>

        <FaqSection items={faqsFor(stub)} />

        <p className="px-1 text-xs text-muted-foreground">
          See all{" "}
          <Link
            to="/vrats/ekadashi/$year/$month"
            params={{ year: String(stub.year), month: stub.monthSlug }}
            className="text-primary underline-offset-2 hover:underline"
          >
            {monthName} {stub.year} Ekadashi dates
          </Link>{" "}
          or{" "}
          <Link
            to="/vrats/ekadashi/parana"
            className="text-primary underline-offset-2 hover:underline"
          >
            today's parana time
          </Link>
          .
        </p>
      </div>
    </main>
  );
}