CREATE TABLE public.auth_funnel_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event text NOT NULL CHECK (event IN ('sign_in_cta_clicked','sign_in_page_viewed','sign_in_attempted','sign_in_completed','sign_in_abandoned')),
  method text,
  source text,
  visitor_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX auth_funnel_events_event_created_idx ON public.auth_funnel_events (event, created_at DESC);
CREATE INDEX auth_funnel_events_visitor_idx ON public.auth_funnel_events (visitor_key, created_at DESC);

GRANT INSERT ON public.auth_funnel_events TO anon;
GRANT INSERT ON public.auth_funnel_events TO authenticated;
GRANT ALL ON public.auth_funnel_events TO service_role;

ALTER TABLE public.auth_funnel_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record a sign-in funnel event"
  ON public.auth_funnel_events FOR INSERT TO anon, authenticated
  WITH CHECK (true);