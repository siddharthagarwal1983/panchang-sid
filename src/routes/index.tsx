import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  BellRing,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Moon,
  ShieldAlert,
  Sparkles,
  Sunrise,
  Sunset,
  UtensilsCrossed,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { AppHeader } from "@/components/AppHeader";
import { AddToCalendar } from "@/components/AddToCalendar";
import { FestivalModal, type FestivalSheetItem } from "@/components/FestivalModal";
import { MoonGlyph } from "@/components/MoonGlyph";
import { computeDayPanchang, type Muhurta } from "@/lib/panchang/core";
import { tzLabel } from "@/lib/panchang/cities";
import { festivalsForSummary, scanFestivals, type Festival } from "@/lib/panchang/festivals";
import { computeDaySummary } from "@/lib/panchang/core";
import { fastingStatus, gloss, muhurtaTerm, pakshaTerm, term, tithiTerm } from "@/lib/panchang/lang";
import { vratGuide } from "@/lib/panchang/vrat";
import type { CalendarEvent } from "@/lib/calendar-export";
import {
  addDays,
  dayKey,
  formatLongDate,
  formatTime,
  formatTimeWithDay,
  toCalendarDay,
  tzAbbr,
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
      { title: "Today's Panchang — Tithi, Fasting & Muhurta" },
      {
        name: "description",
        content:
          "Today's tithi with fasting status, local sunrise and sunset, plus Abhijit Muhurta and Rahu Kalam windows for your city.",
      },
      { property: "og:title", content: "Today's Panchang — Tithi, Fasting & Muhurta" },
      {
        property: "og:description",
        content: "Daily Hindu almanac timings calculated for your local sunrise, no account needed.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://panchanga.lovable.app/" }],
  }),
  component: TodayPage,
});

function parseDay(value: string | undefined): CalendarDay | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
}

/** "2h 14m" style duration for countdowns. */
function duration(ms: number): string {
  const mins = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function TodayPage() {
  const { city, prefs, hydrated, addCustomReminder, removeCustomReminder } = usePrefs();
  const { permission, request } = useReminderNotifications();
  const { d } = Route.useSearch();
  const navigate = useNavigate({ from: "/" });
  const [now, setNow] = useState(() => new Date());
  const [openItem, setOpenItem] = useState<FestivalSheetItem | null>(null);

  // Keep progress bars and countdowns alive.
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const today = useMemo(() => toCalendarDay(now, city.tz), [now, city.tz]);
  const date = parseDay(d) ?? today;
  const isToday = dayKey(date) === dayKey(today);
  const script = prefs.script;

  const panchang = useMemo(
    () => (hydrated ? computeDayPanchang(date, city) : null),
    [hydrated, date.year, date.month, date.day, city],
  );
  const nextSunrise = useMemo(
    () => (hydrated ? computeDayPanchang(addDays(date, 1), city).sunrise : null),
    [hydrated, date.year, date.month, date.day, city],
  );
  const festivals = useMemo(
    () =>
      hydrated
        ? festivalsForSummary(
            computeDaySummary(date, city),
            computeDaySummary(addDays(date, -1), city),
          ).filter((f) => f.category === "major")
        : [],
    [hydrated, date.year, date.month, date.day, city],
  );

  // Scanning ~120 days of panchang is expensive, so it runs in small idle-time
  // chunks after first paint instead of blocking hydration.
  const [upcoming, setUpcoming] = useState<{ date: CalendarDay; festival: Festival }[]>([]);
  const upcomingKey = `${hydrated}:${date.year}-${date.month}-${date.day}:${city.id}`;
  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    const out: { date: CalendarDay; festival: Festival }[] = [];
    let offset = 1;
    const CHUNK = 10;
    const LIMIT = 121;

    const schedule = (fn: () => void) =>
      typeof window.requestIdleCallback === "function"
        ? window.requestIdleCallback(() => fn(), { timeout: 500 })
        : window.setTimeout(fn, 0);

    const step = () => {
      if (cancelled) return;
      for (const day of scanFestivals(addDays(date, offset), CHUNK, city)) {
        for (const f of day.festivals) {
          if (f.category === "major") out.push({ date: day.date, festival: f });
        }
      }
      offset += CHUNK;
      if (out.length >= 5 || offset > LIMIT) {
        setUpcoming(out.slice(0, 5));
        return;
      }
      setUpcoming(out.slice(0, 5));
      schedule(step);
    };

    setUpcoming([]);
    schedule(step);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upcomingKey]);

  const go = (delta: number) => {
    const next = addDays(date, delta);
    navigate({ search: { d: dayKey(next) } });
  };

  const t = (value: Date | null) => formatTimeWithDay(value, city.tz, prefs.hour12, date);
  const zone = tzAbbr(now, city.tz);

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

  const fasting = panchang ? fastingStatus(panchang.tithi.name, panchang.tithi.paksha) : null;
  const vrat =
    panchang && fasting && panchang.sunrise && panchang.sunset
      ? vratGuide(panchang.tithi.name, panchang.tithi.paksha, {
          sunrise: panchang.sunrise,
          sunset: panchang.sunset,
          moonrise: panchang.moonrise,
          tithiEnd: panchang.tithi.end,
          nextSunrise,
        })
      : null;

  const location = `${city.name}, ${city.state}`;
  const eventFor = (item: FestivalSheetItem): CalendarEvent => {
    const lines = [item.note];
    if (vrat) {
      lines.push(
        `${vrat.start.label}: ${t(vrat.start.at)} ${zone}`,
        `${vrat.end.label}: ${t(vrat.end.at)} ${zone}`,
        ...vrat.dietary,
      );
    }
    lines.push(`Sunrise ${formatTime(panchang?.sunrise ?? null, city.tz, prefs.hour12)} · Sunset ${formatTime(panchang?.sunset ?? null, city.tz, prefs.hour12)} ${zone}`);
    lines.push(`Calculated for ${location} local sunrise — Panchāṅga`);
    return {
      title: item.name,
      description: lines.filter(Boolean).join("\n"),
      location,
      day: date,
    };
  };
  const openVrat = () =>
    vrat && setOpenItem({ id: "vrat", name: vrat.label, note: fasting?.detail ?? "" });

  return (
    <main className="mx-auto max-w-md">
      <AppHeader
        title="Panchāṅga"
        headingSuffix="— Today’s Tithi, Nakshatra & Muhurta"
        showLocation
        showScript
      />

      <div className="px-5 pt-3">
        <p className="flex items-start gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-[12px] leading-snug text-primary">
          <Sunrise className="mt-px size-3.5 shrink-0" />
          <span>
            Calculated for <span className="font-semibold">{city.name}</span> local sunrise
            {prefs.activeLocation === "family" ? " (family location)" : ""} · {tzLabel(city.tz)}
          </span>
        </p>
      </div>

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
          {/* 1. Local solar header — every vrat and parana window hangs off these. */}
          <section className="panel px-4 py-3">
            <div className="grid grid-cols-2 gap-3">
              <SolarCell
                icon={<Sunrise className="size-4 text-primary" />}
                label="Sunrise"
                value={formatTime(panchang.sunrise, city.tz, prefs.hour12)}
                zone={zone}
              />
              <SolarCell
                icon={<Sunset className="size-4 text-primary" />}
                label="Sunset"
                value={formatTime(panchang.sunset, city.tz, prefs.hour12)}
                zone={zone}
              />
            </div>
            <div className="hairline my-3" />
            <div className="grid grid-cols-2 gap-3">
              <SolarCell
                icon={<Moon className="size-4 text-gold" />}
                label="Moonrise"
                value={t(panchang.moonrise)}
              />
              <SolarCell
                icon={<Moon className="size-4 text-gold" />}
                label="Moonset"
                value={t(panchang.moonset)}
              />
            </div>
          </section>

          {/* 2. Active tithi + fasting status. */}
          <section className="panel px-5 py-5">
            <div className="flex items-start gap-4">
              <MoonGlyph phase={panchang.moonPhase} size={64} />
              <div className="min-w-0 flex-1">
                <p className="label-caps">
                  {pakshaTerm(panchang.tithi.paksha, script)}
                  {script === "english" ? "" : " Paksha"}
                </p>
                <h2 className="mt-0.5 font-display text-3xl leading-tight text-primary">
                  {tithiTerm(panchang.tithi.name, script)}
                </h2>
                {script !== "english" && gloss(panchang.tithi.name) && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {gloss(panchang.tithi.name)}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm">
                Ends {t(panchang.tithi.end)} {zone}
                <span className="text-muted-foreground">
                  {" "}
                  · then {tithiTerm(panchang.nextTithi.name, script)}
                </span>
              </p>
            </div>

            {fasting && (
              <div className="mt-4 rounded-xl border border-gold/35 bg-gold/10 px-3 py-2.5">
                <button
                  onClick={openVrat}
                  className="flex w-full items-start gap-2.5 text-left"
                  aria-label={`Details about ${fasting.label}`}
                >
                  <UtensilsCrossed className="mt-0.5 size-4 shrink-0 text-gold" />
                  <span className="text-sm leading-snug">
                    <span className="font-display text-gold underline-offset-4 hover:underline">
                      {fasting.label}
                    </span>
                    <span className="block text-xs text-muted-foreground">{fasting.detail}</span>
                  </span>
                </button>
                {vrat && (
                  <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs">
                    <span className="text-muted-foreground">
                      {vrat.start.label}
                      <span className="block tabular-nums text-foreground">
                        {t(vrat.start.at)} {zone}
                      </span>
                    </span>
                    <span className="text-muted-foreground">
                      {vrat.end.label}
                      <span className="block tabular-nums text-foreground">
                        {t(vrat.end.at)} {zone}
                      </span>
                    </span>
                  </div>
                )}
                <div className="mt-3">
                  <AddToCalendar
                    event={eventFor({
                      id: "vrat",
                      name: vrat?.label ?? fasting.label,
                      note: fasting.detail,
                    })}
                  />
                </div>
              </div>
            )}

            {festivals.length > 0 && (
              <>
                <div className="hairline my-4" />
                <p className="label-caps">Festivals</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {festivals.map((f) => (
                    <li
                      key={f.id}
                      className="flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 py-1 pl-3 pr-1.5 font-display text-sm text-gold"
                    >
                      <button
                        onClick={() => setOpenItem({ id: f.id, name: f.name, note: f.note, festival: f })}
                        className="underline-offset-4 hover:underline"
                        aria-label={`Details about ${f.name}`}
                      >
                        {f.name}
                      </button>
                      <button
                        onClick={() =>
                          setOpenItem({ id: f.id, name: f.name, note: f.note, festival: f })
                        }
                        aria-label={`Add ${f.name} to calendar`}
                        className="rounded-full p-1.5 text-gold transition-colors hover:bg-gold/20"
                      >
                        <CalendarPlus className="size-3.5" />
                      </button>
                      <button
                        onClick={() => toggleFestivalReminder(f)}
                        aria-pressed={isReminded(f.id)}
                        aria-label={
                          isReminded(f.id)
                            ? `Remove reminder for ${f.name}`
                            : `Remind me on ${f.name}`
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

          {/* 3. Auspicious vs inauspicious windows. */}
          {panchang.muhurtas.length > 0 && (
            <section>
              <h3 className="label-caps px-1">Windows today</h3>
              <div className="mt-2 grid grid-cols-2 gap-3">
                {[...panchang.muhurtas]
                  .sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "auspicious" ? -1 : 1))
                  .map((m) => (
                    <MuhurtaTile
                      key={m.name}
                      muhurta={m}
                      script={script}
                      now={now}
                      isToday={isToday}
                      tz={city.tz}
                      hour12={prefs.hour12}
                    />
                  ))}
              </div>
            </section>
          )}

          <section className="grid grid-cols-2 gap-3">
            <Fact
              label="Nakshatra"
              value={term(panchang.nakshatra.name, script)}
              sub={`until ${t(panchang.nakshatra.end)}`}
            />
            <Fact label="Yoga" value={panchang.yoga.name} sub={`until ${t(panchang.yoga.end)}`} />
            <Fact
              label="Karana"
              value={panchang.karana.name}
              sub={`then ${panchang.nextKarana.name}`}
            />
            <Fact
              label="Vaara"
              value={term(panchang.vaara, script)}
              sub={`Moon in ${panchang.moonRashi}`}
            />
          </section>

          <section className="panel px-5 py-4 text-sm">
            <span className="font-display text-base">
              {term(
                prefs.tradition === "amanta" ? panchang.month.amanta : panchang.month.purnimanta,
                script,
              )}
            </span>{" "}
            masa · {panchang.ritu} ritu · Vikram Samvat {panchang.samvat}
          </section>

          {upcoming.length > 0 && (
            <section className="panel px-5 py-4">
              <h3 className="label-caps">Upcoming festivals</h3>
              <ul className="mt-3 space-y-2.5">
                {upcoming.map((u) => (
                  <li key={`${dayKey(u.date)}:${u.festival.id}`}>
                    <button
                      onClick={() => navigate({ search: { d: dayKey(u.date) } })}
                      className="flex w-full items-center justify-between gap-3 text-left text-sm"
                    >
                      <span className="font-display text-base text-gold">{u.festival.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatLongDate(u.date)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <p className="px-1 text-center text-xs leading-relaxed text-muted-foreground">
            Computed for {city.name}, {city.state} using drik ganita with the Lahiri ayanamsa.
            Timings may differ by a few minutes from your family almanac.
          </p>
        </div>
      )}

      <FestivalModal
        item={openItem}
        dateLabel={formatLongDate(date)}
        reminded={openItem ? isReminded(openItem.id) : false}
        vrat={vrat}
        formatTime={t}
        zone={zone}
        calendarEvent={openItem ? eventFor(openItem) : null}
        onToggleReminder={() =>
          openItem &&
          toggleFestivalReminder({ id: openItem.id, name: openItem.name, note: openItem.note })
        }
        onOpenChange={(open) => !open && setOpenItem(null)}
      />
    </main>
  );
}

function MuhurtaTile({
  muhurta,
  script,
  now,
  isToday,
  tz,
  hour12,
}: {
  muhurta: Muhurta;
  script: Parameters<typeof muhurtaTerm>[1];
  now: Date;
  isToday: boolean;
  tz: string;
  hour12: boolean;
}) {
  const good = muhurta.kind === "auspicious";
  const severe = muhurta.name === "Rahu Kalam";
  const tone = good
    ? "border-auspicious/40 bg-auspicious/10 text-auspicious"
    : severe
      ? "border-avoid/45 bg-avoid/10 text-avoid"
      : "border-caution/45 bg-caution/10 text-caution";
  const title = muhurtaTerm(muhurta.name, script === "english" ? "iast" : script);
  const description = gloss(muhurta.name);

  let status: string;
  if (!isToday) status = "";
  else if (now < muhurta.start) status = `starts in ${duration(muhurta.start.getTime() - now.getTime())}`;
  else if (now < muhurta.end) status = `ends in ${duration(muhurta.end.getTime() - now.getTime())}`;
  else status = "over for today";

  const active = isToday && now >= muhurta.start && now < muhurta.end;

  return (
    <div className={`rounded-xl border px-3.5 py-3 ${tone} ${active ? "ring-1 ring-current" : ""}`}>
      <div className="flex items-center gap-1.5">
        {good ? (
          <Sparkles className="size-3.5 shrink-0" />
        ) : (
          <ShieldAlert className="size-3.5 shrink-0" />
        )}
        <p className="truncate font-display text-sm">{title}</p>
      </div>
      <p className="mt-1.5 text-[13px] tabular-nums text-foreground">
        {formatTime(muhurta.start, tz, hour12)} – {formatTime(muhurta.end, tz, hour12)}
      </p>
      {description && (
        <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{description}</p>
      )}
      {status && <p className="mt-1 text-[11px] font-semibold">{status}</p>}
    </div>
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

function SolarCell({
  icon,
  label,
  value,
  zone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  zone?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span className="block truncate tabular-nums text-sm">
          {value}
          {zone ? <span className="text-muted-foreground"> {zone}</span> : null}
        </span>
      </span>
    </div>
  );
}
