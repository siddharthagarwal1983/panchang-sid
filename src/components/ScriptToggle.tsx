import { SCRIPT_OPTIONS } from "@/lib/panchang/lang";
import { usePrefs } from "@/lib/prefs";

/** Quick switch between Devanagari, transliteration and plain English. */
export function ScriptToggle({ className = "" }: { className?: string }) {
  const { prefs, setPrefs } = usePrefs();

  return (
    <div
      role="group"
      aria-label="Script"
      className={`flex items-center gap-1 rounded-full border border-border bg-secondary/40 p-1 ${className}`}
    >
      {SCRIPT_OPTIONS.map((o) => {
        const active = prefs.script === o.id;
        return (
          <button
            key={o.id}
            onClick={() => setPrefs({ script: o.id })}
            aria-pressed={active}
            title={o.label}
            className={`min-w-0 flex-1 truncate rounded-full px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
              active ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            <span aria-hidden className="min-[360px]:hidden">{o.short}</span>
            <span className="hidden min-[360px]:inline">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
