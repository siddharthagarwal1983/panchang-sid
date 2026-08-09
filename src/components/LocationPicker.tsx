import { Check, Clock, Crosshair, Globe2, LoaderCircle, MapPin, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { CITIES } from "@/lib/panchang/cities";
import { placeLabel, reverseGeocode, searchPlaces, type Place } from "@/lib/panchang/geocode";
import { matchRank, matchesQuery } from "@/lib/search/normalize";
import { usePrefs } from "@/lib/prefs";

type SearchState =
  | { kind: "idle" }
  | { kind: "searching" }
  | { kind: "done"; results: Place[] }
  | { kind: "error"; message: string };

const PRESETS: Place[] = CITIES.slice(0, 8);

export function LocationPicker({
  open,
  onClose,
  target = "mine",
}: {
  open: boolean;
  onClose: () => void;
  target?: "mine" | "family";
}) {
  const { city, prefs, setPlace } = usePrefs();
  const [query, setQuery] = useState("");
  const [state, setState] = useState<SearchState>({ kind: "idle" });
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [cursor, setCursor] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setState({ kind: "idle" });
      setGeoError(null);
      setLocating(false);
      setCursor(0);
    }
  }, [open]);

  // Debounced worldwide search.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setState({ kind: "idle" });
      return;
    }
    const controller = new AbortController();
    setState({ kind: "searching" });
    const id = window.setTimeout(() => {
      searchPlaces(q, controller.signal)
        .then((results) => setState({ kind: "done", results }))
        .catch((err: unknown) => {
          if (controller.signal.aborted) return;
          setState({
            kind: "error",
            message: err instanceof Error ? err.message : "Search failed",
          });
        });
    }, 300);
    return () => {
      controller.abort();
      window.clearTimeout(id);
    };
  }, [query]);

  const showingSearch = query.trim().length >= 2;

  const sections = useMemo(() => {
    if (showingSearch) {
      // Local, diacritic-insensitive matches over saved + preset places show
      // instantly and survive an offline/failed geocode. Typing "zurich"
      // matches "Zürich" and "bengaluru" matches "Bengalūru".
      const local = [...prefs.recentPlaces, ...PRESETS]
        .filter((p, i, arr) => arr.findIndex((o) => o.id === p.id) === i)
        .filter((p) => matchesQuery(placeLabel(p), query))
        .sort((a, b) => matchRank(placeLabel(a), query) - matchRank(placeLabel(b), query));
      const remote = (state.kind === "done" ? state.results : []).filter(
        (r) => !local.some((l) => l.id === r.id),
      );
      const list: { title: string; icon: React.ReactNode; items: Place[] }[] = [];
      if (local.length)
        list.push({ title: "Saved & popular", icon: <MapPin className="size-3.5" />, items: local });
      if (remote.length || !local.length)
        list.push({ title: "Results", icon: <Globe2 className="size-3.5" />, items: remote });
      return list;
    }
    const list: { title: string; icon: React.ReactNode; items: Place[] }[] = [];
    if (prefs.recentPlaces.length)
      list.push({
        title: "Recent",
        icon: <Clock className="size-3.5" />,
        items: prefs.recentPlaces,
      });
    list.push({
      title: "Popular",
      icon: <MapPin className="size-3.5" />,
      items: PRESETS.filter((p) => !prefs.recentPlaces.some((r) => r.id === p.id)),
    });
    return list;
  }, [showingSearch, state, prefs.recentPlaces, query]);

  const flat = useMemo(() => sections.flatMap((s) => s.items), [sections]);

  useEffect(() => setCursor(0), [query, state.kind]);

  const choose = useCallback(
    (place: Place) => {
      setPlace(place, target);
      onClose();
    },
    [setPlace, onClose, target],
  );

  const locate = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoError("This device can't share its location.");
      return;
    }
    setGeoError(null);
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void reverseGeocode(pos.coords.latitude, pos.coords.longitude).then((place) => {
          setLocating(false);
          choose(place);
        });
      },
      (err) => {
        setLocating(false);
        setGeoError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied — search for a place instead."
            : "Couldn't get your location — search for a place instead.",
        );
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 },
    );
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }
    if (!flat.length) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => {
        const next = e.key === "ArrowDown" ? c + 1 : c - 1;
        const wrapped = (next + flat.length) % flat.length;
        listRef.current
          ?.querySelector(`[data-index="${wrapped}"]`)
          ?.scrollIntoView({ block: "nearest" });
        return wrapped;
      });
    } else if (e.key === "Enter") {
      e.preventDefault();
      const place = flat[cursor];
      if (place) choose(place);
    }
  };

  if (!open || typeof document === "undefined") return null;

  let index = -1;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col justify-end" onKeyDown={onKeyDown}>
      <button
        aria-label="Close location picker"
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-label="Choose your location"
        className="relative flex max-h-[86vh] flex-col rounded-t-3xl border border-border bg-popover pb-[env(safe-area-inset-bottom)] shadow-2xl"
      >
        <div className="flex items-center justify-between px-5 pt-4">
          <h2 className="font-display text-lg">
            {target === "family" ? "Choose family location" : "Choose your location"}
          </h2>
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
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search any city worldwide"
              aria-label="Search any city worldwide"
              className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-muted-foreground"
            />
            {state.kind === "searching" && (
              <LoaderCircle className="size-4 shrink-0 animate-spin text-muted-foreground" />
            )}
            {query && state.kind !== "searching" && (
              <button
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-secondary"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          {target === "mine" && (
          <button
            onClick={locate}
            disabled={locating}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-3 py-2.5 text-sm text-primary transition-colors hover:bg-primary/20 disabled:opacity-60"
          >
            {locating ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Crosshair className="size-4" />
            )}
            Use my current location
          </button>
          )}
          {target === "mine" && !geoError && (
            <p className="mt-2 text-[11px] text-muted-foreground">
              Used only on this device to calculate sunrise and tithi for where you are —
              never stored or shared.
            </p>
          )}
          {geoError && <p className="mt-2 text-xs text-muted-foreground">{geoError}</p>}
          <p className="mt-2 hidden text-[11px] text-muted-foreground sm:block">
            Use ↑ ↓ to browse, Enter to select, Esc to close.
          </p>
        </div>

        <ul ref={listRef} className="mt-3 flex-1 overflow-y-auto px-3 pb-4">
          {sections.map((section) =>
            section.items.length ? (
              <li key={section.title}>
                <p className="flex items-center gap-1.5 px-3 pb-1 pt-3 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  {section.icon}
                  {section.title}
                </p>
                <ul>
                  {section.items.map((p) => {
                    index += 1;
                    const i = index;
                    const active = p.id === city.id;
                    const highlighted = i === cursor;
                    return (
                      <li key={`${section.title}-${p.id}`}>
                        <button
                          data-index={i}
                          onMouseEnter={() => setCursor(i)}
                          onClick={() => choose(p)}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors ${
                            highlighted ? "bg-secondary" : ""
                          }`}
                        >
                          <MapPin
                            className={`size-4 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm">{p.name}</span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {[p.state, p.tz.split("/").pop()?.replace(/_/g, " ")]
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                          </span>
                          {active && <Check className="size-4 shrink-0 text-primary" />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ) : null,
          )}

          {showingSearch && state.kind === "done" && state.results.length === 0 && (
            <li className="px-6 py-10 text-center">
              <Globe2 className="mx-auto size-6 text-muted-foreground" />
              <p className="mt-3 text-sm">No places match “{query.trim()}”</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Try the full city name, or a larger nearby city.
              </p>
            </li>
          )}
          {state.kind === "error" && (
            <li className="px-6 py-10 text-center">
              <p className="text-sm">Couldn’t reach the location service</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Check your connection and try again — recent and popular places still work.
              </p>
            </li>
          )}
          {!showingSearch && query.trim().length === 1 && (
            <li className="px-6 py-8 text-center text-xs text-muted-foreground">
              Keep typing — at least two letters.
            </li>
          )}
        </ul>
      </div>
    </div>,
    document.body,
  );
}

export { placeLabel };
