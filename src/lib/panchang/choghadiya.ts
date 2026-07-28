import { Body, Observer, SearchRiseSet } from "astronomy-engine";

import type { City } from "./cities";
import { addDays, zonedToUtc, weekdayIndex, type CalendarDay } from "./tz";

export type ChoghadiyaName = "Amrit" | "Shubh" | "Labh" | "Chal" | "Udveg" | "Rog" | "Kaal";

export type ChoghadiyaQuality = "auspicious" | "neutral" | "inauspicious";

export type ChoghadiyaMeta = {
  name: ChoghadiyaName;
  devanagari: string;
  lord: string;
  quality: ChoghadiyaQuality;
  meaning: string;
  goodFor: string;
};

export const CHOGHADIYA_META: Record<ChoghadiyaName, ChoghadiyaMeta> = {
  Amrit: {
    name: "Amrit",
    devanagari: "अमृत",
    lord: "Moon",
    quality: "auspicious",
    meaning: "Nectar — the most benefic window of the day.",
    goodFor: "Any important work: weddings, griha pravesh, new ventures, travel, purchases.",
  },
  Shubh: {
    name: "Shubh",
    devanagari: "शुभ",
    lord: "Jupiter",
    quality: "auspicious",
    meaning: "Auspicious — favoured for ceremonies and blessings.",
    goodFor: "Marriage, upanayana, pujas, signing agreements, meeting elders.",
  },
  Labh: {
    name: "Labh",
    devanagari: "लाभ",
    lord: "Mercury",
    quality: "auspicious",
    meaning: "Gain — associated with profit and learning.",
    goodFor: "Starting a business, investing, negotiations, education, job interviews.",
  },
  Chal: {
    name: "Chal",
    devanagari: "चल",
    lord: "Venus",
    quality: "neutral",
    meaning: "Moving — ordinary but workable, best for things already in motion.",
    goodFor: "Travel, commuting, deliveries, errands and routine work.",
  },
  Udveg: {
    name: "Udveg",
    devanagari: "उद्वेग",
    lord: "Sun",
    quality: "inauspicious",
    meaning: "Anxiety — restless energy that can cause friction.",
    goodFor: "Government paperwork only; avoid new beginnings and difficult conversations.",
  },
  Rog: {
    name: "Rog",
    devanagari: "रोग",
    lord: "Mars",
    quality: "inauspicious",
    meaning: "Illness — conflict-prone and draining.",
    goodFor: "Avoid; traditionally used only for confronting an opponent or a contest.",
  },
  Kaal: {
    name: "Kaal",
    devanagari: "काल",
    lord: "Saturn",
    quality: "inauspicious",
    meaning: "Death — the most inauspicious window.",
    goodFor: "Avoid new work entirely; some use it only for saving or storing wealth.",
  },
};

// Both the day and night sequences are rotations of a fixed cycle; the weekday
// decides where the rotation starts.
const DAY_CYCLE: ChoghadiyaName[] = ["Udveg", "Chal", "Labh", "Amrit", "Kaal", "Shubh", "Rog"];
const NIGHT_CYCLE: ChoghadiyaName[] = ["Shubh", "Amrit", "Chal", "Rog", "Kaal", "Labh", "Udveg"];

/** Sunday → Saturday start offsets into the cycles above. */
const DAY_START = [0, 3, 6, 2, 5, 1, 4];
const NIGHT_START = [0, 2, 4, 6, 1, 3, 5];

export type ChoghadiyaSlot = {
  index: number;
  period: "day" | "night";
  meta: ChoghadiyaMeta;
  start: Date;
  end: Date;
};

export type ChoghadiyaDay = {
  date: CalendarDay;
  sunrise: Date | null;
  sunset: Date | null;
  nextSunrise: Date | null;
  day: ChoghadiyaSlot[];
  night: ChoghadiyaSlot[];
};

function build(
  from: Date,
  to: Date,
  cycle: ChoghadiyaName[],
  startAt: number,
  period: "day" | "night",
): ChoghadiyaSlot[] {
  const span = (to.getTime() - from.getTime()) / 8;
  return Array.from({ length: 8 }, (_, i) => ({
    index: i,
    period,
    meta: CHOGHADIYA_META[cycle[(startAt + i) % 7]],
    start: new Date(from.getTime() + span * i),
    end: new Date(from.getTime() + span * (i + 1)),
  }));
}

/**
 * Split the day (sunrise → sunset) and the night (sunset → next sunrise) into
 * eight equal choghadiya each, labelled by the weekday's traditional sequence.
 */
export function computeChoghadiya(date: CalendarDay, city: City): ChoghadiyaDay {
  const observer = new Observer(city.lat, city.lon, 0);
  const localMidnight = zonedToUtc(date.year, date.month, date.day, 0, 0, city.tz);
  const next = addDays(date, 1);
  const nextMidnight = zonedToUtc(next.year, next.month, next.day, 0, 0, city.tz);

  const sunriseT = SearchRiseSet(Body.Sun, observer, +1, localMidnight, 2);
  const sunrise = sunriseT ? sunriseT.date : null;
  const sunsetT = sunrise ? SearchRiseSet(Body.Sun, observer, -1, sunrise, 2) : null;
  const sunset = sunsetT ? sunsetT.date : null;
  const nextSunriseT = SearchRiseSet(Body.Sun, observer, +1, nextMidnight, 2);
  const nextSunrise = nextSunriseT ? nextSunriseT.date : null;

  const w = weekdayIndex(date);
  return {
    date,
    sunrise,
    sunset,
    nextSunrise,
    day: sunrise && sunset ? build(sunrise, sunset, DAY_CYCLE, DAY_START[w], "day") : [],
    night:
      sunset && nextSunrise ? build(sunset, nextSunrise, NIGHT_CYCLE, NIGHT_START[w], "night") : [],
  };
}
