import { useCallback, useEffect, useState } from "react";

import { scanFestivals } from "./panchang/festivals";
import { scanEkadashi, type EkadashiEntry } from "./panchang/ekadashi";
import { toCalendarDay, dayKey } from "./panchang/tz";
import { usePrefs, type ReminderKey } from "./prefs";

const FIRED_KEY = "panchang.lastNotified.v1";
const CUSTOM_FIRED_KEY = "panchang.customNotified.v1";
const PARANA_FIRED_KEY = "panchang.paranaNotified.v1";

const MATCHERS: Record<ReminderKey, (id: string, category: string) => boolean> = {
  ekadashi: (_id, c) => c === "ekadashi",
  purnima: (id) => id === "purnima",
  amavasya: (id) => id === "amavasya",
  sankashti: (id) => id === "sankashti",
  pradosh: (_id, c) => c === "pradosh",
  festivals: (_id, c) => c === "major",
};

export function useReminderNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const request = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
  }, []);

  return { permission, request };
}

/** Fires a local notification at the chosen time while the app is running. */
export function ReminderScheduler() {
  const { prefs, city, hydrated } = usePrefs();

  useEffect(() => {
    if (!hydrated) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;

    const tick = () => {
      if (Notification.permission !== "granted") return;
      const now = new Date();
      const today = toCalendarDay(now, city.tz);
      const key = dayKey(today);
      const hhmm = new Intl.DateTimeFormat("en-GB", {
        timeZone: city.tz,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(now);

      // Date-specific festival reminders
      let fired: string[] = [];
      try {
        fired = JSON.parse(window.localStorage.getItem(CUSTOM_FIRED_KEY) ?? "[]") as string[];
      } catch {
        fired = [];
      }
      for (const c of prefs.custom) {
        if (c.date !== key || hhmm < c.time || fired.includes(c.key)) continue;
        new Notification(c.name, { body: `Today in ${city.name} · ${c.note}`, tag: c.key });
        fired = [...fired, c.key];
      }
      window.localStorage.setItem(
        CUSTOM_FIRED_KEY,
        JSON.stringify(fired.filter((k) => k.slice(0, 10) >= key)),
      );

      if (window.localStorage.getItem(FIRED_KEY) === key) return;
      if (hhmm < prefs.reminderTime) return;

      const [entry] = scanFestivals(today, 1, city);
      if (!entry) return;
      const enabled = (Object.keys(prefs.reminders) as ReminderKey[]).filter(
        (k) => prefs.reminders[k],
      );
      const hits = entry.festivals.filter((f) =>
        enabled.some((k) => MATCHERS[k](f.id, f.category)),
      );
      window.localStorage.setItem(FIRED_KEY, key);
      if (hits.length === 0) return;

      new Notification(hits.map((h) => h.name).join(" · "), {
        body: `Today in ${city.name}: ${hits.map((h) => h.note).join(" · ")}`,
        tag: `panchang-${key}`,
      });
    };

    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [hydrated, city, prefs.reminderTime, prefs.reminders, prefs.custom]);

  return null;
}