import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { CITIES, DEFAULT_CITY_ID, cityForTimeZone, findCity, type City } from "./panchang/cities";

export type ReminderKey = "ekadashi" | "purnima" | "amavasya" | "sankashti" | "pradosh" | "festivals";

export type Prefs = {
  cityId: string;
  hour12: boolean;
  tradition: "amanta" | "purnimanta";
  theme: "night" | "day";
  reminders: Record<ReminderKey, boolean>;
  reminderTime: string;
};

const DEFAULTS: Prefs = {
  cityId: DEFAULT_CITY_ID,
  hour12: true,
  tradition: "amanta",
  theme: "night",
  reminders: {
    ekadashi: true,
    purnima: false,
    amavasya: false,
    sankashti: false,
    pradosh: false,
    festivals: true,
  },
  reminderTime: "07:00",
};

const STORAGE_KEY = "panchang.prefs.v1";

type Ctx = {
  prefs: Prefs;
  city: City;
  hydrated: boolean;
  setPrefs: (patch: Partial<Prefs>) => void;
  toggleReminder: (key: ReminderKey) => void;
};

const PrefsContext = createContext<Ctx | null>(null);

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefsState] = useState<Prefs>(DEFAULTS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let next = DEFAULTS;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Prefs>;
        next = {
          ...DEFAULTS,
          ...parsed,
          reminders: { ...DEFAULTS.reminders, ...(parsed.reminders ?? {}) },
        };
        if (!CITIES.some((c) => c.id === next.cityId)) next = { ...next, cityId: DEFAULT_CITY_ID };
      } else {
        const guess = cityForTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
        if (guess) next = { ...DEFAULTS, cityId: guess.id };
      }
    } catch {
      next = DEFAULTS;
    }
    setPrefsState(next);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      /* storage unavailable */
    }
    document.documentElement.classList.toggle("day", prefs.theme === "day");
  }, [prefs, hydrated]);

  const setPrefs = useCallback((patch: Partial<Prefs>) => {
    setPrefsState((prev) => ({ ...prev, ...patch }));
  }, []);

  const toggleReminder = useCallback((key: ReminderKey) => {
    setPrefsState((prev) => ({
      ...prev,
      reminders: { ...prev.reminders, [key]: !prev.reminders[key] },
    }));
  }, []);

  const value = useMemo<Ctx>(
    () => ({ prefs, city: findCity(prefs.cityId), hydrated, setPrefs, toggleReminder }),
    [prefs, hydrated, setPrefs, toggleReminder],
  );

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs(): Ctx {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error("usePrefs must be used inside PrefsProvider");
  return ctx;
}