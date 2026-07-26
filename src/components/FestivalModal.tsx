import { Bell, BellRing } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Festival } from "@/lib/panchang/festivals";
import { FESTIVAL_DETAILS } from "@/lib/panchang/festivalDetails";

export function FestivalModal({
  festival,
  dateLabel,
  reminded,
  onToggleReminder,
  onOpenChange,
}: {
  festival: Festival | null;
  dateLabel: string;
  reminded: boolean;
  onToggleReminder: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  const detail = festival ? FESTIVAL_DETAILS[festival.id] : undefined;

  return (
    <Dialog open={!!festival} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl">
        {festival && (
          <>
            <DialogHeader className="text-left">
              <p className="label-caps">{dateLabel}</p>
              <DialogTitle className="font-display text-2xl text-gold">{festival.name}</DialogTitle>
              <DialogDescription>{festival.note}</DialogDescription>
            </DialogHeader>

            {detail && (
              <div className="space-y-4">
                <p className="text-sm leading-relaxed">{detail.about}</p>
                <div>
                  <p className="label-caps">How it is observed</p>
                  <ul className="mt-2 space-y-1.5 text-sm">
                    {detail.observance.map((line) => (
                      <li key={line} className="flex gap-2">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-gold" />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {detail.region && (
                  <p className="text-xs text-muted-foreground">Mainly observed in {detail.region}.</p>
                )}
              </div>
            )}

            <button
              onClick={onToggleReminder}
              className={`mt-1 flex w-full items-center justify-center gap-2 rounded-full border border-gold/40 py-2.5 font-display text-sm transition-colors ${
                reminded ? "bg-gold text-background" : "bg-gold/10 text-gold hover:bg-gold/20"
              }`}
            >
              {reminded ? <BellRing className="size-4" /> : <Bell className="size-4" />}
              {reminded ? "Reminder set — tap to remove" : "Remind me on this day"}
            </button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
