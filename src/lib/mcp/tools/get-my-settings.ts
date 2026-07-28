import { defineTool } from "@lovable.dev/mcp-js";

import { loadPrefs, notAuthenticated, resolveCity } from "../shared";

export default defineTool({
  name: "get_my_settings",
  title: "Get my panchang settings",
  description:
    "Read the signed-in user's saved Panchanga settings: active location, family location, calendar tradition and which reminders are switched on.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const prefs = await loadPrefs(ctx);
    const city = await resolveCity({}, ctx);

    const result = {
      email: ctx.getUserEmail() ?? null,
      active_location: {
        which: prefs.activeLocation ?? "mine",
        name: city.name,
        timezone: city.tz,
        latitude: city.lat,
        longitude: city.lon,
      },
      family_location: prefs.familyPlace
        ? { name: prefs.familyPlace.name, timezone: prefs.familyPlace.tz }
        : null,
      tradition: prefs.tradition ?? "amanta",
      reminder_time: prefs.reminderTime ?? null,
      reminders: prefs.reminders ?? {},
    };

    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      structuredContent: result,
    };
  },
});