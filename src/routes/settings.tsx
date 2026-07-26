import { Link, createFileRoute } from "@tanstack/react-router";
import { MessageSquare, Shield, FileText } from "lucide-react";
import { useEffect, useState } from "react";

import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/lib/auth";
import { usePrefs } from "@/lib/prefs";
import { useReminderNotifications } from "@/lib/useReminderNotifications";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Panchanga" },
      {
        name: "description",
        content:
          "Set your city, time format, app theme, notifications, and read the privacy policy and terms of service.",
      },
      { property: "og:title", content: "Settings — Panchanga" },
      {
        property: "og:description",
        content: "Personalise city, time format, theme, notifications, and legal information.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { prefs, setPrefs } = usePrefs();

  return (
    <main className="mx-auto max-w-md">
      <AppHeader title="Settings" subtitle="Account, notifications and display" />

      <div className="space-y-4 px-5 py-5">
        <AccountCard />

        <NotificationsCard />

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
            your location, so festival dates land on the correct day according to your location
            rather than the India date. Set or update your location from the location widget on the
            home page. Timings can differ by a few minutes from printed almanacs that follow vakya
            or a different ayanamsa.
          </p>
          <div className="hairline my-4" />
          <p className="text-xs text-muted-foreground">
            Calculations run on your device. Sign in only if you want your settings and reminders
            synced across devices.
          </p>
        </section>

        <section className="panel px-5 py-4">
          <h2 className="label-caps">Legal & feedback</h2>
          <div className="mt-3 space-y-1">
            <SettingsLink to="/feedback" icon={MessageSquare} label="Send feedback" />
            <SettingsLink to="/privacy" icon={Shield} label="Privacy policy" />
            <SettingsLink to="/terms" icon={FileText} label="Terms of service" />
          </div>
        </section>
      </div>
    </main>
  );
}

function AccountCard() {
  const { user, profile, signOut, updateDisplayName } = useAuth();
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setName(profile?.display_name ?? "");
  }, [profile?.display_name]);

  if (!user) {
    return (
      <section className="panel px-5 py-4">
        <h2 className="label-caps">Account</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in with Google or email to keep your city, reminders and preferences in sync across
          devices.
        </p>
        <Link
          to="/auth"
          className="mt-3 flex w-full items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm text-primary-foreground transition-opacity hover:opacity-90"
        >
          Sign in
        </Link>
      </section>
    );
  }

  return (
    <section className="panel px-5 py-4">
      <h2 className="label-caps">Account</h2>
      <p className="mt-2 truncate font-display text-base">{profile?.display_name || user.email}</p>
      {profile?.display_name && (
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
      )}

      <label className="mt-3 block">
        <span className="label-caps">Display name</span>
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setSaved(false);
          }}
          placeholder="Your name"
          className="mt-1.5 w-full rounded-xl border border-border bg-transparent px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
        />
      </label>
      <div className="mt-3 flex gap-2">
        <button
          onClick={async () => {
            await updateDisplayName(name.trim());
            setSaved(true);
          }}
          className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm text-primary-foreground transition-opacity hover:opacity-90"
        >
          {saved ? "Saved" : "Save"}
        </button>
        <button
          onClick={() => void signOut()}
          className="rounded-xl border border-border px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary"
        >
          Sign out
        </button>
      </div>
      <p className="mt-2.5 text-xs text-muted-foreground">
        Your city, time format, theme and reminders are saved to this account.
      </p>
    </section>
  );
}

function NotificationsCard() {
  const { prefs, setPrefs } = usePrefs();
  const { permission, request } = useReminderNotifications();

  const status =
    permission === "granted"
      ? "Notifications are on for this device."
      : permission === "denied"
        ? "Blocked in your browser settings — allow notifications for this site to receive reminders."
        : "Turn on notifications to get festival and vrat reminders.";

  return (
    <section className="panel px-5 py-4">
      <h2 className="label-caps">Notifications</h2>
      <p className="mt-2 text-sm text-muted-foreground">{status}</p>
      {permission !== "granted" && (
        <button
          onClick={() => void request()}
          disabled={permission === "denied"}
          className="mt-3 w-full rounded-xl bg-primary px-4 py-2.5 text-sm text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          Enable notifications
        </button>
      )}

      <div className="hairline my-4" />
      <label className="flex items-center justify-between gap-3">
        <span className="text-sm">Daily reminder time</span>
        <input
          type="time"
          value={prefs.reminderTime}
          onChange={(e) => setPrefs({ reminderTime: e.target.value })}
          className="rounded-lg border border-border bg-transparent px-3 py-1.5 text-sm tabular-nums outline-none focus:border-primary"
        />
      </label>
      <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
        Reminders fire in your city's timezone while the app is open. Choose which observances to be
        reminded about on the Reminders tab.
      </p>
    </section>
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

function SettingsLink({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-foreground transition-colors hover:bg-secondary"
    >
      <Icon className="size-4 text-muted-foreground" />
      <span className="flex-1">{label}</span>
      <span className="text-muted-foreground">›</span>
    </Link>
  );
}