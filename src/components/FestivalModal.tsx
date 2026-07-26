import { Apple, Bell, BellRing, CalendarPlus, Mail, Sunrise, UtensilsCrossed } from "lucide-react";

import { AddToCalendar } from "@/components/AddToCalendar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { CalendarEvent } from "@/lib/calendar-export";
import type { Festival } from "@/lib/panchang/festivals";
import { FESTIVAL_DETAILS } from "@/lib/panchang/festivalDetails";
import type { VratGuide } from "@/lib/panchang/vrat";

export type FestivalSheetItem = {
  id: string;
  name: string;
  note: string;
  festival?: Festival;
};

export function FestivalModal({
  item,
  dateLabel,
  reminded,
  vrat,
  formatTime,
  zone,
  calendarEvent,
  onToggleReminder,
  onOpenChange,
}: {
  item: FestivalSheetItem | null;
  dateLabel: string;
  reminded: boolean;
  vrat: VratGuide | null;
  formatTime: (d: Date | null) => string;
  zone: string;
  calendarEvent: CalendarEvent | null;
  onToggleReminder: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  const detail = item ? FESTIVAL_DETAILS[item.id] : undefined;
  const about = detail?.about ?? vrat?.about ?? item?.note;

  return (
    <Sheet open={!!item} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[88svh] overflow-y-auto rounded-t-3xl px-5 pb-[calc(1.5rem+var(--sa-bottom,0px))] pt-5"
      >
        {item && (
          <>
            <SheetHeader className="text-left">
              <p className="label-caps">{dateLabel}</p>
              <SheetTitle className="font-display text-2xl text-gold">{item.name}</SheetTitle>
              <SheetDescription>{item.note}</SheetDescription>
            </SheetHeader>

            <div className="mt-4 space-y-5">
              {about && <p className="text-sm leading-relaxed">{about}</p>}

              {vrat && (
                <div className="rounded-2xl border border-gold/35 bg-gold/10 p-4">
                  <p className="flex items-center gap-2 font-display text-base text-gold">
                    <Sunrise className="size-4" />
                    {vrat.label} timings
                  </p>
                  <dl className="mt-3 space-y-2 text-sm">
                    <TimeRow label={vrat.start.label} value={`${formatTime(vrat.start.at)} ${zone}`} />
                    <TimeRow label={vrat.end.label} value={`${formatTime(vrat.end.at)} ${zone}`} />
                    {vrat.window && (
                      <TimeRow
                        label={vrat.window.label}
                        value={`${formatTime(vrat.window.start)} – ${formatTime(vrat.window.end)} ${zone}`}
                      />
                    )}
                  </dl>
                  {vrat.end.note && (
                    <p className="mt-2 text-xs text-muted-foreground">{vrat.end.note}</p>
                  )}
                </div>
              )}

              {vrat && vrat.dietary.length > 0 && (
                <div>
                  <p className="label-caps flex items-center gap-1.5">
                    <UtensilsCrossed className="size-3.5" /> Dietary guidelines
                  </p>
                  <ul className="mt-2 space-y-1.5 text-sm">
                    {vrat.dietary.map((line) => (
                      <li key={line} className="flex gap-2">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-gold" />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {detail && detail.observance.length > 0 && (
                <div>
                  <p className="label-caps">How it is observed</p>
                  <ul className="mt-2 space-y-1.5 text-sm">
                    {detail.observance.map((line) => (
                      <li key={line} className="flex gap-2">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {detail?.region && (
                <p className="text-xs text-muted-foreground">Mainly observed in {detail.region}.</p>
              )}

              {calendarEvent && <AddToCalendar event={calendarEvent} />}

              <button
                onClick={onToggleReminder}
                className={`flex w-full items-center justify-center gap-2 rounded-full border border-gold/40 py-2.5 font-display text-sm transition-colors ${
                  reminded ? "bg-gold text-background" : "bg-gold/10 text-gold hover:bg-gold/20"
                }`}
              >
                {reminded ? <BellRing className="size-4" /> : <Bell className="size-4" />}
                {reminded ? "Reminder set — tap to remove" : "Remind me in the app"}
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function TimeRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="shrink-0 font-display tabular-nums">{value}</dd>
    </div>
  );
}
