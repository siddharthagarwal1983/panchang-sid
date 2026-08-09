import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { AppHeader } from "@/components/AppHeader";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { trackAuthFunnel } from "@/lib/analytics/auth-funnel";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({
    next: typeof s.next === "string" ? s.next : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — Panchanga" },
      {
        name: "description",
        content:
          "Sign in with Google or email to sync your city, reminders and festival preferences across devices.",
      },
      { property: "og:title", content: "Sign in — Panchanga" },
      {
        property: "og:description",
        content:
          "Sign in with Google or email to sync your city, vrat reminders and festival preferences across every device you use.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      // Account-only utility page: no unique content for search results.
      { name: "robots", content: "noindex, follow" },
    ],
    links: [{ rel: "canonical", href: "https://indianpanchang.com/auth" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { next } = Route.useSearch();
  // Only same-origin relative paths may be used as a post-auth return target.
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
  const returnUrl =
    typeof window !== "undefined"
      ? safeNext
        ? `${window.location.origin}${safeNext}`
        : window.location.origin
      : "";
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Funnel: someone reached the sign-in screen. If they leave it without a
  // session, that visit is recorded as an abandoned sign-in.
  const signedInRef = useRef(false);
  signedInRef.current = Boolean(session);

  useEffect(() => {
    trackAuthFunnel("sign_in_page_viewed");
    let reported = false;
    const abandon = () => {
      if (signedInRef.current || reported) return;
      reported = true;
      trackAuthFunnel("sign_in_abandoned");
    };
    const onHide = () => abandon();
    window.addEventListener("pagehide", onHide);
    return () => {
      window.removeEventListener("pagehide", onHide);
      abandon();
    };
  }, []);

  useEffect(() => {
    if (!session) return;
    trackAuthFunnel("sign_in_completed");
    // Return to the page that triggered the sign-in, without leaving /auth on
    // the back stack.
    navigate({ to: safeNext ?? "/settings", replace: true });
  }, [session, navigate, safeNext]);

  const withGoogle = async () => {
    setError(null);
    setBusy(true);
    trackAuthFunnel("sign_in_attempted", { method: "google" });
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: returnUrl,
    });
    if (result.error) {
      setError(result.error.message ?? "Google sign-in failed.");
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    setBusy(false);
  };

  const withEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setBusy(true);
    if (mode === "signup") {
      trackAuthFunnel("sign_in_attempted", { method: "email_signup" });
      const { error: err } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: returnUrl,
          data: name ? { display_name: name } : undefined,
        },
      });
      if (err) setError(err.message);
      else setMessage("Check your inbox to confirm your email, then sign in.");
    } else {
      trackAuthFunnel("sign_in_attempted", { method: "email_password" });
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) setError(err.message);
    }
    setBusy(false);
  };

  return (
    <main className="mx-auto max-w-md">
      <AppHeader title="Your account" subtitle="Sync settings and reminders" />

      <div className="space-y-4 px-5 py-5">
        <section className="panel px-5 py-5">
          <button
            onClick={withGoogle}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm transition-colors hover:bg-secondary disabled:opacity-60"
          >
            <GoogleMark />
            Continue with Google
          </button>

          <div className="my-5 flex items-center gap-3">
            <span className="hairline flex-1" />
            <span className="label-caps">or</span>
            <span className="hairline flex-1" />
          </div>

          <form onSubmit={withEmail} className="space-y-3">
            {mode === "signup" && (
              <Field
                label="Name"
                type="text"
                value={name}
                onChange={setName}
                placeholder="Your name"
              />
            )}
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
              required
            />
            <Field
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="At least 6 characters"
              required
            />
            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {busy && <LoaderCircle className="size-4 animate-spin" />}
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          {error && <p className="mt-3 text-xs text-lotus">{error}</p>}
          {message && <p className="mt-3 text-xs text-muted-foreground">{message}</p>}

          <button
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
              setMessage(null);
            }}
            className="mt-4 w-full text-center text-xs text-primary underline-offset-4 hover:underline"
          >
            {mode === "signin"
              ? "New here? Create an account"
              : "Already have an account? Sign in"}
          </button>
        </section>

        <p className="px-1 text-center text-xs leading-relaxed text-muted-foreground">
          Signing in is optional. Without an account everything still works — your settings just stay
          on this device.
        </p>
      </div>
    </main>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="label-caps">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-xl border border-border bg-transparent px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
      />
    </label>
  );
}

function GoogleMark() {
  return (
    <svg className="size-4" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.1 17.7 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.1 24.6c0-1.6-.1-3.2-.4-4.6H24v9h12.4c-.5 2.9-2.1 5.3-4.6 7l7.1 5.5c4.2-3.8 6.6-9.5 6.6-16.9z"
      />
      <path
        fill="#FBBC05"
        d="M10.4 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.8-6.1C1 16.4 0 20.1 0 24s1 7.6 2.6 10.8l7.8-6.1z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.1-5.5c-2 1.4-4.6 2.2-8.8 2.2-6.3 0-11.7-3.6-13.6-8.9l-7.8 6.1C6.5 42.6 14.6 48 24 48z"
      />
    </svg>
  );
}