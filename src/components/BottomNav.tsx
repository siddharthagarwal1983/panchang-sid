import { Link } from "@tanstack/react-router";
import { Bell, CalendarDays, Settings, Sun } from "lucide-react";

const TABS = [
  { to: "/", label: "Today", icon: Sun },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/reminders", label: "Reminders", icon: Bell },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-popover/95 backdrop-blur">
      <ul className="mx-auto flex max-w-md items-stretch pb-[env(safe-area-inset-bottom)]">
        {TABS.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="flex flex-col items-center gap-1 py-2.5 text-muted-foreground transition-colors"
              activeProps={{ className: "!text-primary" }}
            >
              <Icon className="size-5" />
              <span className="text-[0.65rem] tracking-wide">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}