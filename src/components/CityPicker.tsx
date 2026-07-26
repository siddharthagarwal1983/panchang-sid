import { Check, MapPin, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { CITIES } from "@/lib/panchang/cities";
import { usePrefs } from "@/lib/prefs";

export function CityPicker({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { prefs, setPrefs } = usePrefs();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CITIES;
    return CITIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.state.toLowerCase().includes(q),
    );
  }, [query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        aria-label="Close city picker"
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative flex max-h-[82vh] flex-col rounded-t-3xl border border-border bg-popover pb-[env(safe-area-inset-bottom)] shadow-2xl">
        <div className="flex items-center justify-between px-5 pt-4">
          <h2 className="font-display text-lg">Choose your city</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="px-5 pt-3">
          <div className="flex items-center gap-2 rounded-xl border border-input bg-secondary/50 px-3">
            <Search className="size-4 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search US cities"
              className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>
        <ul className="mt-3 flex-1 overflow-y-auto px-3 pb-4">
          {results.map((c) => {
            const active = c.id === prefs.cityId;
            return (
              <li key={c.id}>
                <button
                  onClick={() => {
                    setPrefs({ cityId: c.id });
                    onClose();
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-secondary"
                >
                  <MapPin
                    className={`size-4 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`}
                  />
                  <span className="flex-1">
                    <span className="block text-sm">{c.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {c.state} · {c.tz.split("/").pop()?.replace(/_/g, " ")}
                    </span>
                  </span>
                  {active && <Check className="size-4 text-primary" />}
                </button>
              </li>
            );
          })}
          {results.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-muted-foreground">
              No matching city. Pick the closest metro.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}