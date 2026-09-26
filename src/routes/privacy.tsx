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
              <strong className="text-foreground">Device preferences:</strong> your chosen city (including its latitude/longitude and timezone), family city, recent cities, time format, theme and reminder settings are stored locally on your device.
            </li>
            <li>
              <strong className="text-foreground">Account data (optional):</strong> if you sign in with Google or email, we store your email, display name and profile photo URL, plus your synced preferences — including your saved locations with their latitude/longitude and timezone.
            </li>
            <li>
              <strong className="text-foreground">Sign-in funnel analytics:</strong> we record anonymous sign-in steps (for example "sign-in page viewed" or "sign-in completed"), the method (Google or email), where the step started, a random visitor ID stored on your device, and a timestamp. We do not track page views or the content you look at.
            </li>
            <li>
              <strong className="text-foreground">Feedback:</strong> when you submit feedback, we store the name, email, category and message you provide.
            </li>
          </ul>

          <h2 className="mt-5 font-display text-base text-foreground">How we use it</h2>
          <p className="mt-2">
            We use your information only to operate and improve the app: to show the correct panchang for your location, deliver reminders, keep your settings in sync, understand whether sign-in works, and respond to your feedback. We do not sell your personal data, show ads, or use it for advertising.
          </p>

          <h2 className="mt-5 font-display text-base text-foreground">Location and timezone</h2>
          <p className="mt-2">
            Your location is used to compute local sunrise, tithi and muhurta times. When you search for a city, the text you type is sent to Open-Meteo's geocoding service. When you tap "Use my current location", your coordinates are sent to OpenStreetMap Nominatim to look up your city name. If you are signed in, your selected locations (with coordinates) are saved to your account so they sync across devices.
          </p>

          <h2 className="mt-5 font-display text-base text-foreground">Third-party processors</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li><strong className="text-foreground">Open-Meteo</strong> — city search (place text).</li>
            <li><strong className="text-foreground">OpenStreetMap Nominatim</strong> — reverse geocoding (coordinates).</li>
            <li><strong className="text-foreground">Google</strong> — sign-in, if you choose "Continue with Google".</li>
            <li><strong className="text-foreground">Lovable Cloud / Supabase</strong> — hosting, database and authentication.</li>
          </ul>

          <h2 className="mt-5 font-display text-base text-foreground">Notifications</h2>
          <p className="mt-2">
            Reminder notifications are scheduled locally while the app is open. If you grant notification permission, your device handles the alerts; we do not receive notification content or delivery status.
          </p>

          <h2 className="mt-5 font-display text-base text-foreground">Cookies and analytics</h2>
          <p className="mt-2">
            Panchanga does not use third-party analytics or advertising SDKs or cookies. The only analytics are the anonymous sign-in funnel steps described above. Essential authentication data is stored only when you sign in.
          </p>

          <h2 className="mt-5 font-display text-base text-foreground">Data retention</h2>
          <p className="mt-2">
            Local preferences remain on your device until you clear them. Account data and synced settings are kept until you delete your account. Feedback submissions are retained so we can review and act on them.
          </p>

          <h2 className="mt-5 font-display text-base text-foreground">Deleting your account and data</h2>
          <p className="mt-2">
            Signed-in users can delete their account at any time in Settings → Account → "Delete my account and data". This permanently erases your profile (name and photo), your synced settings and saved locations, and your sign-in account, then signs you out. Feedback you sent is kept but no longer linked to your account. You can also request deletion by emailing us.
          </p>

          <h2 className="mt-5 font-display text-base text-foreground">Your choices</h2>
          <p className="mt-2">
            You can change your city, reminders and theme at any time in Settings, sign out from the Account section, or delete your account as described above.
          </p>

          <h2 className="mt-5 font-display text-base text-foreground">Contact us</h2>
          <p className="mt-2">
            For privacy questions, support or data-deletion requests, email{" "}
            <a href="mailto:coolrahulmalhotra85@gmail.com" className="text-primary underline">
              coolrahulmalhotra85@gmail.com
            </a>
            .
          </p>

          <p className="mt-5 text-xs">Last updated: 26 September 2026</p>
        </article>
      </div>
    </main>
  );
}
