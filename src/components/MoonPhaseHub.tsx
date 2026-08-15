import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { AppHeader } from "@/components/AppHeader";
import { FaqSection, type FaqItem } from "@/components/FaqSection";
import { PHASE_LABEL, type MoonPhaseKind } from "@/lib/panchang/moon-phase";
import {
  REFERENCE_CITY,
  moonPhaseSnapshot,
  referenceMoonPhaseSnapshot,
} from "@/lib/panchang/moon-phase-snapshot";
import { dayKey, formatLongDate, formatTime, toCalendarDay, tzAbbr } from "@/lib/panchang/tz";
import { usePrefs } from "@/lib/prefs";

/**
 * Shared body for /vrats/amavasya and /vrats/purnima. Server-renders real dates
 * and times for the reference US city, then recomputes for the visitor's city.
 */
export function MoonPhaseHub({ kind, faqs }: { kind: MoonPhaseKind; faqs: FaqItem[] }) {
  const label = PHASE_LABEL[kind];
  const { city, prefs, hydrated } = usePrefs();
  const now = useMemo(() => new Date(), []);
  const [snapshot, setSnapshot] = useState(() => referenceMoonPhaseSnapshot(kind));

  useEffect(() => {
    if (!hydrated) return;
    const id = window.setTimeout(
      () => setSnapshot(moonPhaseSnapshot(city, toCalendarDay(new Date(), city.tz), kind)),
      0,
    );
    return () => window.clearTimeout(id);
  }, [hydrated, city, kind]);

  const view = snapshot.city;
  const isReference = view.id === REFERENCE_CITY.id;
  const zone = tzAbbr(now, view.tz);
  const t = (d: Date | null) => formatTime(d, view.tz, prefs.hour12);
  const todayKey = dayKey(snapshot.today);
  const todayEntry = snapshot.entries.find((e) => dayKey(e.date) === todayKey) ?? null;
  const upcoming = snapshot.entries.filter((e) => dayKey(e.date) >= todayKey);
  const next = upcoming[0] ?? null;

  return (
    <main className="mx-auto max-w-md">
      <AppHeader
        title={label}
        headingSuffix={`— is it ${label} today, and when is the next one`}
        subtitle={`${view.name}, ${view.state}${zone ? ` · ${zone}` : ""}`}
        showLocation
      />

      <div className="space-y-4 px-5 py-5">
        {isReference && (
          <p className="px-1 text-xs text-muted-foreground">
            Showing times for {view.name}, {view.state} ({zone || view.tz}). Tap the location pin to
            recalculate every date for your own city.
          </p>
        )}

        <section className="panel px-5 py-5">
          <h2 className="text-sm font-semibold text-foreground">
            Is it {label} today — {formatLongDate(snapshot.today)}?
          </h2>
          {todayEntry ? (
            <>
              <p className="mt-2 text-2xl text-foreground">Yes — {todayEntry.name}</p>
              <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                {label} tithi runs {t(todayEntry.start)} to {t(todayEntry.end)} in {view.name}.
              </p>
            </>
          ) : next ? (
            <>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                No. The next {label} in {view.name} is {next.name} on {formatLongDate(next.date)}.
              </p>
              <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                Tithi {t(next.start)} to {t(next.end)}.
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">No dates available.</p>
          )}
        </section>

        {next && (
          <section className="panel px-5 py-5">
            <h2 className="text-sm font-semibold text-foreground">Next {label}</h2>
            <p className="mt-1 text-lg font-semibold text-foreground">{next.name}</p>
            <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
              {formatLongDate(next.date)} · sunrise {t(next.sunrise)}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              The tithi begins {t(next.start)} and ends {t(next.end)} in {view.name}
              {zone ? ` (${zone})` : ""}. Observances follow the tithi running at your own sunrise,
              so the date can differ from an India-printed panchang.
            </p>
          </section>
        )}

        {upcoming.length > 1 && (
          <section className="panel px-5 py-5">
            <h2 className="text-sm font-semibold text-foreground">Upcoming {label} dates</h2>
            <ul className="mt-3 space-y-2.5">
              {upcoming.slice(0, 5).map((e) => (
                <li key={dayKey(e.date)} className="rounded-xl border border-border px-3 py-2.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-sm font-medium text-foreground">{e.name}</p>
                    <p className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {formatLongDate(e.date)}
                    </p>
                  </div>
                  <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                    Tithi {t(e.start)} – {t(e.end)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <FaqSection items={faqs} />

        <p className="px-1 text-xs text-muted-foreground">
          Also see{" "}
          {kind === "amavasya" ? (
            <Link to="/vrats/purnima" className="text-primary underline-offset-2 hover:underline">
              Purnima dates
            </Link>
          ) : (
            <Link to="/vrats/amavasya" className="text-primary underline-offset-2 hover:underline">
              Amavasya dates
            </Link>
          )}
          ,{" "}
          <Link
            to="/vrats/amavasya/$year/$month"
            params={{ year: String(snapshot.today.year), month: MONTH_SLUGS[snapshot.today.month - 1] }}
            className="text-primary underline-offset-2 hover:underline"
          >
            this month's Amavasya
          </Link>{" "}
          or{" "}
          <Link
            to="/vrats/ekadashi/parana"
            className="text-primary underline-offset-2 hover:underline"
          >
            today's Ekadashi parana time
          </Link>
          .
        </p>
      </div>
    </main>
  );
}

const MONTH_SLUGS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];
