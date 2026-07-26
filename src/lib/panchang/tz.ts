/** Timezone helpers that work with IANA zone names, no external deps. */

/** Milliseconds to add to a UTC instant to obtain wall-clock time in `tz`. */
export function tzOffsetMs(date: Date, tz: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? "0");
  let hour = get("hour");
  if (hour === 24) hour = 0;
  const asUTC = Date.UTC(get("year"), get("month") - 1, get("day"), hour, get("minute"), get("second"));
  return asUTC - Math.floor(date.getTime() / 1000) * 1000;
}

/** Convert a wall-clock date/time in `tz` into a real UTC instant. */
export function zonedToUtc(
  y: number,
  m: number,
  d: number,
  hour = 0,
  minute = 0,
  tz = "UTC",
): Date {
  const guess = Date.UTC(y, m - 1, d, hour, minute, 0);
  const off1 = tzOffsetMs(new Date(guess), tz);
  let result = guess - off1;
  const off2 = tzOffsetMs(new Date(result), tz);
  if (off2 !== off1) result = guess - off2;
  return new Date(result);
}

export type CalendarDay = { year: number; month: number; day: number };

/** The civil calendar date that a UTC instant falls on inside `tz`. */
export function toCalendarDay(date: Date, tz: string): CalendarDay {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  const [year, month, day] = parts.split("-").map(Number);
  return { year, month, day };
}

export function dayKey(d: CalendarDay): string {
  return `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
}

export function addDays(d: CalendarDay, n: number): CalendarDay {
  const dt = new Date(Date.UTC(d.year, d.month - 1, d.day));
  dt.setUTCDate(dt.getUTCDate() + n);
  return { year: dt.getUTCFullYear(), month: dt.getUTCMonth() + 1, day: dt.getUTCDate() };
}

export function formatTime(date: Date | null, tz: string, hour12: boolean): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
    hour12,
  }).format(date);
}

export function formatTimeWithDay(
  date: Date | null,
  tz: string,
  hour12: boolean,
  reference: CalendarDay,
): string {
  if (!date) return "—";
  const base = formatTime(date, tz, hour12);
  const on = toCalendarDay(date, tz);
  if (dayKey(on) === dayKey(reference)) return base;
  const label = new Intl.DateTimeFormat("en-US", { timeZone: tz, month: "short", day: "numeric" }).format(
    date,
  );
  return `${base}, ${label}`;
}

export function formatLongDate(d: CalendarDay): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(Date.UTC(d.year, d.month - 1, d.day)));
}

/** Short zone abbreviation for an instant, e.g. "EDT", "IST". */
export function tzAbbr(date: Date, tz: string): string {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "short" }).formatToParts(
    date,
  );
  return parts.find((p) => p.type === "timeZoneName")?.value ?? "";
}

export function weekdayIndex(d: CalendarDay): number {
  return new Date(Date.UTC(d.year, d.month - 1, d.day)).getUTCDay();
}