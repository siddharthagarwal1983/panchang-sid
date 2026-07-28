import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { computeDayPanchang } from "@/lib/panchang/core";
import { festivalsForSummary } from "@/lib/panchang/festivals";
import { computeDaySummary } from "@/lib/panchang/core";
import { addDays } from "@/lib/panchang/tz";

import { isoTime, locationSchema, notAuthenticated, resolveCity, resolveDate } from "../shared";

export default defineTool({
  name: "get_panchang",
  title: "Get panchang for a date",
  description:
    "Daily Hindu panchang — tithi, nakshatra, yoga, karana, sunrise/sunset, muhurtas and festivals — computed at local sunrise for a place. Defaults to today and the location saved in the signed-in user's account.",
  inputSchema: {
    date: z.string().optional().describe("Calendar date as YYYY-MM-DD. Defaults to today."),
    ...locationSchema,
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const city = await resolveCity(input, ctx);
    const day = resolveDate(input.date, city.tz);
    const p = computeDayPanchang(day, city);
    const previous = computeDaySummary(addDays(day, -1), city);
    const festivals = festivalsForSummary(computeDaySummary(day, city), previous);

    const result = {
      date: `${day.year}-${String(day.month).padStart(2, "0")}-${String(day.day).padStart(2, "0")}`,
      location: { name: city.name, timezone: city.tz, latitude: city.lat, longitude: city.lon },
      vaara: p.vaara,
      sunrise: isoTime(p.sunrise, city.tz),
      sunset: isoTime(p.sunset, city.tz),
      moonrise: isoTime(p.moonrise, city.tz),
      moonset: isoTime(p.moonset, city.tz),
      tithi: { name: p.tithi.name, paksha: p.tithi.paksha, ends: isoTime(p.tithi.end, city.tz) },
      nakshatra: { name: p.nakshatra.name, ends: isoTime(p.nakshatra.end, city.tz) },
      yoga: { name: p.yoga.name, ends: isoTime(p.yoga.end, city.tz) },
      karana: { name: p.karana.name, ends: isoTime(p.karana.end, city.tz) },
      lunar_month: { amanta: p.month.amanta, purnimanta: p.month.purnimanta },
      ritu: p.ritu,
      moon_rashi: p.moonRashi,
      sun_rashi: p.sunRashi,
      muhurtas: p.muhurtas.map((m) => ({
        name: m.name,
        kind: m.kind,
        start: isoTime(m.start, city.tz),
        end: isoTime(m.end, city.tz),
      })),
      festivals: festivals.map((f) => ({ id: f.id, name: f.name, note: f.note, category: f.category })),
    };

    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      structuredContent: result,
    };
  },
});