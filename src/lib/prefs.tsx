import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";

import { useAuth } from "./auth";
import { CITIES, DEFAULT_CITY_ID, cityForTimeZone, findCity, type City } from "./panchang/cities";
import {
  FAMILY_DEFAULT_PLACE,
  placeForTimeZone,
  reverseGeocode,
  type Place,
} from "./panchang/geocode";

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
  /** Any place in the world; when set it wins over the preset `cityId`. */
  place: Place | null;
  /** Parents / family location, used by the dual-location toggle. */
  familyPlace: Place;
  /** Which of the two locations panchang is currently calculated for. */
  activeLocation: "mine" | "family";
  /** True once we've attempted automatic device geolocation. */
  autoLocated: boolean;
  /** Most recently chosen places, newest first. */
  recentPlaces: Place[];
  hour12: boolean;
  tradition: "amanta" | "purnimanta";
  theme: "night" | "day";
  reminders: Record<ReminderKey, boolean>;
  reminderTime: string;
  custom: CustomReminder[];
};

const DEFAULTS: Prefs = {
  cityId: DEFAULT_CITY_ID,
  place: null,
  familyPlace: FAMILY_DEFAULT_PLACE,
  activeLocation: "mine",
  autoLocated: false,
  recentPlaces: [],
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
  /** The user's own (device) location, independent of the active toggle. */
  myPlace: City;
  familyPlace: Place;
  locating: boolean;
  hydrated: boolean;
  setPrefs: (patch: Partial<Prefs>) => void;
  setPlace: (place: Place, target?: "mine" | "family") => void;
  setActiveLocation: (target: "mine" | "family") => void;
  detectMyLocation: () => Promise<void>;
  toggleReminder: (key: ReminderKey) => void;
  addCustomReminder: (reminder: CustomReminder) => void;
  removeCustomReminder: (key: string) => void;
};

const PrefsContext = createContext<Ctx | null>(null);

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefsState] = useState<Prefs>(DEFAULTS);
  const [hydrated, setHydrated] = useState(false);
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [cloudLoadedFor, setCloudLoadedFor] = useState<string | null>(null);

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
          recentPlaces: Array.isArray(parsed.recentPlaces) ? parsed.recentPlaces : [],
          place: parsed.place && parsed.place.tz ? parsed.place : null,
        };
        if (!next.place && !CITIES.some((c) => c.id === next.cityId)) {
          next = { ...next, cityId: DEFAULT_CITY_ID };
        }
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

  // Pull saved settings from the account on sign-in.
  useEffect(() => {
    if (!hydrated || !userId || cloudLoadedFor === userId) return;
    let cancelled = false;
    void (async () => {
      const { data } = await supabase
        .from("user_settings")
        .select("prefs")
        .eq("user_id", userId)
        .maybeSingle();
      if (cancelled) return;
      const remote = (data?.prefs ?? null) as Partial<Prefs> | null;
      if (remote && Object.keys(remote).length > 0) {
        setPrefsState((prev) => ({
          ...prev,
          ...remote,
          reminders: { ...prev.reminders, ...(remote.reminders ?? {}) },
          custom: Array.isArray(remote.custom) ? remote.custom : prev.custom,
        }));
      }
      setCloudLoadedFor(userId);
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated, userId, cloudLoadedFor]);

  useEffect(() => {
    if (!userId) setCloudLoadedFor(null);
  }, [userId]);

  // Push settings back to the account.
  useEffect(() => {
    if (!hydrated || !userId || cloudLoadedFor !== userId) return;
    const id = window.setTimeout(() => {
      void supabase.from("user_settings").upsert({ user_id: userId, prefs });
    }, 600);
    return () => window.clearTimeout(id);
  }, [prefs, hydrated, userId, cloudLoadedFor]);

  const setPrefs = useCallback((patch: Partial<Prefs>) => {
    setPrefsState((prev) => ({ ...prev, ...patch }));
  }, []);

  const setPlace = useCallback((place: Place) => {
    setPrefsState((prev) => ({
      ...prev,
      place,
      cityId: place.id,
      recentPlaces: [place, ...prev.recentPlaces.filter((p) => p.id !== place.id)].slice(0, 6),
    }));
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
      city: prefs.place ?? findCity(prefs.cityId),
      hydrated,
      setPrefs,
      setPlace,
      toggleReminder,
      addCustomReminder,
      removeCustomReminder,
    }),
    [prefs, hydrated, setPrefs, setPlace, toggleReminder, addCustomReminder, removeCustomReminder],
  );

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs(): Ctx {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error("usePrefs must be used inside PrefsProvider");
  return ctx;
}