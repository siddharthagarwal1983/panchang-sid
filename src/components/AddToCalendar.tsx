import { CalendarPlus } from "lucide-react";
import { useState } from "react";

import {
  downloadIcs,
  googleCalendarUrl,
  outlookCalendarUrl,
  type CalendarEvent,
} from "@/lib/calendar-export";

/** Primary CTA: one-click export to Google, Apple or Outlook calendars. */
export function AddToCalendar({ event }: { event: CalendarEvent }) {
  const [open, setOpen] = useState(false);

  const openExternal = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
    setOpen(false);
  };

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 font-display text-sm text-primary-foreground transition-opacity hover:opacity-90"
      >
        <CalendarPlus className="size-4" />
        Add to calendar
      </button>
      {open && (
        <div className="mt-2 grid grid-cols-3 gap-2">
          <Option label="Google" onClick={() => openExternal(googleCalendarUrl(event))} />
          <Option
            label="Apple"
            onClick={() => {
              downloadIcs(event);
              setOpen(false);
            }}
          />
          <Option label="Outlook" onClick={() => openExternal(outlookCalendarUrl(event))} />
        </div>
      )}
    </div>
  );
}

function Option({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border border-border py-2 text-[13px] font-semibold transition-colors hover:bg-secondary"
    >
      {label}
    </button>
  );
}
