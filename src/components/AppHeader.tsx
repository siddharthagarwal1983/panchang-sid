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
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 px-5 pb-3 pt-[calc(env(safe-area-inset-top)+0.85rem)] backdrop-blur">
      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate font-display text-xl leading-tight">{title}</h1>
          {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
        </div>

        <div className="flex shrink-0 items-center gap-2">
        {showLocation && (
          <button
            onClick={() => setPickerOpen(true)}
            aria-label="Change location"
            className="flex size-9 items-center justify-center rounded-full border border-border text-primary transition-colors hover:bg-secondary"
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
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs transition-colors hover:bg-secondary"
            >
              <UserRound className="size-3.5" />
              Sign in
            </Link>
          ))}
        </div>
        </div>
        {showLocation && (
          <button
            onClick={() => setPickerOpen(true)}
            className="mt-2 flex w-full items-center gap-1.5 text-left text-xs text-muted-foreground"
          >
            <MapPin className="size-3.5 shrink-0 text-primary" />
            <span className="truncate">
              Calculating for{" "}
              <span className="text-foreground">
                {city.name}, {city.state}
              </span>{" "}
              <span className="text-muted-foreground">· {tzLabel(city.tz)}</span>
            </span>
          </button>
        )}
        {children}
      </div>
      {showLocation && <LocationPicker open={pickerOpen} onClose={() => setPickerOpen(false)} />}
    </header>
  );
}