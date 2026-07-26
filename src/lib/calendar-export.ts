/**
 * One-click export of a festival / vrat to Google, Apple (.ics) or Outlook.
 * All helpers work off real UTC instants, so the event lands at the correct
 * local time whatever calendar the user keeps.
 */

export type CalendarEvent = {
  title: string;
  description?: string;
  location?: string;
  /** Timed event. When omitted, `day` is used for an all-day entry. */
  start?: Date | null;
  end?: Date | null;
  /** All-day fallback, as a civil date. */
  day?: { year: number; month: number; day: number };
};

const pad = (n: number) => String(n).padStart(2, "0");

function utcStamp(d: Date): string {
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

function dayStamp(day: NonNullable<CalendarEvent["day"]>, offset = 0): string {
  const dt = new Date(Date.UTC(day.year, day.month - 1, day.day + offset));
  return `${dt.getUTCFullYear()}${pad(dt.getUTCMonth() + 1)}${pad(dt.getUTCDate())}`;
}

function toDayParts(d: Date) {
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
}

function range(event: CalendarEvent): { start: string; end: string; allDay: boolean } {
  if (event.start) {
    const end = event.end ?? new Date(event.start.getTime() + 60 * 60 * 1000);
    return { start: utcStamp(event.start), end: utcStamp(end), allDay: false };
  }
  const day = event.day ?? toDayParts(new Date());
  return { start: dayStamp(day), end: dayStamp(day, 1), allDay: true };
}

function allDayBounds(event: CalendarEvent) {
  const day = event.day ?? toDayParts(new Date());
  return {
    start: new Date(Date.UTC(day.year, day.month - 1, day.day)),
    end: new Date(Date.UTC(day.year, day.month - 1, day.day + 1)),
  };
}

export function googleCalendarUrl(event: CalendarEvent): string {
  const { start, end } = range(event);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${start}/${end}`,
  });
  if (event.description) params.set("details", event.description);
  if (event.location) params.set("location", event.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function outlookCalendarUrl(event: CalendarEvent): string {
  const bounds = allDayBounds(event);
  const startDate = event.start ?? bounds.start;
  const endDate = event.start
    ? (event.end ?? new Date(event.start.getTime() + 60 * 60 * 1000))
    : bounds.end;
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: event.title,
    startdt: startDate.toISOString(),
    enddt: endDate.toISOString(),
  });
  if (event.description) params.set("body", event.description);
  if (event.location) params.set("location", event.location);
  if (!event.start) params.set("allday", "true");
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

function escapeIcs(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export function buildIcs(event: CalendarEvent): string {
  const { start, end, allDay } = range(event);
  const uid = `${start}-${Math.random().toString(36).slice(2, 10)}@panchanga`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Panchanga//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${utcStamp(new Date())}`,
    allDay ? `DTSTART;VALUE=DATE:${start}` : `DTSTART:${start}`,
    allDay ? `DTEND;VALUE=DATE:${end}` : `DTEND:${end}`,
    `SUMMARY:${escapeIcs(event.title)}`,
  ];
  if (event.description) lines.push(`DESCRIPTION:${escapeIcs(event.description)}`);
  if (event.location) lines.push(`LOCATION:${escapeIcs(event.location)}`);
  lines.push("BEGIN:VALARM", "TRIGGER:-PT12H", "ACTION:DISPLAY", "DESCRIPTION:Reminder", "END:VALARM");
  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n");
}

/** Apple Calendar and everything else: download a standard .ics file. */
export function downloadIcs(event: CalendarEvent): void {
  const blob = new Blob([buildIcs(event)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${event.title.replace(/[^\w]+/g, "-").toLowerCase() || "event"}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
