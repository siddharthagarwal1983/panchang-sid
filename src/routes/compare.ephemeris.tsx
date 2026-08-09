import { createFileRoute } from "@tanstack/react-router";
import { Observer, Body, SearchRiseSet } from "astronomy-engine";
import { useMemo, useState } from "react";

import { AppHeader } from "@/components/AppHeader";
import { compareEngines, formatLongitude } from "@/lib/panchang/compare";
import { formatLongDate, formatTimeWithDay, toCalendarDay, tzAbbr, zonedToUtc } from "@/lib/panchang/tz";
import { usePrefs } from "@/lib/prefs";
import { canonicalLink, canonicalOgUrl } from "@/lib/seo/canonical";

const TITLE = "Ephemeris Comparison — astronomy-engine vs Swiss Ephemeris | Panchanga";
const DESCRIPTION =
  "Compare the panchang produced by astronomy-engine with a Swiss Ephemeris-style Lahiri model for any date and your own location.";

export const Route = createFileRoute("/compare/ephemeris")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
      { name: "robots", content: "noindex" },
      canonicalOgUrl("/compare/ephemeris"),
    ],
    links: [canonicalLink("/compare/ephemeris")],
  }),
  component: ComparePage,
});

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function signedMin(v: number): string {
  if (Math.abs(v) < 0.05) return "±0 min";
  const sign = v > 0 ? "+" : "−";
  const abs = Math.abs(v);
  return abs < 1 ? `${sign}${Math.round(abs * 60)} sec` : `${sign}${abs.toFixed(1)} min`;
}

function signedArcsec(v: number): string {
  const sign = v >= 0 ? "+" : "−";
  return `${sign}${Math.abs(v).toFixed(2)}″`;
}

function ComparePage() {
  const { city, prefs } = usePrefs();
  const today = useMemo(() => toCalendarDay(new Date(), city.tz), [city.tz]);
  const [value, setValue] = useState(() => `${today.year}-${pad(today.month)}-${pad(today.day)}`);

  const day = useMemo(() => {
    const [y, m, d] = value.split("-").map(Number);
    if (!y || !m || !d) return today;
    return { year: y, month: m, day: d };
  }, [value, today]);

  const { reference, comparison, sunrise } = useMemo(() => {
    const midnight = zonedToUtc(day.year, day.month, day.day, 0, 0, city.tz);
    const observer = new Observer(city.lat, city.lon, 0);
    const rise = SearchRiseSet(Body.Sun, observer, +1, midnight, 2);
    const ref = rise ? rise.date : new Date(midnight.getTime() + 6 * 3600_000);
    return { reference: ref, comparison: compareEngines(ref), sunrise: rise?.date ?? null };
  }, [day, city]);

  const zone = tzAbbr(reference, city.tz);

  return (
    <main className="mx-auto max-w-md">
      <AppHeader
        title="Ephemeris check"
        headingSuffix="astronomy-engine vs Swiss Ephemeris"
        subtitle={formatLongDate(day)}
        showLocation
      />

      <div className="space-y-4 px-5 py-5">
        <section className="panel px-5 py-4">
          <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Date
          </label>
          <input
            type="date"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="mt-2 w-full rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm text-foreground"
            aria-label="Comparison date"
          />
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Read at local sunrise for {city.name} —{" "}
            {sunrise ? formatTimeWithDay(sunrise, city.tz, prefs.hour12, day) : "no sunrise"} {zone}.
          </p>
        </section>

        <section className="panel px-5 py-4">
          <h2 className="text-sm font-semibold text-foreground">Verdict</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {comparison.anyNameDiff
              ? "The two models land on different panchang elements at sunrise — a boundary case worth a closer look."
              : "Both models give the same tithi, nakshatra, yoga and karana at sunrise."}{" "}
            Largest timing difference: {comparison.maxDeltaMin.toFixed(1)} min.
          </p>
        </section>

        <section className="panel px-5 py-4">
          <h2 className="text-sm font-semibold text-foreground">Positions at sunrise</h2>
          <ul className="mt-3 space-y-3">
            {[
              { label: "Ayanamsa", a: comparison.app.ayanamsa, s: comparison.swiss.ayanamsa, d: comparison.ayanamsaDeltaArcsec },
              { label: "Sidereal Sun", a: comparison.app.siderealSun, s: comparison.swiss.siderealSun, d: comparison.sunDeltaArcsec },
              { label: "Sidereal Moon", a: comparison.app.siderealMoon, s: comparison.swiss.siderealMoon, d: comparison.moonDeltaArcsec },
            ].map((row) => (
              <li key={row.label} className="rounded-xl border border-border bg-secondary/30 px-3.5 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-semibold text-foreground">{row.label}</span>
                  <span className="text-xs tabular-nums text-primary">{signedArcsec(row.d)}</span>
                </div>
                <dl className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
                  <div className="flex justify-between gap-3">
                    <dt>astronomy-engine</dt>
                    <dd className="tabular-nums">{formatLongitude(row.a)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt>Swiss-style (Lahiri true)</dt>
                    <dd className="tabular-nums">{formatLongitude(row.s)}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel px-5 py-4">
          <h2 className="text-sm font-semibold text-foreground">Panchang elements</h2>
          <ul className="mt-3 space-y-3">
            {comparison.elements.map((el) => (
              <li
                key={el.label}
                className={`rounded-xl border px-3.5 py-3 ${
                  el.sameName ? "border-border bg-secondary/30" : "border-amber-500/40 bg-amber-500/10"
                }`}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-semibold text-foreground">{el.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {el.sameName ? el.app.name : `${el.app.name} vs ${el.swiss.name}`}
                  </span>
                </div>
                <dl className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
                  <div className="flex justify-between gap-3">
                    <dt>Starts</dt>
                    <dd className="tabular-nums">
                      {formatTimeWithDay(el.app.start, city.tz, prefs.hour12, day)} ·{" "}
                      <span className="text-primary">{signedMin(el.startDeltaMin)}</span>
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt>Ends</dt>
                    <dd className="tabular-nums">
                      {formatTimeWithDay(el.app.end, city.tz, prefs.hour12, day)} ·{" "}
                      <span className="text-primary">{signedMin(el.endDeltaMin)}</span>
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Times shown are from the app engine; the signed value is how much later (+) or earlier (−)
            the Swiss-style model places the same boundary.
          </p>
        </section>

        <section className="panel px-5 py-4">
          <h2 className="text-sm font-semibold text-foreground">How the two differ</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            The app uses astronomy-engine longitudes with a linear Lahiri ayanamsa. The comparison
            column re-implements the Swiss Ephemeris approach in JavaScript: the official Chitrapaksha
            zero point propagated with the IAU precession polynomial, plus nutation in longitude, and a
            light-time corrected Moon. The native Swiss Ephemeris library needs a filesystem and native
            binaries, so it cannot run in this app's runtime; this model tracks it to about an arcsecond.
          </p>
        </section>
      </div>
    </main>
  );
}