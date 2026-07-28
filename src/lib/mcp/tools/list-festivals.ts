import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { scanFestivals } from "@/lib/panchang/festivals";
import { FESTIVAL_DETAILS } from "@/lib/panchang/festivalDetails";

import { locationSchema, notAuthenticated, resolveCity, resolveDate } from "../shared";

export default defineTool({
  name: "list_festivals",
  title: "List upcoming festivals",
  description:
    "List Hindu festivals and vrat days over a date range, with dates recalculated for the local sunrise of a place instead of India time. Defaults to the next 120 days from today at the user's saved location.",
  inputSchema: {
    start_date: z.string().optional().describe("First date of the range as YYYY-MM-DD. Defaults to today."),
    days: z.number().int().optional().describe("How many days to scan, 1-400. Defaults to 120."),
    major_only: z.boolean().optional().describe("Only return major festivals, excluding recurring ekadashi/pradosh/moon days. Defaults to true."),
    ...locationSchema,
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const city = await resolveCity(input, ctx);
    const start = resolveDate(input.start_date, city.tz);
    const days = Math.min(Math.max(input.days ?? 120, 1), 400);
    const majorOnly = input.major_only ?? true;

    const items = scanFestivals(start, days, city)
      .flatMap((entry) =>
        entry.festivals
          .filter((f) => (majorOnly ? f.category === "major" || f.category === "solar" : true))
          .map((f) => ({
            date: `${entry.date.year}-${String(entry.date.month).padStart(2, "0")}-${String(entry.date.day).padStart(2, "0")}`,
            id: f.id,
            name: f.name,
            note: f.note,
            category: f.category,
            significance: FESTIVAL_DETAILS[f.id]?.significance ?? null,
          })),
      );

    const result = {
      location: { name: city.name, timezone: city.tz },
      range: { start_date: `${start.year}-${String(start.month).padStart(2, "0")}-${String(start.day).padStart(2, "0")}`, days },
      count: items.length,
      festivals: items,
    };

    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      structuredContent: result,
    };
  },
});