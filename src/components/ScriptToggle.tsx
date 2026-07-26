import { Check, Languages } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SCRIPT_OPTIONS } from "@/lib/panchang/lang";
import { usePrefs } from "@/lib/prefs";

/** Header icon that switches between Devanagari, transliteration and plain English. */
export function ScriptToggle({ className = "" }: { className?: string }) {
  const { prefs, setPrefs } = usePrefs();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Language and script"
        className={`flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-primary transition-colors hover:bg-secondary ${className}`}
      >
        <Languages className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Script
        </DropdownMenuLabel>
        {SCRIPT_OPTIONS.map((o) => (
          <DropdownMenuItem
            key={o.id}
            onSelect={() => setPrefs({ script: o.id })}
            className="flex items-center justify-between gap-2"
          >
            <span className="flex items-center gap-2">
              <span aria-hidden className="w-6 text-center text-xs text-muted-foreground">
                {o.short}
              </span>
              {o.label}
            </span>
            {prefs.script === o.id && <Check className="size-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
