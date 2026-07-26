import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, CheckCircle, Send } from "lucide-react";

import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/lib/auth";
import { submitFeedback } from "@/lib/feedback.functions";

export const Route = createFileRoute("/feedback")({
  head: () => ({
    meta: [
      { title: "Feedback — Panchanga" },
      { name: "description", content: "Send feedback, report a bug or suggest a festival for Panchanga." },
      { property: "og:title", content: "Feedback — Panchanga" },
      { property: "og:description", content: "Send feedback, report a bug or suggest a festival for Panchanga." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FeedbackPage,
});

const CATEGORIES = [
  { value: "general", label: "General feedback" },
  { value: "bug", label: "Bug report" },
  { value: "suggestion", label: "Feature suggestion" },
  { value: "festival", label: "Festival or date correction" },
  { value: "other", label: "Other" },
];

function FeedbackPage() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await submitFeedback({ data: { name, email, category, message } });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-md">
      <AppHeader title="Feedback" subtitle="Help us improve Panchanga" />

      <div className="px-5 py-5">
        <Link
          to="/settings"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Settings
        </Link>

        {sent ? (
          <section className="panel px-5 py-6 text-center">
            <CheckCircle className="mx-auto size-12 text-primary" />
            <h2 className="mt-4 font-display text-xl">Thank you</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your feedback has been sent. We read every message and use it to make Panchanga better.
            </p>
            <Link
              to="/settings"
              className="mt-5 inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm text-primary-foreground transition-opacity hover:opacity-90"
            >
              Back to Settings
            </Link>
          </section>
        ) : (
          <form onSubmit={handleSubmit} className="panel px-5 py-5">
            <label className="block">
              <span className="label-caps">Name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Optional"
                maxLength={120}
                className="mt-1.5 w-full rounded-xl border border-border bg-transparent px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
              />
            </label>

            <label className="mt-4 block">
              <span className="label-caps">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Optional"
                maxLength={255}
                className="mt-1.5 w-full rounded-xl border border-border bg-transparent px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
              />
              <p className="mt-1 text-xs text-muted-foreground">Only used if we need to follow up.</p>
            </label>

            <label className="mt-4 block">
              <span className="label-caps">Category</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-border bg-transparent px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="mt-4 block">
              <span className="label-caps">Message</span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={5}
                maxLength={5000}
                placeholder="Tell us what you think, what went wrong, or which festival we should add."
                className="mt-1.5 w-full resize-none rounded-xl border border-border bg-transparent px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
              />
              <p className="mt-1 text-right text-xs text-muted-foreground">{message.length}/5000</p>
            </label>

            {error && (
              <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || message.trim().length === 0}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              <Send className="size-4" />
              {submitting ? "Sending..." : "Send feedback"}
            </button>

            <p className="mt-3 text-center text-xs text-muted-foreground">
              Feedback is anonymous unless you share your email.
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
