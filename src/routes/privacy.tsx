import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { AppHeader } from "@/components/AppHeader";
import { canonicalLink, canonicalOgUrl } from "@/lib/seo/canonical";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Panchanga" },
      { name: "description", content: "How Panchanga collects, uses and stores your information." },
      { property: "og:title", content: "Privacy Policy — Panchanga" },
      { property: "og:description", content: "How Panchanga collects, uses and stores your information." },
      canonicalOgUrl("/privacy"),
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [canonicalLink("/privacy")],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <main className="mx-auto max-w-md">
      <AppHeader title="Privacy" subtitle="How we handle your data" />

      <div className="px-5 py-5">
        <Link
          to="/settings"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Settings
        </Link>

        <article className="panel px-5 py-5 text-sm leading-relaxed text-muted-foreground">
          <p className="text-xs italic">
            This page is maintained by the Panchanga team to answer common privacy questions about the app. It is not a legal certification or audit report.
          </p>

          <h2 className="mt-5 font-display text-base text-foreground">What Panchanga is</h2>
          <p className="mt-2">
            Panchanga is a mobile-first almanac app that calculates tithi, nakshatra, muhurta and festivals for your chosen location. Most calculations run on your device, and you can use the app without signing in.
          </p>

          <h2 className="mt-5 font-display text-base text-foreground">What we collect</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong className="text-foreground">Device preferences:</strong> your chosen city, time format, theme, reminder settings and reminder list are stored locally in your browser.
            </li>
            <li>
              <strong className="text-foreground">Account data (optional):</strong> if you sign in with Google or email, we store your account identifier and display name so we can sync your preferences across devices.
            </li>
            <li>
              <strong className="text-foreground">Feedback:</strong> when you submit feedback, we store the name, email, category and message you provide.
            </li>
          </ul>

          <h2 className="mt-5 font-display text-base text-foreground">How we use it</h2>
          <p className="mt-2">
            We use your information only to operate and improve the app: to show the correct panchang for your location, deliver reminders, keep your settings in sync, and respond to your feedback. We do not sell your personal data or use it for advertising.
          </p>

          <h2 className="mt-5 font-display text-base text-foreground">Location and timezone</h2>
          <p className="mt-2">
            Your selected city and timezone are used only for on-device calculations. Geocoding requests may be sent to third-party search services when you look up a location, but they are not tied to your identity.
          </p>

          <h2 className="mt-5 font-display text-base text-foreground">Notifications</h2>
          <p className="mt-2">
            Reminder notifications are scheduled locally while the app is open. If you grant browser notification permission, your device handles the alerts; we do not receive notification content or delivery status.
          </p>

          <h2 className="mt-5 font-display text-base text-foreground">Cookies and analytics</h2>
          <p className="mt-2">
            Panchanga does not use third-party analytics or advertising cookies. Essential authentication cookies are set only when you sign in.
          </p>

          <h2 className="mt-5 font-display text-base text-foreground">Data retention</h2>
          <p className="mt-2">
            Local preferences remain on your device until you clear them. Account data and synced settings are kept while your account is active. Feedback submissions are retained so we can review and act on them.
          </p>

          <h2 className="mt-5 font-display text-base text-foreground">Your choices</h2>
          <p className="mt-2">
            You can change your city, reminders and theme at any time in Settings. You can sign out from the Account section. To delete your account and synced data, please contact us through the Feedback page.
          </p>

          <h2 className="mt-5 font-display text-base text-foreground">Hosting</h2>
          <p className="mt-2">
            The app is hosted and the optional backend is provided by Lovable Cloud. Lovable supplies the platform infrastructure; this privacy policy describes how the Panchanga app itself uses data.
          </p>

          <h2 className="mt-5 font-display text-base text-foreground">Contact us</h2>
          <p className="mt-2">
            If you have questions about this policy or want to exercise your privacy rights, send a message through the Feedback page.
          </p>

          <p className="mt-5 text-xs">Last updated: 26 July 2026</p>
        </article>
      </div>
    </main>
  );
}
