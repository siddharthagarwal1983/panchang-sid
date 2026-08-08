import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { AppHeader } from "@/components/AppHeader";
import { FaqSection, type FaqItem } from "@/components/FaqSection";
import { scanEkadashi, type EkadashiEntry } from "@/lib/panchang/ekadashi";
import { addDays, dayKey, formatLongDate, formatTime, toCalendarDay, tzAbbr } from "@/lib/panchang/tz";
import { usePrefs } from "@/lib/prefs";
import {
  SITE_URL,
  articleSchema,
  breadcrumbSchema,
  definedTermSchema,
  faqPageSchema,
  ldJson,
} from "@/lib/seo/schema";

const TITLE = "Ekadashi Parana Time Today & Tomorrow | Panchanga";
const DESCRIPTION =
  "Today's and tomorrow's Ekadashi parana time for your city, plus which Ekadashi is today or tomorrow and when the Dwadashi parana window opens and closes.";
const URL = `${SITE_URL}/vrats/ekadashi/parana`;

const FAQS: FaqItem[] = [
  {
    q: "What is the Ekadashi parana time today?",
    a: "Parana is taken the morning after the fast, after sunrise, during Dwadashi and after Hari Vasara (the first quarter of Dwadashi) has ended. The card above shows today's window in your own clock time; if no fast ended today it tells you the next date a parana window falls.",
  },
  {
    q: "What is the Ekadashi parana time tomorrow?",
    a: "If you are fasting today, tomorrow's window is shown above with its start and end time for your city. Break the fast inside that window — after it closes the parana is considered late.",
  },
  {
    q: "What is Dwadashi parana time?",
    a: "Dwadashi parana time is the same window: the Ekadashi fast must be broken on Dwadashi tithi. If Dwadashi ends early in the morning, parana has to be completed before it ends, which is why the window can be very short on some days.",
  },
  {
    q: "Which Ekadashi is today or tomorrow?",
    a: "Each of the 24 yearly Ekadashis has its own name, decided by the lunar month and paksha. The page names the current or next one for your location, because the fasting day is set by the tithi running at your local sunrise, not by India time.",
  },
  {
    q: "When is the next Ekadashi?",
    a: "Ekadashi falls twice each lunar month, roughly every 14 to 15 days. The countdown above shows the next fasting date computed for your city's sunrise.",
  },
];

export const Route = createFileRoute("/vrats/ekadashi/parana")({
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
          headline: "Ekadashi parana time today and tomorrow",
          description: DESCRIPTION,
          url: URL,
        }),
        breadcrumbSchema([
          { name: "Home", url: `${SITE_URL}/` },
          { name: "Ekadashi", url: `${SITE_URL}/vrats/ekadashi` },
          { name: "Parana time today and tomorrow", url: URL },
        ]),
        faqPageSchema(FAQS),
        definedTermSchema({
          name: "Parana",
          alternateName: ["Ekadashi parana", "Dwadashi parana"],
          description:
            "The meal that ends an Ekadashi fast, taken after sunrise on Dwadashi once Hari Vasara has passed and before Dwadashi tithi ends.",
          url: URL,
        }),
      ]),
    ],
  }),
  component: ParanaPage,
});

function ParanaPage() {
  const { city, prefs, hydrated } = usePrefs();
  const now = useMemo(() => new Date(), []);
  const today = useMemo(() => toCalendarDay(now, city.tz), [now, city.tz]);
  const [entries, setEntries] = useState<EkadashiEntry[] | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    setEntries(null);
    const id = window.setTimeout(
      () => setEntries(scanEkadashi(addDays(today, -3), 50, city)),
      0,
    );
    return () => window.clearTimeout(id);
  }, [hydrated, today.year, today.month, today.day, city]);

  const zone = tzAbbr(now, city.tz);
  const t = (d: Date | null) => formatTime(d, city.tz, prefs.hour12);
  const todayKey = dayKey(today);
  const tomorrow = addDays(today, 1);
  const tomorrowKey = dayKey(tomorrow);

  const fastToday = entries?.find((e) => dayKey(e.date) === todayKey) ?? null;
  const fastTomorrow = entries?.find((e) => dayKey(e.date) === tomorrowKey) ?? null;
  const paranaToday = entries?.find((e) => dayKey(e.parana.date) === todayKey) ?? null;
  const paranaTomorrow = entries?.find((e) => dayKey(e.parana.date) === tomorrowKey) ?? null;
  const upcoming = entries?.filter((e) => dayKey(e.date) >= todayKey).slice(0, 3) ?? [];
  const next = upcoming[0] ?? null;

  return (
    <main className="mx-auto max-w-md">
      <AppHeader
        title="Ekadashi parana"
        headingSuffix="— parana time today and tomorrow"
        subtitle={`${city.name}, ${city.state}${zone ? ` · ${zone}` : ""}`}
        showLocation
      />

      <div className="space-y-4 px-5 py-5">
        {!entries ? (
          <section className="panel px-5 py-5 text-sm text-muted-foreground">
            Calculating parana windows for {city.name}…
          </section>
        ) : (
          <>
            <section className="panel px-5 py-5">
              <h2 className="text-sm font-semibold text-foreground">
                Parana time today — {formatLongDate(today)}
              </h2>
              {paranaToday ? (
                <>
                  <p className="mt-2 text-2xl tabular-nums text-foreground">
                    {t(paranaToday.parana.start)} – {t(paranaToday.parana.end)}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Breaking the {paranaToday.name} fast kept on{" "}
                    {formatLongDate(paranaToday.date)}. {paranaToday.parana.note}
                  </p>
                </>
              ) : fastToday ? (
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Today is <strong className="text-foreground">{fastToday.name}</strong> — the fast
                  day itself, so there is no parana today. Ekadashi tithi ends at{" "}
                  {t(fastToday.tithiEnd)} and parana is tomorrow between{" "}
                  <strong className="text-foreground">
                    {t(fastToday.parana.start)} – {t(fastToday.parana.end)}
                  </strong>
                  .
                </p>
              ) : (
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  No fast ends today. The next parana falls on{" "}
                  {next ? formatLongDate(next.parana.date) : "the next Dwadashi"}, after{" "}
                  {next ? next.name : "the next Ekadashi"}.
                </p>
              )}
            </section>

            <section className="panel px-5 py-5">
              <h2 className="text-sm font-semibold text-foreground">
                Parana time tomorrow — {formatLongDate(tomorrow)}
              </h2>
              {paranaTomorrow ? (
                <>
                  <p className="mt-2 text-2xl tabular-nums text-foreground">
                    {t(paranaTomorrow.parana.start)} – {t(paranaTomorrow.parana.end)}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Ends the {paranaTomorrow.name} fast. {paranaTomorrow.parana.note}
                  </p>
                </>
              ) : fastTomorrow ? (
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Tomorrow is <strong className="text-foreground">{fastTomorrow.name}</strong>, the
                  fasting day. Its parana window is{" "}
                  {formatLongDate(fastTomorrow.parana.date)},{" "}
                  {t(fastTomorrow.parana.start)} – {t(fastTomorrow.parana.end)}.
                </p>
              ) : (
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  No parana window tomorrow — no Ekadashi fast ends on {formatLongDate(tomorrow)}.
                </p>
              )}
            </section>

            <section className="panel px-5 py-5">
              <h2 className="text-sm font-semibold text-foreground">
                Which Ekadashi is next?
              </h2>
              {next ? (
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  The next fast is <strong className="text-foreground">{next.name}</strong> on{" "}
                  <strong className="text-foreground">{formatLongDate(next.date)}</strong> (
                  {next.masa} · {next.paksha} paksha), with parana on{" "}
                  {formatLongDate(next.parana.date)} between {t(next.parana.start)} and{" "}
                  {t(next.parana.end)}.
                </p>
              ) : null}
              <ul className="mt-3 space-y-3">
                {upcoming.map((e) => (
                  <li key={dayKey(e.date)} className="rounded-xl border border-border px-3 py-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-sm font-medium text-foreground">{e.name}</p>
                      <p className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {formatLongDate(e.date)}
                      </p>
                    </div>
                    <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                      Parana {formatLongDate(e.parana.date)} · {t(e.parana.start)} –{" "}
                      {t(e.parana.end)}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}

        <section className="panel px-5 py-5">
          <h2 className="text-sm font-semibold text-foreground">How the parana window is fixed</h2>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Parana must fall on Dwadashi, after your local sunrise and after Hari Vasara — the first
            quarter of Dwadashi. The preferred slot is the first fifth of the day. If Dwadashi ends
            before that, the fast must be broken before Dwadashi ends; if Dwadashi has already ended
            at sunrise, break it soon after sunrise. All times use true sun and moon positions with
            the Lahiri ayanamsa at your own coordinates, so they differ from an India-printed
            panchang.
          </p>
        </section>

        <FaqSection items={FAQS} />

        <p className="px-1 text-xs text-muted-foreground">
          See the full{" "}
          <Link to="/vrats/ekadashi" className="text-primary underline-offset-2 hover:underline">
            Ekadashi calendar
          </Link>{" "}
          or{" "}
          <Link to="/tithi-today" className="text-primary underline-offset-2 hover:underline">
            today's tithi
          </Link>
          .
        </p>
      </div>
    </main>
  );
}