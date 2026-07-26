import { createFileRoute } from "@tanstack/react-router";
import { BellRing, X } from "lucide-react";
import { useMemo, useState } from "react";

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

function RemindersPage() {
  const { prefs, city, hydrated, setPrefs, toggleReminder, removeCustomReminder } = usePrefs();
  const [now] = useState(() => new Date());
  const { permission, request } = useReminderNotifications();

  const pinned = useMemo(() => {
    if (!hydrated) return [];
    const today = dayKey(toCalendarDay(now, city.tz));
    return prefs.custom.filter((c) => c.date >= today);
  }, [hydrated, now, city.tz, prefs.custom]);

  const upcoming = useMemo(() => {
    if (!hydrated) return [];
    const start = toCalendarDay(now, city.tz);
    const scan = scanFestivals(start, 100, city);
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
      .filter((e) => e.items.length > 0)
      .slice(0, 20);
  }, [hydrated, now, city, prefs.reminders]);

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
          <span>
            <span className="block text-sm">Reminder time</span>
            <span className="block text-xs text-muted-foreground">{city.name} local time</span>
          </span>
          <input
            type="time"
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
        </section>
      </div>
    </main>
  );
}