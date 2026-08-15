import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft, CheckCircle2, Loader2, RefreshCw, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/lib/auth";
import { CANONICAL_ORIGIN, canonicalLink, canonicalOgUrl } from "@/lib/seo/canonical";
import {
  getSearchConsoleStatus,
  getSearchPerformance,
  inspectSearchConsoleUrl,
  requestRecrawl,
} from "@/lib/seo/search-console.functions";

export const Route = createFileRoute("/admin/search-console")({
  head: () => ({
    meta: [
      { title: "Search Console monitor — Panchanga" },
      { name: "description", content: "Internal Search Console monitor for indexing and canonical selection." },
      { property: "og:title", content: "Search Console monitor — Panchanga" },
      { property: "og:description", content: "Internal Search Console monitor for indexing and canonical selection." },
      canonicalOgUrl("/admin/search-console"),
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [canonicalLink("/admin/search-console")],
  }),
  component: SearchConsolePage,
});

type Status = Awaited<ReturnType<typeof getSearchConsoleStatus>>;
type Perf = Awaited<ReturnType<typeof getSearchPerformance>>;

function fmtDate(value: string | null) {
  if (!value) return "never";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
}

function SearchConsolePage() {
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<Status | null>(null);
  const [perf, setPerf] = useState<Perf | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState(`${CANONICAL_ORIGIN}/`);

  const load = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const [s, p] = await Promise.all([
        getSearchConsoleStatus({ data: {} }),
        getSearchPerformance({ data: { dimension: "page" } }),
      ]);
      setStatus(s);
      setPerf(p);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load Search Console data.");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (user) void load();
  }, [user, load]);

  async function handleRecrawl() {
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const res = await requestRecrawl({ data: {} });
      setMessage(
        res.status === "ok"
          ? `Sitemap resubmitted at ${new Date(res.submittedAt).toLocaleTimeString()}. Google re-crawls on its own schedule.`
          : "Multiple verified properties matched — pick one in Search Console.",
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resubmit the sitemap.");
    } finally {
      setBusy(false);
    }
  }

  async function handleInspect() {
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const res = await inspectSearchConsoleUrl({ data: { url: urlInput.trim() } });
      if (res.status === "ok") {
        const i = res.inspection;
        setMessage(
          `${i.url} — ${i.verdict} / ${i.coverageState}. Google canonical: ${i.googleCanonical ?? "not set"}. Last crawl: ${fmtDate(i.lastCrawlTime)}.`,
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Inspection failed.");
    } finally {
      setBusy(false);
    }
  }

  if (authLoading) {
    return (
      <main className="mx-auto max-w-md p-4">
        <AppHeader title="Search Console" />
        <p className="mt-8 text-sm text-muted-foreground">Loading…</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-md p-4">
        <AppHeader title="Search Console" />
        <div className="mt-8 rounded-2xl border border-border bg-card p-5">
          <h1 className="text-lg font-semibold">Search Console monitor</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in with an admin account to view indexing and canonical status.
          </p>
          <Link to="/auth" search={{ next: undefined }} className="mt-4 inline-block rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  const inspections = status && status.status === "ok" ? status.inspections : [];
  const conflicts = inspections.filter((i) => !i.canonicalOk);

  return (
    <main className="mx-auto max-w-md p-4 pb-24">
      <AppHeader title="Search Console" />

      <Link to="/settings" className="mt-4 inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Settings
      </Link>

      <h1 className="mt-3 text-xl font-semibold">Search Console monitor</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Live indexing and canonical verdicts for {CANONICAL_ORIGIN.replace("https://", "")}.
      </p>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => void load()}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Refresh
        </button>
        <button
          onClick={() => void handleRecrawl()}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          Resubmit sitemap
        </button>
      </div>

      {error && (
        <p className="mt-3 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
      )}
      {message && <p className="mt-3 rounded-xl border border-border bg-muted/40 p-3 text-sm">{message}</p>}

      {status?.status === "selection_required" && (
        <p className="mt-3 rounded-xl border border-border p-3 text-sm">
          Multiple verified properties cover this site: {status.candidates.join(", ")}
        </p>
      )}

      {status?.status === "ok" && (
        <>
          <section className="mt-5 rounded-2xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Property &amp; sitemap</h2>
            <dl className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Property</dt><dd className="text-right">{status.siteUrl}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Last submitted</dt><dd>{fmtDate(status.sitemap.lastSubmitted)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Last downloaded</dt><dd>{fmtDate(status.sitemap.lastDownloaded)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">URLs submitted</dt><dd>{status.sitemap.submittedUrls ?? "—"}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Sitemap errors</dt><dd>{status.sitemap.errors ?? "0"}</dd></div>
            </dl>
          </section>

          <section className="mt-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Canonical selection ({inspections.length - conflicts.length}/{inspections.length} on canonical host)
            </h2>
            <ul className="mt-2 space-y-2">
              {inspections.map((i) => (
                <li key={i.url} className="rounded-2xl border border-border bg-card p-3 text-sm">
                  <div className="flex items-start gap-2">
                    {i.canonicalOk && i.verdict === "PASS" ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    ) : (
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    )}
                    <div className="min-w-0">
                      <p className="break-all font-medium">{i.url.replace(CANONICAL_ORIGIN, "") || "/"}</p>
                      <p className="text-muted-foreground">{i.verdict} · {i.coverageState}</p>
                      <p className="break-all text-muted-foreground">Google canonical: {i.googleCanonical ?? "not set"}</p>
                      <p className="text-muted-foreground">Last crawl: {fmtDate(i.lastCrawlTime)}</p>
                      {i.error && <p className="text-destructive">{i.error}</p>}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">
              Checked {fmtDate(status.checkedAt)}. Google has no public API for the “Request indexing” button — resubmitting
              the sitemap is the strongest automatable nudge; anything still flagged needs a manual request in Search Console.
            </p>
          </section>
        </>
      )}

      <section className="mt-5 rounded-2xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Inspect a URL</h2>
        <div className="mt-2 flex gap-2">
          <input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm"
            placeholder={`${CANONICAL_ORIGIN}/calendar`}
          />
          <button
            onClick={() => void handleInspect()}
            disabled={busy}
            className="inline-flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-sm disabled:opacity-50"
          >
            <Search className="h-4 w-4" /> Check
          </button>
        </div>
      </section>

      {perf?.status === "ok" && perf.rows.length > 0 && (
        <section className="mt-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Top pages (28 days)</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {perf.rows.map((row) => (
              <li key={row.key} className="flex justify-between gap-3 rounded-xl border border-border bg-card p-2">
                <span className="min-w-0 flex-1 truncate">{row.key.replace(CANONICAL_ORIGIN, "") || "/"}</span>
                <span className="text-muted-foreground">
                  {row.clicks}c · {row.impressions}i · #{row.position.toFixed(1)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
