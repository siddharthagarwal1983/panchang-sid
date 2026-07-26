import { Link, useLocation } from "@tanstack/react-router";
import { Home, MapPin, Pencil, UserRound } from "lucide-react";
import { useState } from "react";

import { LocationPicker } from "@/components/LocationPicker";
import { ScriptToggle } from "@/components/ScriptToggle";
import { useAuth } from "@/lib/auth";
import { tzLabel } from "@/lib/panchang/cities";
import { usePrefs } from "@/lib/prefs";

export function AppHeader({
  title,
  subtitle,
  showLocation = false,
  showScript = false,
  children,
}: {
  title: string;
  subtitle?: string;
  showLocation?: boolean;
  showScript?: boolean;
  children?: React.ReactNode;
}) {
  const { user, profile } = useAuth();
  const { city, prefs, familyPlace, setActiveLocation } = usePrefs();
  const { pathname } = useLocation();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<"mine" | "family">("mine");
  const onAuthPage = pathname === "/auth";
  const isFamily = prefs.activeLocation === "family";
  const openPicker = (target: "mine" | "family") => {
    setPickerTarget(target);
    setPickerOpen(true);
  };
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
                onClick={() => openPicker(isFamily ? "family" : "mine")}
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
                  className="flex h-9 w-9 shrink-0 items-center justify-center gap-1.5 rounded-full border border-border text-[11px] font-semibold uppercase tracking-wider transition-colors hover:bg-secondary min-[360px]:w-auto min-[360px]:px-3"
                >
                  <UserRound className="size-3.5" />
                  <span className="hidden min-[360px]:inline">Sign in</span>
                </Link>
              ))}
          </div>
        </div>
        {showLocation && (
          <>
          <button
            onClick={() => openPicker(isFamily ? "family" : "mine")}
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
          <div className="mt-2.5 flex items-center gap-1 rounded-full border border-border bg-secondary/40 p-1">
            <button
              onClick={() => setActiveLocation("mine")}
              aria-pressed={!isFamily}
              className={`flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                !isFamily ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              <MapPin className="size-3.5 shrink-0" />
              <span className="truncate">My location</span>
            </button>
            <button
              onClick={() => setActiveLocation("family")}
              aria-pressed={isFamily}
              className={`flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                isFamily ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              <Home className="size-3.5 shrink-0" />
              <span className="truncate">{familyPlace.name}</span>
            </button>
            <button
              onClick={() => openPicker("family")}
              aria-label="Change family location"
              className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary"
            >
              <Pencil className="size-3.5" />
            </button>
          </div>
          </>
        )}
        {showScript && <ScriptToggle className="mt-2" />}
        {children}
      </div>
      {showLocation && (
        <LocationPicker
          open={pickerOpen}
          target={pickerTarget}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </header>
  );
}