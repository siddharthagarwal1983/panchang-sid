import { createFileRoute } from "@tanstack/react-router";
import { ChevronRight, MapPin } from "lucide-react";
import { useState } from "react";

import { AppHeader } from "@/components/AppHeader";
import { CityPicker } from "@/components/CityPicker";
import { usePrefs } from "@/lib/prefs";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Panchanga" },
      {
        name: "description",
        content:
          "Set your US city, time format, amanta or purnimanta month naming, and app theme.",
      },
      { property: "og:title", content: "Settings — Panchanga" },
      {
        property: "og:description",
        content: "Personalise city, time format and calendar tradition.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { prefs, city, setPrefs } = usePrefs();
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <main className="mx-auto max-w-md">
      <AppHeader title="Settings" subtitle="Stored on this device only" />

      <div className="space-y-4 px-5 py-5">
        <section className="panel overflow-hidden">
          <button
            onClick={() => setPickerOpen(true)}
            className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-secondary"
          >
            <MapPin className="size-4 text-primary" />
            <span className="flex-1">
              <span className="block text-sm">City</span>
              <span className="block text-xs text-muted-foreground">
                {city.name}, {city.state}
              </span>
            </span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>
        </section>

        <Segmented
          label="Month naming"
          hint="Amanta ends at the new moon (South & West India). Purnimanta ends at the full moon (North India)."
          value={prefs.tradition}
          options={[
            { value: "amanta", label: "Amanta" },
            { value: "purnimanta", label: "Purnimanta" },
          ]}
          onChange={(v) => setPrefs({ tradition: v as "amanta" | "purnimanta" })}
        />

        <Segmented
          label="Time format"
          value={prefs.hour12 ? "12" : "24"}
          options={[
            { value: "12", label: "12-hour" },
            { value: "24", label: "24-hour" },
          ]}
          onChange={(v) => setPrefs({ hour12: v === "12" })}
        />

        <Segmented
          label="Theme"
          value={prefs.theme}
          options={[
            { value: "night", label: "Night sky" },
            { value: "day", label: "Parchment" },
          ]}
          onChange={(v) => setPrefs({ theme: v as "night" | "day" })}
        />

        <section className="panel px-5 py-4">
          <h2 className="label-caps">About these calculations</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Panchāṅga uses drik ganita (true positions of the sun and moon) with the Lahiri
            (Chitrapaksha) ayanamsa. Tithi, nakshatra, yoga and karana are read at local sunrise for
            your selected city, so festival dates land on the correct US day rather than the India
            date. Timings can differ by a few minutes from printed almanacs that follow vakya or a
            different ayanamsa.
          </p>
          <div className="hairline my-4" />
          <p className="text-xs text-muted-foreground">
            Everything runs on your device. No account, no data leaves your phone.
          </p>
        </section>
      </div>

      <CityPicker open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </main>
  );
}

function Segmented({
  label,
  hint,
  value,
  options,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <section className="panel px-5 py-4">
      <h2 className="label-caps">{label}</h2>
      <div className="mt-3 flex rounded-xl border border-border p-1">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm transition-colors ${
              value === o.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      {hint && <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">{hint}</p>}
    </section>
  );
}