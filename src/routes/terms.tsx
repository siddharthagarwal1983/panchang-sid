import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { AppHeader } from "@/components/AppHeader";
import { canonicalLink, canonicalOgUrl } from "@/lib/seo/canonical";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Panchanga" },
      {
        name: "description",
        content:
          "Terms of service for the Panchanga app: how you may use our panchang timings, festival dates and reminders, and the limits of our liability.",
      },
      { property: "og:title", content: "Terms of Service — Panchanga" },
      {
        property: "og:description",
        content:
          "The rules for using Panchanga's panchang timings, festival dates and reminder features.",
      },
      canonicalOgUrl("/terms"),
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      canonicalOgUrl("/terms"),
    ],
    links: [canonicalLink("/terms")],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <main className="mx-auto max-w-md">
      <AppHeader title="Terms" subtitle="Terms of service" />

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
            This page is maintained by the Panchanga team and sets out the rules for using the app. It is not independent legal advice.
          </p>

          <h2 className="mt-5 font-display text-base text-foreground">Accepting these terms</h2>
          <p className="mt-2">
            By using Panchanga, you agree to these terms. If you do not agree, please do not use the app. We may update these terms from time to time; continued use after an update means you accept the new terms.
          </p>

          <h2 className="mt-5 font-display text-base text-foreground">What Panchanga provides</h2>
          <p className="mt-2">
            Panchanga calculates Hindu almanac information such as tithi, nakshatra, yoga, karana, muhurta and festival dates based on your selected location. Calculations are performed on your device using astronomical algorithms. The app is provided for personal, informational use.
          </p>

          <h2 className="mt-5 font-display text-base text-foreground">Accuracy and religious practice</h2>
          <p className="mt-2">
            Panchanga uses Drik Ganita (true positions) with the Lahiri (Chitrapaksha) ayanamsa. Timings may differ by a few minutes from printed panchangs that follow Vakya tradition or another ayanamsa. Please consult your local priest, temple or trusted almanac for matters of ritual precision.
          </p>

          <h2 className="mt-5 font-display text-base text-foreground">Your account</h2>
          <p className="mt-2">
            Signing in with Google or email is optional. If you do sign in, you are responsible for keeping your account credentials secure, and you must not use another person’s account without permission.
          </p>

          <h2 className="mt-5 font-display text-base text-foreground">Acceptable use</h2>
          <p className="mt-2">
            You agree not to misuse the app or its backend: do not attempt to access data that is not yours, interfere with the service, or submit harmful, abusive or illegal content through feedback or other features.
          </p>

          <h2 className="mt-5 font-display text-base text-foreground">Intellectual property</h2>
          <p className="mt-2">
            The app, its design, code and content are owned by the Panchanga team and are protected by copyright and other laws. You may not copy, modify or distribute the app without permission.
          </p>

          <h2 className="mt-5 font-display text-base text-foreground">Limitation of liability</h2>
          <p className="mt-2">
            Panchanga is provided "as is" without warranties of any kind. To the fullest extent permitted by law, we are not liable for any loss or damage arising from your use of the app, including reliance on festival timings or reminders.
          </p>

          <h2 className="mt-5 font-display text-base text-foreground">Termination</h2>
          <p className="mt-2">
            We may suspend or terminate access to the app for anyone who violates these terms or misuses the service.
          </p>

          <h2 className="mt-5 font-display text-base text-foreground">Governing law</h2>
          <p className="mt-2">
            These terms are governed by the laws of the United States. Any disputes will be resolved in the courts of that jurisdiction.
          </p>

          <h2 className="mt-5 font-display text-base text-foreground">Contact us</h2>
          <p className="mt-2">
            Questions about these terms can be sent through the Feedback page in the app.
          </p>

          <p className="mt-5 text-xs">Last updated: 26 July 2026</p>
        </article>
      </div>
    </main>
  );
}
