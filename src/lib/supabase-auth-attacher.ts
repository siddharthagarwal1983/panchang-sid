import { createMiddleware } from "@tanstack/react-start";

import { getSupabase } from "@/integrations/supabase/lazy";

/**
 * Same contract as the generated `attachSupabaseAuth`, but the Supabase client
 * is imported on demand so the auth/realtime bundle stays out of the app's
 * startup chunk. Server functions still get the bearer token.
 */
export const attachSupabaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    const supabase = await getSupabase();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return next({
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
);
