import { Link, useRouterState } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import type { ReactNode } from "react";

import { useAuth } from "@/lib/auth";

type Props = {
  /** Path to return to after signing in. Defaults to the current URL. */
  next?: string;
  title: string;
  description: string;
  /** Number of shimmer rows shown while the session is resolving. */
  skeletonRows?: number;
  children: ReactNode;
};

/**
 * Renders `children` only once a session exists. Protected UI is never mounted
 * for signed-out visitors, so it can safely assume a user.
 */
export function SignInGate({ next, title, description, skeletonRows = 3, children }: Props) {
  const { user, loading } = useAuth();
  const here = useRouterState({
    select: (s) => `${s.location.pathname}${s.location.searchStr ?? ""}`,
  });
  const target = next ?? here;

  if (loading) {
    return (
      <section aria-busy="true" aria-live="polite" className="space-y-2">
        <span className="sr-only">Checking your session…</span>
        <div className="h-3 w-32 animate-pulse rounded-full bg-secondary" aria-hidden />
        {Array.from({ length: skeletonRows }).map((_, i) => (
          <div
            key={i}
            aria-hidden
            className="panel flex items-center gap-3 px-4 py-3.5"
            style={{ animationDelay: `${i * 90}ms` }}
          >
            <div className="size-9 shrink-0 animate-pulse rounded-full bg-secondary" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3 w-2/3 animate-pulse rounded-full bg-secondary" />
              <div className="h-2.5 w-1/3 animate-pulse rounded-full bg-secondary/70" />
            </div>
          </div>
        ))}
      </section>
    );
  }

  if (!user) {
    return (
      <section className="panel px-5 py-6 text-center">
        <Lock className="mx-auto size-5 text-primary" />
        <h3 className="mt-2 font-display text-base">{title}</h3>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
        <Link
          to="/auth"
          search={{ next: target }}
          className="mt-4 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm text-primary-foreground transition-opacity hover:opacity-90"
        >
          Sign in
        </Link>
      </section>
    );
  }

  return <>{children}</>;
}