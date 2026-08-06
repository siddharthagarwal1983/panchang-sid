import { supabase } from "@/integrations/supabase/client";

export type AuthFunnelEvent =
  | "sign_in_cta_clicked"
  | "sign_in_page_viewed"
  | "sign_in_attempted"
  | "sign_in_completed"
  | "sign_in_abandoned";

const VISITOR_KEY = "panchanga.visitor";

/** Stable anonymous id so a click and its outcome can be joined without any PII. */
export function visitorKey(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let id = window.localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return "anonymous";
  }
}

/**
 * Fire-and-forget funnel event. Never throws and never blocks the UI — analytics
 * must not be able to break a sign-in attempt.
 */
export function trackAuthFunnel(
  event: AuthFunnelEvent,
  opts: { method?: string; source?: string } = {},
): void {
  if (typeof window === "undefined") return;
  void supabase
    .from("auth_funnel_events")
    .insert({
      event,
      method: opts.method ?? null,
      source: opts.source ?? null,
      visitor_key: visitorKey(),
    })
    .then(
      () => undefined,
      () => undefined,
    );
}
