import { ChevronDown, MapPin } from "lucide-react";
import { useState } from "react";

import { CityPicker } from "@/components/CityPicker";
import { usePrefs } from "@/lib/prefs";

export function AppHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const { city } = usePrefs();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 px-5 pb-3 pt-[calc(env(safe-area-inset-top)+0.85rem)] backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate font-display text-xl leading-tight">{title}</h1>
          {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-secondary"
        >
          <MapPin className="size-3.5 text-primary" />
          <span className="max-w-28 truncate">{city.name}</span>
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </button>
      </div>
      <CityPicker open={open} onClose={() => setOpen(false)} />
    </header>
  );
}