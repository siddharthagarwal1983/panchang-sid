import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { AppHeader } from "@/components/AppHeader";
import { FaqSection, type FaqItem } from "@/components/FaqSection";
import {
  CHOGHADIYA_META,
  computeChoghadiya,
  type ChoghadiyaQuality,
  type ChoghadiyaSlot,
} from "@/lib/panchang/choghadiya";
import { addDays, formatLongDate, formatTime, toCalendarDay, tzAbbr } from "@/lib/panchang/tz";
import { usePrefs } from "@/lib/prefs";
import {
  SITE_URL,
  articleSchema,
  breadcrumbSchema,
  faqPageSchema,
  ldJson,
} from "@/lib/seo/schema";

const TITLE = "Choghadiya Muhurat Today — Local Times | Panchanga";
const DESCRIPTION =
  "Today's Choghadiya muhurat — Amrit, Shubh, Labh, Chal, Rog, Kaal and Udveg windows calculated from your own local sunrise and sunset, not India time.";
const URL = "https://panchanga.lovable.app/muhurat/choghadiya";

const FAQS: FaqItem[] = [
  {
    q: "What is Choghadiya?",
    a: "Choghadiya divides the daytime (sunrise to sunset) and the night (sunset to next sunrise) into eight equal parts each. Every part is ruled by a planet and carries a quality — Amrit, Shubh, Labh, Chal, Udveg, Rog or Kaal — used to pick an auspicious time for daily work.",
  },
  {
    q: "Which Choghadiya is best?",
    a: "Amrit, Shubh and Labh are auspicious. Chal is neutral and fine for travel and routine work. Udveg, Rog and Kaal are avoided for new beginnings.",
  },
  {
    q: "What is the auspicious time today?",
    a: "The auspicious windows today are the Amrit, Shubh and Labh choghadiya listed above, plus Abhijit Muhurta around local solar noon. The page highlights the window happening right now so you can see at a glance whether the current time is favourable.",
  },
  {
    q: "Which times should I avoid today?",
    a: "Avoid Rog, Kaal and Udveg choghadiya for new beginnings, along with Rahu Kalam, Yamaganda and Gulika Kalam shown on the home screen. These are traditionally used for routine or maintenance work rather than launches, travel or signing agreements.",
  },
  {
    q: "Why do Choghadiya timings differ from Indian calendars?",
    a: "Choghadiya windows are derived from local sunrise and sunset. Outside India the sun rises at a different clock time, so the windows shift. Panchanga computes them for the coordinates you select.",
  },
];

export const Route = createFileRoute("/muhurat/choghadiya")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: URL },
      { property: "og:type", content: "article" },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      ldJson([
        articleSchema({
          headline: "Choghadiya Muhurat — day and night windows for your location",
          description: DESCRIPTION,
          url: URL,
        }),
        breadcrumbSchema([
          { name: "Home", url: `${SITE_URL}/` },
          { name: "Choghadiya Muhurat", url: URL },
        ]),
        faqPageSchema(FAQS),
      ]),
    ],
  }),
  component: ChoghadiyaPage,
});

const TONE: Record<ChoghadiyaQuality, string> = {
  auspicious: "border-emerald-500/40 bg-emerald-500/10",
  neutral: "border-border bg-secondary/40",
  inauspicious: "border-amber-500/40 bg-amber-500/10",
};

const TONE_LABEL: Record<ChoghadiyaQuality, string> = {
  auspicious: "Auspicious",
  neutral: "Neutral",
  inauspicious: "Avoid",
};

function ChoghadiyaPage() {
  const { city, prefs, hydrated } = usePrefs();
  const [now, setNow] = useState(() => new Date());
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const date = useMemo(() => addDays(toCalendarDay(now, city.tz), offset), [now, city.tz, offset]);
  const data = useMemo(() => computeChoghadiya(date, city), [date, city]);
  const zone = tzAbbr(now, city.tz);

  const renderRow = (slot: ChoghadiyaSlot) => {
    const live = offset === 0 && now >= slot.start && now < slot.end;
    return (
      <li
        key={`${slot.period}-${slot.index}`}
        className={`rounded-xl border px-3.5 py-3 ${TONE[slot.meta.quality]} ${live ? "ring-1 ring-primary" : ""}`}
      >
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm font-semibold text-foreground">
            {slot.meta.name}
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">
              {slot.meta.devanagari}
            </span>
          </span>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {formatTime(slot.start, city.tz, prefs.hour12)} –{" "}
            {formatTime(slot.end, city.tz, prefs.hour12)}
          </span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {TONE_LABEL[slot.meta.quality]} · ruled by {slot.meta.lord}
          {live ? " · happening now" : ""}
        </p>
      </li>
    );
  };

  return (
    <main className="mx-auto max-w-md">
      <AppHeader
        title="Choghadiya"
        headingSuffix="Muhurat — today's auspicious time windows"
        subtitle={formatLongDate(date)}
        showLocation
      />

      <div className="space-y-4 px-5 py-5">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setOffset((o) => o - 1)}
            className="rounded-lg border border-border px-3 py-1.5 text-xs transition-colors hover:bg-secondary"
          >
            ← Previous day
          </button>
          {offset !== 0 && (
            <button
              onClick={() => setOffset(0)}
              className="rounded-lg border border-border px-3 py-1.5 text-xs transition-colors hover:bg-secondary"
            >
              Today
            </button>
          )}
          <button
            onClick={() => setOffset((o) => o + 1)}
            className="rounded-lg border border-border px-3 py-1.5 text-xs transition-colors hover:bg-secondary"
          >
            Next day →
          </button>
        </div>

        <section className="panel px-5 py-4">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Calculated for {city.name} local sunrise{" "}
            <span className="tabular-nums text-foreground">
              {formatTime(data.sunrise, city.tz, prefs.hour12)}
            </span>{" "}
            and sunset{" "}
            <span className="tabular-nums text-foreground">
              {formatTime(data.sunset, city.tz, prefs.hour12)}
            </span>
            {zone ? ` (${zone})` : ""}.
          </p>
        </section>

        <section className="panel px-5 py-5">
          <h2 className="text-sm font-semibold text-foreground">Day Choghadiya</h2>
          <p className="mt-1 text-xs text-muted-foreground">Sunrise to sunset, eight equal parts.</p>
          <ul className="mt-3 space-y-2">
            {hydrated && data.day.length > 0 ? (
              data.day.map(renderRow)
            ) : (
              <li className="text-xs text-muted-foreground">Calculating…</li>
            )}
          </ul>
        </section>

        <section className="panel px-5 py-5">
          <h2 className="text-sm font-semibold text-foreground">Night Choghadiya</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Sunset to the next sunrise, eight equal parts.
          </p>
          <ul className="mt-3 space-y-2">
            {hydrated && data.night.length > 0 ? (
              data.night.map(renderRow)
            ) : (
              <li className="text-xs text-muted-foreground">Calculating…</li>
            )}
          </ul>
        </section>

        <section className="panel px-5 py-5">
          <h2 className="text-sm font-semibold text-foreground">
            What each Choghadiya means
          </h2>
          <dl className="mt-3 space-y-3">
            {Object.values(CHOGHADIYA_META).map((m) => (
              <div key={m.name}>
                <dt className="text-sm font-medium text-foreground">
                  {m.name} <span className="text-xs text-muted-foreground">{m.devanagari}</span>
                </dt>
                <dd className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {m.meaning} <span className="text-foreground">Good for:</span> {m.goodFor}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="panel px-5 py-5">
          <h2 className="text-sm font-semibold text-foreground">How Choghadiya is calculated</h2>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            The daytime from sunrise to sunset is divided into eight equal parts, and the night from
            sunset to the next sunrise into eight more. Each part runs roughly 90 minutes, but the
            exact length changes with the season and your latitude — summer day choghadiya are
            longer, winter ones shorter. The sequence of names starts at a different point for each
            weekday, so Monday's first day choghadiya is Amrit while Saturday's is Kaal.
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Because everything is anchored to local sunrise, these windows differ from an Indian
            almanac. That is the point: if you live in the US, UK, Canada or Australia, the auspicious
            time for your own day is the one computed for your coordinates.
          </p>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            See also{" "}
            <Link to="/" search={{ d: undefined }} className="text-primary underline-offset-2 hover:underline">
              today's panchang
            </Link>{" "}
            for tithi, nakshatra, Rahu Kalam and Abhijit Muhurta.
          </p>
        </section>

        <FaqSection items={FAQS} heading="Auspicious times FAQ" />

        <p className="px-1 text-xs text-muted-foreground">
          See also{" "}
          <Link to="/tithi-today" className="text-primary underline-offset-2 hover:underline">
            tithi today
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
