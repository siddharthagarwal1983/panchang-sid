import { createClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { findCity, type City } from "@/lib/panchang/cities";
import { toCalendarDay, type CalendarDay } from "@/lib/panchang/tz";

/** Optional explicit location accepted by every panchang tool. */
export const locationSchema = {
  latitude: z.number().min(-90).max(90).optional().describe("Latitude of the place. Omit to use the location saved in the user's account."),
  longitude: z.number().min(-180).max(180).optional().describe("Longitude of the place."),
  timezone: z.string().optional().describe("IANA timezone of the place, e.g. America/New_York."),
  place_name: z.string().optional().describe("Display name for the place, e.g. Edison, NJ."),
};

export type LocationInput = {
  latitude?: number;
  longitude?: number;
  timezone?: string;
  place_name?: string;
};

/** A Supabase client acting as the signed-in MCP caller, so RLS applies as them. */
export function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

type StoredPrefs = {
  cityId?: string;
  place?: City | null;
  familyPlace?: City | null;
  activeLocation?: "mine" | "family";
  hour12?: boolean;
  tradition?: "amanta" | "purnimanta";
  reminderTime?: string;
  reminders?: Record<string, boolean>;
};

export async function loadPrefs(ctx: ToolContext): Promise<StoredPrefs> {
  const { data } = await supabaseForUser(ctx)
    .from("user_settings")
    .select("prefs")
    .eq("user_id", ctx.getUserId())
    .maybeSingle();
  return ((data?.prefs ?? {}) as StoredPrefs) ?? {};
}

function isPlace(value: unknown): value is City {
  const p = value as City | null;
  return !!p && typeof p.lat === "number" && typeof p.lon === "number" && typeof p.tz === "string";
}

/** Explicit coordinates win; otherwise fall back to the user's saved location. */
export async function resolveCity(input: LocationInput, ctx: ToolContext): Promise<City> {
  if (
    typeof input.latitude === "number" &&
    typeof input.longitude === "number" &&
    input.timezone
  ) {
    return {
      id: "custom",
      name: input.place_name || `${input.latitude.toFixed(2)}, ${input.longitude.toFixed(2)}`,
      state: "",
      lat: input.latitude,
      lon: input.longitude,
      tz: input.timezone,
    };
  }

  const prefs = await loadPrefs(ctx);
  const preferred = prefs.activeLocation === "family" ? prefs.familyPlace : prefs.place;
  if (isPlace(preferred)) return preferred;
  if (isPlace(prefs.place)) return prefs.place;
  return findCity(prefs.cityId);
}

/** Parse a YYYY-MM-DD string, or today in the given timezone when omitted. */
export function resolveDate(date: string | undefined, tz: string): CalendarDay {
  if (!date) return toCalendarDay(new Date(), tz);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
  if (!m) throw new Error("date must be in YYYY-MM-DD format");
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
}

export function isoTime(value: Date | null, tz: string): string | null {
  if (!value) return null;
  return value.toLocaleString("en-US", { timeZone: tz, dateStyle: "medium", timeStyle: "short" });
}

export function notAuthenticated() {
  return {
    content: [{ type: "text" as const, text: "Not authenticated. Sign in to this app first." }],
    isError: true,
  };
}