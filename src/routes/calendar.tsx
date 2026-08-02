import { Link, createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { FestivalDay } from "@/lib/panchang/festivals";

import { AppHeader } from "@/components/AppHeader";
import { SignInGate } from "@/components/SignInGate";
import { scanFestivals } from "@/lib/panchang/festivals";
import { MASA_NAMES } from "@/lib/panchang/names";
import { dayKey, formatLongDate, toCalendarDay, weekdayIndex, type CalendarDay } from "@/lib/panchang/tz";
import { usePrefs } from "@/lib/prefs";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Hindu Calendar — Tithi & Festival Dates in the US" },
      {
        name: "description",
        content:
          "Month view of tithis, ekadashis and Hindu festival dates resolved to your US timezone.",
      },
      { property: "og:title", content: "Hindu Calendar — Tithi & Festival Dates in the US" },
      {
        property: "og:description",
        content: "Browse tithis and festivals month by month, calculated for your US city.",
      },
    ],
    links: [{ rel: "canonical", href: "https://indianpanchang.com/calendar" }],
  }),
  component: CalendarPage,
});

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function CalendarPage() {
  const { city, prefs, hydrated } = usePrefs();
  const [now] = useState(() => new Date());
  const today = useMemo(() => toCalendarDay(now, city.tz), [now, city.tz]);
  const [cursor, setCursor] = useState({ year: today.year, month: today.month });
  const [selected, setSelected] = useState<string | null>(null);

  const daysInMonth = new Date(Date.UTC(cursor.year, cursor.month, 0)).getUTCDate();
  const first: CalendarDay = { year: cursor.year, month: cursor.month, day: 1 };
  const leading = weekdayIndex(first);

  // Compute the month after the first paint so switching tabs feels instant.
  const [scan, setScan] = useState<FestivalDay[]>([]);
  useEffect(() => {
    if (!hydrated) return;
    setScan([]);
    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      setScan(scanFestivals(first, daysInMonth, city));
    };
    const idle = (
      window as unknown as { requestIdleCallback?: (cb: () => void) => number }
    ).requestIdleCallback;
    const handle = idle ? idle(run) : window.setTimeout(run, 0);
    return () => {
      cancelled = true;
      const cancelIdle = (
        window as unknown as { cancelIdleCallback?: (id: number) => void }
      ).cancelIdleCallback;
      if (idle && cancelIdle) cancelIdle(handle as number);
      else window.clearTimeout(handle as number);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, cursor.year, cursor.month, daysInMonth, city]);

  const shift = (delta: number) => {
    const m = cursor.month - 1 + delta;
    setCursor({ year: cursor.year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 + 1 });
    setSelected(null);
  };

  const monthLabel = new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(cursor.year, cursor.month - 1, 1)));

  const selectedEntry = scan.find((e) => dayKey(e.date) === selected) ?? null;
  const masaSpan = useMemo(() => {
    if (scan.length === 0) return "";
    const names = new Set(
      scan.map((e) =>
        MASA_NAMES[prefs.tradition === "amanta" ? e.summary.amantaIndex : e.summary.purnimantaIndex],
      ),
    );
    return Array.from(names).join(" – ");
  }, [scan, prefs.tradition]);

  return (
    <main className="mx-auto max-w-md">
      <AppHeader
        title="Hindu Calendar"
        headingSuffix="of Hindu festivals and tithis"
        subtitle={masaSpan || "Loading months…"}
      />

      <div className="flex items-center justify-between px-5 py-4">
        <button onClick={() => shift(-1)} aria-label="Previous month" className="rounded-full border border-border p-2 hover:bg-secondary">
          <ChevronLeft className="size-4" />
        </button>
        <p className="font-display text-lg">{monthLabel}</p>
        <button onClick={() => shift(1)} aria-label="Next month" className="rounded-full border border-border p-2 hover:bg-secondary">
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="px-4">
        <div className="grid grid-cols-7 gap-1 pb-2">
          {WEEKDAYS.map((w, i) => (
            <div key={i} className="label-caps text-center">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: leading }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {scan.length === 0 &&
            Array.from({ length: daysInMonth }).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="flex aspect-square flex-col items-center justify-center rounded-lg border border-transparent text-sm text-muted-foreground"
              >
                <span className="tabular-nums leading-none">{i + 1}</span>
              </div>
            ))}
          {scan.map((entry) => {
            const key = dayKey(entry.date);
            const isToday = key === dayKey(today);
            const isSelected = key === selected;
            const major = entry.festivals.some((f) => f.category === "major");
            const minor = entry.festivals.length > 0 && !major;
            return (
              <button
                key={key}
                onClick={() => setSelected(isSelected ? null : key)}
                aria-pressed={isSelected}
                aria-label={`${formatLongDate(entry.date)} — ${entry.summary.paksha} paksha tithi ${entry.summary.tithiNumber > 15 ? entry.summary.tithiNumber - 15 : entry.summary.tithiNumber}${entry.festivals.length > 0 ? `, ${entry.festivals.map((f) => f.name).join(", ")}` : ""}`}
                className={`flex aspect-square flex-col items-center justify-center rounded-lg border text-sm transition-colors ${
                  isSelected
                    ? "border-primary bg-primary/15"
                    : isToday
                      ? "border-gold/60 bg-secondary"
                      : "border-transparent hover:bg-secondary"
                }`}
              >
                <span className="tabular-nums leading-none">{entry.date.day}</span>
                <span className="mt-0.5 text-[0.6rem] leading-none text-muted-foreground tabular-nums">
                  {entry.summary.paksha === "Shukla" ? "S" : "K"}
                  {entry.summary.tithiNumber > 15
                    ? entry.summary.tithiNumber - 15
                    : entry.summary.tithiNumber}
                </span>
                <span className="mt-1 flex h-1.5 items-center gap-0.5">
                  {major && <span className="size-1.5 rounded-full bg-primary" />}
                  {minor && <span className="size-1 rounded-full bg-gold/70" />}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-4 px-5 py-6">
        {selectedEntry ? (
          <section className="panel px-5 py-4">
            <p className="font-display text-lg">{formatLongDate(selectedEntry.date)}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {selectedEntry.summary.paksha} {selectedEntry.summary.tithiName} ·{" "}
              {selectedEntry.summary.nakshatra} ·{" "}
              {MASA_NAMES[
                prefs.tradition === "amanta"
                  ? selectedEntry.summary.amantaIndex
                  : selectedEntry.summary.purnimantaIndex
              ]}
            </p>
            {selectedEntry.festivals.length > 0 && (
              <ul className="mt-3 space-y-1.5 text-sm">
                {selectedEntry.festivals.map((f) => (
                  <li key={f.id} className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-gold" />
                    {f.name}
                  </li>
                ))}
              </ul>
            )}
            <Link
              to="/"
              search={{ d: dayKey(selectedEntry.date) }}
              className="mt-4 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Open full panchang
            </Link>
          </section>
        ) : (
          <p className="text-center text-xs text-muted-foreground">
            Tap any date for its tithi, nakshatra and observances.
          </p>
        )}

        <SignInGate
          next="/calendar"
          title="Sign in to see this month's festivals"
          description="The full list of major festivals for the month is available once you sign in."
        >
          <section>
            <h2 className="label-caps px-1">Festivals this month</h2>
            <ul className="mt-3 space-y-2">
            {scan
              .filter((e) => e.festivals.some((f) => f.category === "major"))
              .map((e) => (
                <li key={dayKey(e.date)} className="panel flex items-center gap-3 px-4 py-3">
                  <span className="w-9 shrink-0 text-center">
                    <span className="block font-display text-lg leading-none">{e.date.day}</span>
                    <span className="block text-[0.6rem] text-muted-foreground">
                      {WEEKDAYS[weekdayIndex(e.date)]}
                    </span>
                  </span>
                  <span className="min-w-0">
                    {e.festivals
                      .filter((f) => f.category === "major")
                      .map((f) => (
                        <span key={f.id} className="block">
                          <span className="block text-sm">{f.name}</span>
                          <span className="block text-xs text-muted-foreground">{f.note}</span>
                        </span>
                      ))}
                  </span>
                </li>
              ))}
              {hydrated && scan.every((e) => !e.festivals.some((f) => f.category === "major")) && (
                <li className="text-center text-sm text-muted-foreground">
                  No major festivals this month.
                </li>
              )}
            </ul>
          </section>
        </SignInGate>
      </div>
    </main>
  );
}