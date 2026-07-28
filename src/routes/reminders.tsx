import { createFileRoute } from "@tanstack/react-router";
import { BellRing, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { AppHeader } from "@/components/AppHeader";
import { scanFestivals, type FestivalCategory } from "@/lib/panchang/festivals";
import { dayKey, formatLongDate, toCalendarDay } from "@/lib/panchang/tz";
import { usePrefs, type ReminderKey } from "@/lib/prefs";
import { useReminderNotifications } from "@/lib/useReminderNotifications";

export const Route = createFileRoute("/reminders")({
  head: () => ({
    meta: [
      { title: "Vrat & Festival Reminders — Panchanga" },
      {
        name: "description",
        content:
          "Get reminded about Ekadashi, Purnima, Amavasya, Sankashti and major Hindu festivals in your US timezone.",
      },
      { property: "og:title", content: "Vrat & Festival Reminders — Panchanga" },
      {
        property: "og:description",
        content: "Choose the observances you keep and see every upcoming date.",
      },
    ],
    links: [{ rel: "canonical", href: "https://panchanga.lovable.app/reminders" }],
  }),
  component: RemindersPage,
});

const OPTIONS: { key: ReminderKey; label: string; description: string }[] = [
  { key: "ekadashi", label: "Ekadashi", description: "Both pakshas, twice a lunar month" },
  { key: "purnima", label: "Purnima", description: "Full moon vrat" },
  { key: "amavasya", label: "Amavasya", description: "New moon, tarpan and pitru rites" },
  { key: "sankashti", label: "Sankashti Chaturthi", description: "Krishna paksha Ganesha vrat" },
  { key: "pradosh", label: "Pradosh Vrat", description: "Trayodashi evening" },
  { key: "festivals", label: "Major festivals", description: "Diwali, Holi, Navratri and more" },
];

const CATEGORY_FOR: Record<ReminderKey, FestivalCategory | "purnima" | "amavasya"> = {
  ekadashi: "ekadashi",
  purnima: "purnima",
  amavasya: "amavasya",
  sankashti: "chaturthi",
  pradosh: "pradosh",
  festivals: "major",
};

const INITIAL_VISIBLE = 5;
const LOAD_MORE_STEP = 10;

function RemindersPage() {
  const { prefs, city, hydrated, setPrefs, toggleReminder, removeCustomReminder } = usePrefs();
  const [now, setNow] = useState(() => new Date());
  const [visible, setVisible] = useState(INITIAL_VISIBLE);
  const { permission, request } = useReminderNotifications();

  // Roll the list over as soon as midnight passes in the selected timezone.
  useEffect(() => {
    const currentKey = dayKey(toCalendarDay(now, city.tz));
    const id = window.setInterval(() => {
      const next = new Date();
      if (dayKey(toCalendarDay(next, city.tz)) !== currentKey) {
        setNow(next);
        setVisible(INITIAL_VISIBLE);
      }
    }, 30_000);
    return () => window.clearInterval(id);
  }, [now, city.tz]);

  // Selected timezone changed -> recompute from the current moment.
  useEffect(() => {
    setNow(new Date());
    setVisible(INITIAL_VISIBLE);
  }, [city.tz]);

  const pinned = useMemo(() => {
    if (!hydrated) return [];
    const today = dayKey(toCalendarDay(now, city.tz));
    return prefs.custom.filter((c) => c.date >= today);
  }, [hydrated, now, city.tz, prefs.custom]);

  const matches = useMemo(() => {
    if (!hydrated) return [];
    const start = toCalendarDay(now, city.tz);
    const days = Math.min(730, Math.max(120, visible * 30));
    const scan = scanFestivals(start, days, city);
    const wanted = new Set(
      OPTIONS.filter((o) => prefs.reminders[o.key]).map((o) => CATEGORY_FOR[o.key]),
    );
    return scan
      .map((entry) => ({
        date: entry.date,
        items: entry.festivals.filter(
          (f) => wanted.has(f.category) || wanted.has(f.id as never),
        ),
      }))
      .filter((e) => e.items.length > 0);
  }, [hydrated, now, city, prefs.reminders, visible]);

  const upcoming = useMemo(() => matches.slice(0, visible), [matches, visible]);

  return (
    <main className="mx-auto max-w-md">
      <AppHeader title="Reminders" subtitle={`Alerts at ${prefs.reminderTime} local time`} />

      <div className="space-y-4 px-5 py-5">
        <section className="panel px-5 py-4">
          <h2 className="label-caps">What to remind me about</h2>
          <ul className="mt-3 divide-y divide-border">
            {OPTIONS.map((o) => (
              <li key={o.key} className="flex items-center justify-between gap-4 py-3">
                <span className="min-w-0">
                  <span className="block text-sm">{o.label}</span>
                  <span className="block text-xs text-muted-foreground">{o.description}</span>
                </span>
                <button
                  role="switch"
                  aria-checked={prefs.reminders[o.key]}
                  aria-label={o.label}
                  onClick={() => toggleReminder(o.key)}
                  className={`relative h-6 w-11 shrink-0 rounded-full border border-border transition-colors ${
                    prefs.reminders[o.key] ? "bg-primary" : "bg-secondary"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 size-4.5 rounded-full bg-background transition-all ${
                      prefs.reminders[o.key] ? "left-[1.4rem]" : "left-0.5"
                    }`}
                  />
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel flex items-center justify-between gap-4 px-5 py-4">
          <label htmlFor="reminder-time">
            <span className="block text-sm">Reminder time</span>
            <span className="block text-xs text-muted-foreground">{city.name} local time</span>
          </label>
          <input
            id="reminder-time"
            type="time"
            aria-label="Daily reminder time"
            value={prefs.reminderTime}
            onChange={(e) => setPrefs({ reminderTime: e.target.value })}
            className="rounded-lg border border-input bg-secondary/50 px-3 py-2 text-sm tabular-nums"
          />
        </section>

        <section className="panel px-5 py-4">
          <div className="flex items-start gap-3">
            <BellRing className="mt-0.5 size-4 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="text-sm">Browser notifications</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {permission === "granted"
                  ? "Enabled. You'll get an alert at your chosen time whenever the app is open or installed on your home screen."
                  : permission === "denied"
                    ? "Blocked in your browser settings. The upcoming list below still works."
                    : "Allow notifications to be alerted at your chosen time while the app is open."}
              </p>
              {permission === "default" && (
                <button
                  onClick={request}
                  className="mt-3 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                  Enable notifications
                </button>
              )}
            </div>
          </div>
        </section>

        {pinned.length > 0 && (
          <section>
            <h2 className="label-caps px-1">Reminders you set for a date</h2>
            <ul className="mt-3 space-y-2">
              {pinned.map((c) => (
                <li key={c.key} className="panel flex items-center gap-3 px-4 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-base">{c.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {c.date} · {c.time} {city.name} time
                    </span>
                  </span>
                  <button
                    onClick={() => removeCustomReminder(c.key)}
                    aria-label={`Remove reminder for ${c.name}`}
                    className="rounded-full border border-border p-1.5 text-muted-foreground transition-colors hover:bg-secondary"
                  >
                    <X className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h2 className="label-caps px-1">Upcoming</h2>
          <ul className="mt-3 space-y-2">
            {upcoming.map((entry) => (
              <li key={`${entry.date.year}-${entry.date.month}-${entry.date.day}`} className="panel px-4 py-3">
                <p className="text-sm">
                  {entry.items.map((i) => i.name).join(" · ")}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{formatLongDate(entry.date)}</p>
              </li>
            ))}
            {hydrated && upcoming.length === 0 && (
              <li className="text-center text-sm text-muted-foreground">
                Turn on an observance above to see upcoming dates.
              </li>
            )}
          </ul>
          {matches.length > upcoming.length && (
            <button
              onClick={() => setVisible((v) => v + LOAD_MORE_STEP)}
              className="mt-3 w-full rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
            >
              Load more
            </button>
          )}
        </section>
      </div>
    </main>
  );
}