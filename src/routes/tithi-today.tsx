import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { AppHeader } from "@/components/AppHeader";
import { FaqSection, type FaqItem } from "@/components/FaqSection";
import { computeDayPanchang } from "@/lib/panchang/core";
import { fastingStatus } from "@/lib/panchang/lang";
import { addDays, formatLongDate, formatTimeWithDay, toCalendarDay, tzAbbr } from "@/lib/panchang/tz";
import { usePrefs } from "@/lib/prefs";
import {
  SITE_URL,
  articleSchema,
  breadcrumbSchema,
  faqPageSchema,
  ldJson,
} from "@/lib/seo/schema";

const TITLE = "Tithi Today — Local Start & End Times | Panchanga";
const DESCRIPTION =
  "Which tithi is running today, when it started and when it ends — calculated from your own local sunrise instead of India time.";
const URL = `${SITE_URL}/tithi-today`;

const FAQS: FaqItem[] = [
  {
    q: "What is a tithi?",
    a: "A tithi is a lunar day: the time the moon takes to gain 12° of longitude on the sun. There are 30 tithis in a lunar month, 15 in the waxing Shukla paksha and 15 in the waning Krishna paksha. A tithi can run from about 19 to 26 hours, so it rarely lines up with a calendar day.",
  },
  {
    q: "Which tithi is today?",
    a: "The tithi shown on this page is the one running at sunrise for the location you selected. That is the tithi used to name the day in the Hindu calendar, even if a new tithi begins later the same afternoon or night.",
  },
  {
    q: "Why is my tithi different from Indian calendars?",
    a: "Tithi is read at local sunrise. If you live in the US, UK, Canada or Australia, your sunrise happens many hours after sunrise in India, so the tithi at that moment can be a different one. Panchanga computes it for your coordinates, which is why festival and fasting dates may fall a day apart from an India-printed almanac.",
  },
  {
    q: "How do I know if today is a fasting day?",
    a: "Ekadashi, Chaturthi, Trayodashi (Pradosh), Purnima, Amavasya and Ashtami are the commonly observed vrat tithis. When today's tithi is one of them, this page shows the fast name and simple guidance for breaking it.",
  },
  {
    q: "What is paksha?",
    a: "Paksha is the lunar fortnight. Shukla paksha is the bright half from new moon to full moon, and Krishna paksha is the dark half from full moon to new moon. The same tithi name occurs once in each paksha.",
  },
];

export const Route = createFileRoute("/tithi-today")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: URL },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      ldJson([
        articleSchema({
          headline: "Tithi today — start and end times for your location",
          description: DESCRIPTION,
          url: URL,
        }),
        breadcrumbSchema([
          { name: "Home", url: `${SITE_URL}/` },
          { name: "Tithi today", url: URL },
        ]),
        faqPageSchema(FAQS),
      ]),
    ],
  }),
  component: TithiTodayPage,
});

function TithiTodayPage() {
  const { city, prefs, hydrated } = usePrefs();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const date = useMemo(() => toCalendarDay(now, city.tz), [now, city.tz]);
  const panchang = useMemo(
    () => (hydrated ? computeDayPanchang(date, city) : null),
    [hydrated, date.year, date.month, date.day, city],
  );
  const tomorrow = useMemo(
    () => (hydrated ? computeDayPanchang(addDays(date, 1), city) : null),
    [hydrated, date.year, date.month, date.day, city],
  );
  const zone = tzAbbr(now, city.tz);
  const t = (d: Date | null) => formatTimeWithDay(d, city.tz, prefs.hour12, date);
  const fast = panchang ? fastingStatus(panchang.tithi.name, panchang.tithi.paksha) : null;

  return (
    <main className="mx-auto max-w-md">
      <AppHeader
        title="Tithi today"
        headingSuffix="— lunar day start and end times for your location"
        subtitle={formatLongDate(date)}
        showLocation
      />

      <div className="space-y-4 px-5 py-5">
        {!panchang ? (
          <section className="panel px-5 py-5 text-sm text-muted-foreground">Calculating…</section>
        ) : (
          <>
            <section className="panel px-5 py-5">
              <p className="label-caps">Running at sunrise in {city.name}</p>
              <p className="mt-1 font-display text-2xl leading-tight">
                {panchang.tithi.paksha} {panchang.tithi.name}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Ends <span className="tabular-nums text-foreground">{t(panchang.tithi.end)}</span>
                {zone ? ` ${zone}` : ""}, then {panchang.nextTithi.paksha}{" "}
                {panchang.nextTithi.name} begins.
              </p>
              {fast && (
                <p className="mt-3 rounded-lg border border-gold/40 bg-gold/10 px-3 py-2 text-xs leading-relaxed">
                  <span className="font-semibold">{fast.label}</span> — {fast.detail}
                </p>
              )}
            </section>

            <section className="panel px-5 py-5">
              <h2 className="text-sm font-semibold text-foreground">Today's reference times</h2>
              <dl className="mt-3 space-y-2 text-xs">
                <Row label="Sunrise" value={t(panchang.sunrise)} />
                <Row label="Sunset" value={t(panchang.sunset)} />
                <Row label="Nakshatra" value={`${panchang.nakshatra.name} until ${t(panchang.nakshatra.end)}`} />
                <Row label="Vaara" value={panchang.vaara} />
                {tomorrow && (
                  <Row
                    label="Tomorrow's tithi"
                    value={`${tomorrow.tithi.paksha} ${tomorrow.tithi.name}`}
                  />
                )}
              </dl>
            </section>

            <section className="panel px-5 py-5">
              <h2 className="text-sm font-semibold text-foreground">
                How the tithi for the day is decided
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                The tithi in progress at local sunrise names the day. Because a tithi averages about
                23 hours 37 minutes, it drifts against the 24-hour clock: some tithis are skipped
                (kshaya) and some repeat over two sunrises (adhika). Panchanga reads the true
                positions of the sun and moon (drik ganita) with the Lahiri ayanamsa at the exact
                moment of sunrise for the coordinates you picked.
              </p>
            </section>

            <FaqSection items={FAQS} />

            <p className="px-1 text-xs text-muted-foreground">
              See also{" "}
              <Link to="/" search={{ d: undefined }} className="text-primary underline-offset-2 hover:underline">
                today's full panchang
              </Link>{" "}
              and{" "}
              <Link to="/muhurat/choghadiya" className="text-primary underline-offset-2 hover:underline">
                today's auspicious times
              </Link>
              .
            </p>
          </>
        )}
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
