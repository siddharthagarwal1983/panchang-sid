import { Crosshair, LoaderCircle, MapPin } from "lucide-react";
import { useState } from "react";

import { CityPicker } from "@/components/CityPicker";
import { nearestCity } from "@/lib/panchang/cities";
import { usePrefs } from "@/lib/prefs";

type Status =
  | { kind: "idle" }
  | { kind: "locating" }
  | { kind: "located"; miles: number }
  | { kind: "error"; message: string };

export function LocationWidget({ inHeader = false }: { inHeader?: boolean }) {
  const { city, setPrefs } = usePrefs();
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [pickerOpen, setPickerOpen] = useState(false);

  const locate = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus({ kind: "error", message: "This device can't share its location." });
      return;
    }
    setStatus({ kind: "locating" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { city: match, miles } = nearestCity(pos.coords.latitude, pos.coords.longitude);
        setPrefs({ cityId: match.id });
        setStatus({ kind: "located", miles });
      },
      (err) => {
        setStatus({
          kind: "error",
          message:
            err.code === err.PERMISSION_DENIED
              ? "Location permission denied — pick a city instead."
              : "Couldn't get your location — pick a city instead.",
        });
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 },
    );
  };

  return (
    <section
      className={
        inHeader
          ? "mt-2 flex items-center gap-2.5"
          : "panel flex items-center gap-3 px-4 py-3"
      }
    >
      <MapPin className={inHeader ? "size-4 shrink-0 text-primary" : "size-5 shrink-0 text-primary"} />
      <div className="min-w-0 flex-1">
        {!inHeader && <p className="label-caps">Calculating for</p>}
        <button
          onClick={() => setPickerOpen(true)}
          className={`block max-w-full truncate text-left font-display underline-offset-4 hover:underline ${
            inHeader ? "text-sm" : "text-base"
          }`}
        >
          {city.name}, {city.state}
        </button>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {status.kind === "locating" && "Finding you…"}
          {status.kind === "located" &&
            `Nearest city to you · ${status.miles < 1 ? "under a mile" : `${Math.round(status.miles)} mi`} away`}
          {status.kind === "error" && status.message}
          {status.kind === "idle" &&
            (inHeader ? "Tap to change · or locate me" : "Tap the name to change, or use your location")}
        </p>
      </div>
      <button
        onClick={locate}
        disabled={status.kind === "locating"}
        aria-label="Use my current location"
        className={`flex shrink-0 items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 text-xs text-primary transition-colors hover:bg-primary/20 disabled:opacity-60 ${
          inHeader ? "px-2.5 py-1.5" : "px-3 py-2"
        }`}
      >
        {status.kind === "locating" ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <Crosshair className="size-4" />
        )}
        Locate
      </button>
      <CityPicker open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </section>
  );
}
