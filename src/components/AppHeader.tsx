import { Link, useLocation } from "@tanstack/react-router";
import { MapPin, UserRound } from "lucide-react";
import { useState } from "react";

import { LocationPicker } from "@/components/LocationPicker";
import { useAuth } from "@/lib/auth";
import { tzLabel } from "@/lib/panchang/cities";
import { usePrefs } from "@/lib/prefs";

export function AppHeader({
  title,
  subtitle,
  showLocation = false,
  children,
}: {
  title: string;
  subtitle?: string;
  showLocation?: boolean;
  children?: React.ReactNode;
}) {
  const { user, profile } = useAuth();
  const { city } = usePrefs();
  const { pathname } = useLocation();
  const [pickerOpen, setPickerOpen] = useState(false);
  const onAuthPage = pathname === "/auth";
  const initial = (profile?.display_name || user?.email || "?").trim().charAt(0).toUpperCase();

  return (
    <header
      data-testid="app-header"
      className="sticky top-0 z-30 border-b border-border bg-background/90 pb-3 pt-[calc(var(--sa-top)+0.85rem)] backdrop-blur landscape:pt-[calc(var(--sa-top)+0.55rem)]"
      style={{
        paddingLeft: "max(1rem, var(--sa-left))",
        paddingRight: "max(1rem, var(--sa-right))",
      }}
    >
      <div className="mx-auto max-w-md">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-2 sm:gap-3">
          <div className="min-w-0">
            <h1
              data-testid="app-header-title"
              className="truncate font-display text-xl leading-[1.45] tracking-tight min-[360px]:text-2xl"
            >
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 truncate text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1.5 self-center sm:gap-2">
            {showLocation && (
              <button
                onClick={() => setPickerOpen(true)}
                aria-label="Change location"
                className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-primary transition-colors hover:bg-secondary"
              >
                <MapPin className="size-4" />
              </button>
            )}
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
                  aria-label="Sign in"
                  className="flex size-9 shrink-0 items-center justify-center gap-1.5 rounded-full border border-border text-[11px] font-semibold uppercase tracking-wider transition-colors hover:bg-secondary min-[360px]:size-auto min-[360px]:px-3 min-[360px]:py-1.5"
                >
                  <UserRound className="size-3.5" />
                  <span className="hidden min-[360px]:inline">Sign in</span>
                </Link>
              ))}
          </div>
        </div>
        {showLocation && (
          <button
            onClick={() => setPickerOpen(true)}
            className="mt-2.5 flex w-full min-w-0 items-center gap-1.5 text-left"
          >
            <MapPin className="size-3.5 shrink-0 text-primary" />
            <span className="flex min-w-0 items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span className="truncate text-foreground">
                {city.name}, {city.state}
              </span>
              <span className="h-3 w-px shrink-0 bg-border" />
              <span className="shrink-0">{tzLabel(city.tz)}</span>
            </span>
          </button>
        )}
        {children}
      </div>
      {showLocation && <LocationPicker open={pickerOpen} onClose={() => setPickerOpen(false)} />}
    </header>
  );
}