import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { CITIES, DEFAULT_CITY_ID, cityForTimeZone, findCity, type City } from "./panchang/cities";

export type ReminderKey = "ekadashi" | "purnima" | "amavasya" | "sankashti" | "pradosh" | "festivals";

/** A reminder pinned to one festival on one specific calendar day. */
export type CustomReminder = {
  /** `${YYYY-MM-DD}:${festivalId}` */
  key: string;
  date: string;
  festivalId: string;
  name: string;
  note: string;
  time: string;
};

export type Prefs = {
  cityId: string;
  hour12: boolean;
  tradition: "amanta" | "purnimanta";
  theme: "night" | "day";
  reminders: Record<ReminderKey, boolean>;
  reminderTime: string;
  custom: CustomReminder[];
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
  custom: [],
};

const STORAGE_KEY = "panchang.prefs.v1";

type Ctx = {
  prefs: Prefs;
  city: City;
  hydrated: boolean;
  setPrefs: (patch: Partial<Prefs>) => void;
  toggleReminder: (key: ReminderKey) => void;
  addCustomReminder: (reminder: CustomReminder) => void;
  removeCustomReminder: (key: string) => void;
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
          custom: Array.isArray(parsed.custom) ? parsed.custom : [],
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

  const addCustomReminder = useCallback((reminder: CustomReminder) => {
    setPrefsState((prev) => ({
      ...prev,
      custom: [...prev.custom.filter((c) => c.key !== reminder.key), reminder].sort((a, b) =>
        a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date),
      ),
    }));
  }, []);

  const removeCustomReminder = useCallback((key: string) => {
    setPrefsState((prev) => ({ ...prev, custom: prev.custom.filter((c) => c.key !== key) }));
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      prefs,
      city: findCity(prefs.cityId),
      hydrated,
      setPrefs,
      toggleReminder,
      addCustomReminder,
      removeCustomReminder,
    }),
    [prefs, hydrated, setPrefs, toggleReminder, addCustomReminder, removeCustomReminder],
  );

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs(): Ctx {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error("usePrefs must be used inside PrefsProvider");
  return ctx;
}