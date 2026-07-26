import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bell, BellRing, ChevronLeft, ChevronRight, Moon, Sunrise, Sunset } from "lucide-react";
import { useMemo, useState } from "react";

import { AppHeader } from "@/components/AppHeader";
import { MoonGlyph } from "@/components/MoonGlyph";
import { computeDayPanchang } from "@/lib/panchang/core";
import { festivalsForSummary } from "@/lib/panchang/festivals";
import { computeDaySummary } from "@/lib/panchang/core";
import {
  addDays,
  dayKey,
  formatLongDate,
  formatTime,
  formatTimeWithDay,
  toCalendarDay,
  type CalendarDay,
} from "@/lib/panchang/tz";
import { usePrefs } from "@/lib/prefs";
import { useReminderNotifications } from "@/lib/useReminderNotifications";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => ({
    d: typeof search.d === "string" ? search.d : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Today's Panchang — Tithi, Nakshatra & Muhurta" },
      {
        name: "description",
        content:
          "Today's tithi, nakshatra, yoga, karana, sunrise, Rahu Kalam and Abhijit Muhurta, computed for your US city.",
      },
      { property: "og:title", content: "Today's Panchang — Tithi, Nakshatra & Muhurta" },
      {
        property: "og:description",
        content: "Daily Hindu almanac timings calculated for your US city, no account needed.",
      },
    ],
  }),
  component: TodayPage,
});

function parseDay(value: string | undefined): CalendarDay | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
}

function TodayPage() {
  const { city, prefs, hydrated, addCustomReminder, removeCustomReminder } = usePrefs();
  const { permission, request } = useReminderNotifications();
  const { d } = Route.useSearch();
  const navigate = useNavigate({ from: "/" });
  const [now] = useState(() => new Date());

  const today = useMemo(() => toCalendarDay(now, city.tz), [now, city.tz]);
  const date = parseDay(d) ?? today;
  const isToday = dayKey(date) === dayKey(today);

  const panchang = useMemo(
    () => (hydrated ? computeDayPanchang(date, city) : null),
    [hydrated, date.year, date.month, date.day, city],
  );
  const festivals = useMemo(
    () =>
      hydrated
        ? festivalsForSummary(
            computeDaySummary(date, city),
            computeDaySummary(addDays(date, -1), city),
          )
        : [],
    [hydrated, date.year, date.month, date.day, city],
  );

  const go = (delta: number) => {
    const next = addDays(date, delta);
    navigate({ search: { d: dayKey(next) } });
  };

  const t = (value: Date | null) => formatTimeWithDay(value, city.tz, prefs.hour12, date);

  const key = dayKey(date);
  const isReminded = (id: string) => prefs.custom.some((c) => c.key === `${key}:${id}`);
  const toggleFestivalReminder = async (f: { id: string; name: string; note: string }) => {
    const k = `${key}:${f.id}`;
    if (isReminded(f.id)) {
      removeCustomReminder(k);
      return;
    }
    if (permission === "default") await request();
    addCustomReminder({
      key: k,
      date: key,
      festivalId: f.id,
      name: f.name,
      note: f.note,
      time: prefs.reminderTime,
    });
  };

  return (
    <main className="mx-auto max-w-md">
      <AppHeader title="Panchāṅga" subtitle="Drik ganita · Lahiri ayanamsa" />

      <div className="flex items-center justify-between gap-2 px-5 py-4">
        <button
          onClick={() => go(-1)}
          aria-label="Previous day"
          className="rounded-full border border-border p-2 transition-colors hover:bg-secondary"
        >
          <ChevronLeft className="size-4" />
        </button>
        <div className="text-center">
          <p className="font-display text-base">{formatLongDate(date)}</p>
          {!isToday && (
            <button
              onClick={() => navigate({ search: { d: undefined } })}
              className="mt-0.5 text-xs text-primary underline-offset-4 hover:underline"
            >
              Back to today
            </button>
          )}
        </div>
        <button
          onClick={() => go(1)}
          aria-label="Next day"
          className="rounded-full border border-border p-2 transition-colors hover:bg-secondary"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      {!panchang ? (
        <div className="px-5 py-16 text-center text-sm text-muted-foreground">
          Calculating positions of the sun and moon…
        </div>
      ) : (
        <div className="space-y-4 px-5 pb-8">
          <section className="panel relative overflow-hidden px-5 py-6 text-center">
            <div className="mx-auto w-fit">
              <MoonGlyph phase={panchang.moonPhase} size={104} />
            </div>
            <p className="label-caps mt-4">{panchang.tithi.paksha} Paksha</p>
            <h2 className="mt-1 font-display text-4xl text-primary">{panchang.tithi.name}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              until {t(panchang.tithi.end)} · then {panchang.nextTithi.name}
            </p>
            <div className="hairline my-5" />
            <p className="text-sm">
              <span className="font-display text-base">
                {prefs.tradition === "amanta" ? panchang.month.amanta : panchang.month.purnimanta}
              </span>{" "}
              masa · {panchang.ritu} ritu · Vikram Samvat {panchang.samvat}
            </p>
            {festivals.length > 0 && (
              <>
                <div className="hairline my-5" />
                <p className="label-caps">Observance{festivals.length > 1 ? "s" : ""} today</p>
                <ul className="mt-2 flex flex-wrap justify-center gap-2">
                  {festivals.map((f) => (
                    <li
                      key={f.id}
                      className="flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 py-1 pl-3 pr-1.5 font-display text-sm text-gold"
                    >
                      {f.name}
                      <button
                        onClick={() => toggleFestivalReminder(f)}
                        aria-pressed={isReminded(f.id)}
                        aria-label={
                          isReminded(f.id)
                            ? `Remove reminder for ${f.name}`
                            : `Remind me on ${f.name}`
                        }
                        title={
                          isReminded(f.id)
                            ? `Reminder set for ${prefs.reminderTime}`
                            : "Set a reminder for this date"
                        }
                        className={`rounded-full p-1.5 transition-colors ${
                          isReminded(f.id)
                            ? "bg-gold text-background"
                            : "text-gold hover:bg-gold/20"
                        }`}
                      >
                        {isReminded(f.id) ? (
                          <BellRing className="size-3.5" />
                        ) : (
                          <Bell className="size-3.5" />
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
                {festivals.some((f) => isReminded(f.id)) && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Reminder set for {prefs.reminderTime} {city.name} time
                    {permission !== "granted" && " — allow notifications to receive it"}.
                  </p>
                )}
              </>
            )}
          </section>

          <section className="grid grid-cols-2 gap-3">
            <Fact label="Nakshatra" value={panchang.nakshatra.name} sub={`until ${t(panchang.nakshatra.end)}`} />
            <Fact label="Yoga" value={panchang.yoga.name} sub={`until ${t(panchang.yoga.end)}`} />
            <Fact label="Karana" value={panchang.karana.name} sub={`then ${panchang.nextKarana.name}`} />
            <Fact label="Vaara" value={panchang.vaara} sub={`Moon in ${panchang.moonRashi}`} />
          </section>

          <section className="panel px-5 py-4">
            <h3 className="label-caps">Sun &amp; Moon</h3>
            <div className="mt-3 grid grid-cols-2 gap-y-3 text-sm">
              <Timing icon={<Sunrise className="size-4 text-primary" />} label="Sunrise" value={formatTime(panchang.sunrise, city.tz, prefs.hour12)} />
              <Timing icon={<Sunset className="size-4 text-primary" />} label="Sunset" value={formatTime(panchang.sunset, city.tz, prefs.hour12)} />
              <Timing icon={<Moon className="size-4 text-gold" />} label="Moonrise" value={t(panchang.moonrise)} />
              <Timing icon={<Moon className="size-4 text-gold" />} label="Moonset" value={t(panchang.moonset)} />
            </div>
          </section>

          <section className="panel px-5 py-4">
            <h3 className="label-caps">Muhurta</h3>
            <ul className="mt-3 space-y-2.5">
              {panchang.muhurtas.map((m) => (
                <li key={m.name} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2">
                    <span
                      className={`size-2 rounded-full ${
                        m.kind === "auspicious" ? "bg-primary" : "bg-lotus"
                      }`}
                    />
                    {m.name}
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {formatTime(m.start, city.tz, prefs.hour12)} – {formatTime(m.end, city.tz, prefs.hour12)}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="panel px-5 py-4">
            <h3 className="label-caps">Observances</h3>
            {festivals.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                No special observance falls on this day.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {festivals.map((f) => (
                  <li key={f.id} className="flex gap-3">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-gold" />
                    <span>
                      <span className="block font-display text-base">{f.name}</span>
                      <span className="block text-xs text-muted-foreground">{f.note}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <p className="px-1 text-center text-xs leading-relaxed text-muted-foreground">
            Computed for {city.name}, {city.state} using drik ganita with the Lahiri ayanamsa.
            Timings may differ by a few minutes from your family almanac.
          </p>
        </div>
      )}
    </main>
  );
}

function Fact({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="panel px-4 py-3">
      <p className="label-caps">{label}</p>
      <p className="mt-1 font-display text-lg leading-tight">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function Timing({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span className="flex-1">
        <span className="block text-xs text-muted-foreground">{label}</span>
        <span className="block tabular-nums">{value}</span>
      </span>
    </div>
  );
}