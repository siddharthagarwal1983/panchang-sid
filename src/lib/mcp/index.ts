import { auth, defineMcp } from "@lovable.dev/mcp-js";

import getMySettingsTool from "./tools/get-my-settings";
import getPanchangTool from "./tools/get-panchang";
import listFestivalsTool from "./tools/list-festivals";

// The OAuth issuer must be the direct Supabase host; the project ref is the only
// value that survives publish unchanged.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "panchanga-mcp",
  title: "Panchāṅga",
  version: "0.1.0",
  instructions:
    "Tools for Panchāṅga, a Hindu almanac app for any timezone. Use `get_panchang` for the tithi, nakshatra, yoga, karana, sunrise/sunset and muhurtas of a date, `list_festivals` for upcoming festival and vrat dates, and `get_my_settings` to read the signed-in user's saved location and reminder preferences. All timings are computed at the local sunrise of the given place, not India time.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [getPanchangTool, listFestivalsTool, getMySettingsTool],
});