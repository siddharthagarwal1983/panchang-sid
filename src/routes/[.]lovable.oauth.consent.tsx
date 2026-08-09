import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";

import { getSupabase } from "@/integrations/supabase/lazy";

type OAuthDetails = {
  client?: { name?: string; client_id?: string } | null;
  redirect_url?: string;
  redirect_to?: string;
  scope?: string;
  redirect_uri?: string;
};

type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: OAuthDetails | null; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: OAuthDetails | null; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: OAuthDetails | null; error: { message: string } | null }>;
};

// Loaded on demand: beforeLoad/loader are part of the critical bundle, so a
// static Supabase import here would ship the auth client to every route.
const oauth = async () => {
  const supabase = await getSupabase();
  return (supabase.auth as unknown as { oauth: OAuthApi }).oauth;
};

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const supabase = await getSupabase();
    const { data } = await supabase.auth.getSession();
    const next = location.pathname + location.searchStr;
    if (!data.session) throw redirect({ to: "/auth", search: { next } });
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await (await oauth()).getAuthorizationDetails(authorizationId);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="mx-auto max-w-md px-5 py-10">
      <h1 className="text-lg font-semibold text-foreground">Could not load this request</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {String((error as Error)?.message ?? error)}
      </p>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientName = details?.client?.name ?? "an app";
  const scopes = (details?.scope ?? "").split(/\s+/).filter(Boolean);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error: err } = approve
      ? await (await oauth()).approveAuthorization(authorization_id)
      : await (await oauth()).denyAuthorization(authorization_id);
    if (err) {
      setBusy(false);
      setError(err.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  return (
    <main className="mx-auto max-w-md px-5 py-10">
      <section className="panel px-5 py-6">
        <h1 className="text-lg font-semibold text-foreground">
          Connect {clientName} to Panchāṅga
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {clientName} will be able to call Panchāṅga&apos;s tools while you are signed in —
          reading panchang, festival dates and your saved location and reminder settings.
        </p>
        {details?.redirect_uri && (
          <p className="mt-3 break-all text-xs text-muted-foreground">
            Redirects to {details.redirect_uri}
          </p>
        )}
        {scopes.length > 0 && (
          <ul className="mt-4 space-y-1 text-sm text-foreground">
            {scopes.map((s: string) => (
              <li key={s}>
                {s === "openid" || s === "profile"
                  ? "Share your basic profile"
                  : s === "email"
                    ? "Share your email address"
                    : `Additional permission requested: ${s}`}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          This does not bypass this app&apos;s permissions or backend policies.
        </p>
        {error && (
          <p role="alert" className="mt-3 text-xs text-lotus">
            {error}
          </p>
        )}
        <div className="mt-6 flex gap-2">
          <button
            disabled={busy}
            onClick={() => decide(true)}
            className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            Approve
          </button>
          <button
            disabled={busy}
            onClick={() => decide(false)}
            className="flex-1 rounded-xl border border-border px-4 py-3 text-sm transition-colors hover:bg-secondary disabled:opacity-60"
          >
            Cancel connection
          </button>
        </div>
      </section>
    </main>
  );
}