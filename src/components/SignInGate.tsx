import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import type { ReactNode } from "react";

import { useAuth } from "@/lib/auth";

type Props = {
  /** Path to return to after signing in. */
  next: string;
  title: string;
  description: string;
  children: ReactNode;
};

/**
 * Renders `children` only once a session exists. Protected UI is never mounted
 * for signed-out visitors, so it can safely assume a user.
 */
export function SignInGate({ next, title, description, children }: Props) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="panel h-28 animate-pulse opacity-50" aria-hidden />;
  }

  if (!user) {
    return (
      <section className="panel px-5 py-6 text-center">
        <Lock className="mx-auto size-5 text-primary" />
        <h3 className="mt-2 font-display text-base">{title}</h3>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
        <Link
          to="/auth"
          search={{ next }}
          className="mt-4 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm text-primary-foreground transition-opacity hover:opacity-90"
        >
          Sign in
        </Link>
      </section>
    );
  }

  return <>{children}</>;
}