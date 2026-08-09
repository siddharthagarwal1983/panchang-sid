/**
 * Lazily loads the generated Supabase browser client.
 *
 * The client pulls in auth/realtime/postgrest/storage (~200 KB) which is not
 * needed to paint the first screen, so every caller that runs after hydration
 * imports it through here to keep it out of the critical bundle.
 */
export type SupabaseClientModule = typeof import("./client");

let cached: Promise<SupabaseClientModule["supabase"]> | null = null;

export function getSupabase() {
  cached ??= import("./client").then((m) => m.supabase);
  return cached;
}
