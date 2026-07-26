import { Link, useLocation } from "@tanstack/react-router";
import { UserRound } from "lucide-react";

import { useAuth } from "@/lib/auth";

export function AppHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const { user, profile } = useAuth();
  const { pathname } = useLocation();
  const onAuthPage = pathname === "/auth";
  const initial = (profile?.display_name || user?.email || "?").trim().charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 px-5 pb-3 pt-[calc(env(safe-area-inset-top)+0.85rem)] backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate font-display text-xl leading-tight">{title}</h1>
          {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
        </div>

        {!onAuthPage &&
          (user ? (
            <Link
              to="/settings"
              aria-label="Your account"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary font-display text-sm text-primary-foreground"
            >
              {initial}
            </Link>
          ) : (
            <Link
              to="/auth"
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs transition-colors hover:bg-secondary"
            >
              <UserRound className="size-3.5" />
              Sign in
            </Link>
          ))}
      </div>
    </header>
  );
}