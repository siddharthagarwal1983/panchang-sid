import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { AppHeader } from "@/components/AppHeader";
import { FaqSection } from "@/components/FaqSection";
import { SignInGate } from "@/components/SignInGate";
import { useAuth } from "@/lib/auth";
import {
  paranaSnapshot,
  referenceParanaSnapshot,
  REFERENCE_CITY,
} from "@/lib/panchang/parana-snapshot";
import {
  dayKey,
  formatLongDate,
  formatTime,
  toCalendarDay,
  tzAbbr,
  type CalendarDay,
} from "@/lib/panchang/tz";
import { usePrefs } from "@/lib/prefs";
import { findEkadashiDate } from "@/lib/seo/ekadashi-dates";
import { MONTHS } from "@/lib/seo/ekadashi-pages";
import { PARANA_FAQS, PARANA_URL } from "@/lib/seo/parana-meta";
import { eventSchema } from "@/lib/seo/schema";

/** Dated-page stub for an entry's local fast day, when one exists (2026–2027). */
function stubFor(date: CalendarDay) {
  const slug = MONTHS.find((m) => m.number === date.month)?.slug;
  return slug ? findEkadashiDate(date.year, slug, date.day) : undefined;
}

/**
 * Shared body of /vrats/ekadashi/parana, /parana-time-today and
 * /parana-time-tomorrow. The time cards render only for signed-in users;
 * crawlers still get the answer-first title/description and FAQ from head().
 */
export function ParanaPage() {
  const { city, prefs, hydrated } = usePrefs();
  const { user } = useAuth();
  const now = useMemo(() => new Date(), []);
  // Rendered on the server with a reference city so the page ships real dates and
  // times in its HTML, then swapped for the visitor's own location after hydration.
  const [snapshot, setSnapshot] = useState(() => referenceParanaSnapshot());

  useEffect(() => {
    if (!hydrated) return;
    const id = window.setTimeout(
      () => setSnapshot(paranaSnapshot(city, toCalendarDay(new Date(), city.tz))),
      0,
    );
    return () => window.clearTimeout(id);
  }, [hydrated, city]);

  const entries = snapshot.entries;
  const view = snapshot.city;
  const isReference = view.id === REFERENCE_CITY.id;
  const today = snapshot.today;
  const zone = tzAbbr(now, view.tz);
  const t = (d: Date | null) => formatTime(d, view.tz, prefs.hour12);
  const todayKey = dayKey(today);
  const tomorrow = snapshot.tomorrow;
  const tomorrowKey = dayKey(tomorrow);

  const fastToday = entries.find((e) => dayKey(e.date) === todayKey) ?? null;
  const fastTomorrow = entries.find((e) => dayKey(e.date) === tomorrowKey) ?? null;
  const paranaToday = entries.find((e) => dayKey(e.parana.date) === todayKey) ?? null;
  const paranaTomorrow = entries.find((e) => dayKey(e.parana.date) === tomorrowKey) ?? null;
  const upcoming = entries.filter((e) => dayKey(e.date) >= todayKey).slice(0, 3);
  const next = upcoming[0] ?? null;

  // Location-aware JSON-LD: once signed in, inject an Event node whose window
  // and place reflect the visitor's selected city (not the reference city).
  const ldEntry = paranaToday ?? paranaTomorrow ?? next;
  useEffect(() => {
    if (!user || !ldEntry?.parana.start) return;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.dataset.paranaLocation = "true";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      ...eventSchema({
        name: `${ldEntry.name} parana — ${view.name}`,
        description: `Ekadashi parana (fast-breaking) window for ${view.name}, ${view.state} on ${formatLongDate(
          ldEntry.parana.date,
        )}: ${t(ldEntry.parana.start)} – ${t(ldEntry.parana.end)} local time, after ${ldEntry.name}.`,
        startDate: ldEntry.parana.start.toISOString(),
        endDate: ldEntry.parana.end ? ldEntry.parana.end.toISOString() : undefined,
        url: PARANA_URL,
        locationName: `${view.name}, ${view.state}`,
        address: { addressLocality: view.name, addressRegion: view.state, addressCountry: "US" },
      }),
    });
    document.head.appendChild(script);
    return () => {
      script.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, ldEntry, view.id, prefs.hour12]);

  return (
    <main className="mx-auto max-w-md">
      <AppHeader
        title="Ekadashi parana"
        headingSuffix="— parana time today and tomorrow"
        subtitle={`${city.name}, ${city.state}${zone ? ` · ${zone}` : ""}`}
        showLocation
      />

      <div className="space-y-4 px-5 py-5">
        {isReference && (
          <p className="px-1 text-xs text-muted-foreground">
            Showing times for {view.name}, {view.state} ({zone || view.tz}). Tap the location pin to
            recalculate every window for your own city.
          </p>
        )}

        <SignInGate
          title="Sign in to check parana time"
          description="Parana windows are computed from your own city's sunrise, not India time. Sign in to see today's and tomorrow's exact parana time for where you live."
          ctaLabel="Sign-in to check parana time"
        >
          <div className="space-y-4">
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
                  The next fast is{" "}
                  <strong className="text-foreground">
                    {(() => {
                      const stub = stubFor(next.date);
                      return stub ? (
                        <Link
                          to="/vrats/ekadashi/$year/$month/$day"
                          params={{
                            year: String(stub.year),
                            month: stub.monthSlug,
                            day: String(stub.day),
                          }}
                          className="text-primary underline-offset-2 hover:underline"
                        >
                          {next.name}
                        </Link>
                      ) : (
                        next.name
                      );
                    })()}
                  </strong>{" "}
                  on{" "}
                  <strong className="text-foreground">{formatLongDate(next.date)}</strong> (
                  {next.masa} · {next.paksha} paksha), with parana on{" "}
                  {formatLongDate(next.parana.date)} between {t(next.parana.start)} and{" "}
                  {t(next.parana.end)}.
                </p>
              ) : null}
              <ul className="mt-3 space-y-3">
                {upcoming.map((e) => {
                  const stub = stubFor(e.date);
                  return (
                    <li key={dayKey(e.date)} className="rounded-xl border border-border px-3 py-3">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="text-sm font-medium text-foreground">
                          {stub ? (
                            <Link
                              to="/vrats/ekadashi/$year/$month/$day"
                              params={{
                                year: String(stub.year),
                                month: stub.monthSlug,
                                day: String(stub.day),
                              }}
                              className="text-primary underline-offset-2 hover:underline"
                            >
                              {e.name}
                            </Link>
                          ) : (
                            e.name
                          )}
                        </p>
                        <p className="shrink-0 text-xs tabular-nums text-muted-foreground">
                          {formatLongDate(e.date)}
                        </p>
                      </div>
                      <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                        Parana {formatLongDate(e.parana.date)} · {t(e.parana.start)} –{" "}
                        {t(e.parana.end)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>
        </SignInGate>

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

        <section className="panel px-5 py-5">
          <h2 className="text-sm font-semibold text-foreground">Parana rules at a glance</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-muted-foreground">
            <li>
              Never break the fast during Hari Vasara — the first quarter of Dwadashi — even when
              that pushes parana late into the morning.
            </li>
            <li>
              Parana must happen on Dwadashi tithi; if Dwadashi ends early, break the fast before it
              ends rather than waiting for a clock time.
            </li>
            <li>
              When two consecutive sunrises fall inside Ekadashi (vriddhi), Smartas keep the first
              day and Vaishnavas keep the second.
            </li>
            <li>
              Breaking the fast after Dwadashi has ended counts as a missed parana, so the window
              above is the deadline, not a suggestion.
            </li>
          </ul>
        </section>

        <FaqSection items={PARANA_FAQS} />

        <p className="px-1 text-xs text-muted-foreground">
          See the full{" "}
          <Link to="/vrats/ekadashi" className="text-primary underline-offset-2 hover:underline">
            Ekadashi calendar
          </Link>
          ,{" "}
          <Link
            to="/vrats/ekadashi/$year"
            params={{ year: "2026" }}
            className="text-primary underline-offset-2 hover:underline"
          >
            Ekadashi 2026 dates
          </Link>
          , or{" "}
          <Link to="/tithi-today" className="text-primary underline-offset-2 hover:underline">
            today's tithi
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
