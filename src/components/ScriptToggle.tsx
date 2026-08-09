import { Check, Languages } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { SCRIPT_OPTIONS } from "@/lib/panchang/lang";
import { usePrefs } from "@/lib/prefs";

/**
 * Header icon that switches between Devanagari, transliteration and plain English.
 *
 * Deliberately hand-rolled instead of using the Radix dropdown: this control is
 * on every screen, and the primitive added ~60 KB to the startup bundle for a
 * three-item menu.
 */
export function ScriptToggle({ className = "" }: { className?: string }) {
  const { prefs, setPrefs } = usePrefs();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        aria-label="Language and script"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-primary transition-colors hover:bg-secondary ${className}`}
      >
        <Languages className="size-4" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md"
        >
          <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Script
          </p>
          {SCRIPT_OPTIONS.map((o) => (
            <button
              key={o.id}
              type="button"
              role="menuitemradio"
              aria-checked={prefs.script === o.id}
              onClick={() => {
                setPrefs({ script: o.id });
                setOpen(false);
              }}
              className="flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <span className="flex items-center gap-2">
                <span aria-hidden className="w-6 text-center text-xs text-muted-foreground">
                  {o.short}
                </span>
                {o.label}
              </span>
              {prefs.script === o.id && <Check className="size-4 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
