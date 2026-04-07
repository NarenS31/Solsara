"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

/* ─── Data ───────────────────────────────────────────────────── */
const NAV_ITEMS = [
  { id: "reviews",      label: "Review Replies",   icon: "◈" },
  { id: "velocity",     label: "Review Velocity",   icon: "◎", soon: true },
  { id: "missed",       label: "Missed Call Net",   icon: "⌁" },
  { id: "gemini",       label: "Gemini Feeder",     icon: "◇", soon: true },
  { id: "social",       label: "Social Proof",      icon: "▣", soon: true },
  { id: "receptionist", label: "Text Receptionist", icon: "⊡", soon: true },
];

/* ─── Tiny components ────────────────────────────────────────── */
function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-px">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={cn("text-[12px]", s <= rating ? "text-amber-400" : "text-black/10")}>
          ★
        </span>
      ))}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  if (status === "posted")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        Posted
      </span>
    );
  if (status === "held")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-600">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        Needs review
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.05] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-black/40">
      Pending
    </span>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2);
  const hue = name.charCodeAt(0) * 17 % 360;
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white"
      style={{ background: `hsl(${hue}, 55%, 55%)` }}
    >
      {initials}
    </div>
  );
}

/* ─── Dashboard ──────────────────────────────────────────────── */
function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string | null>(null);
  
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeNav, setActiveNav] = useState("reviews");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [reviewActionLoadingId, setReviewActionLoadingId] = useState<string | null>(null);
  const [reviewActionError, setReviewActionError] = useState<string | null>(null);
  const [smsSetupComplete, setSmsSetupComplete] = useState(false);
  const [smsStep, setSmsStep] = useState(1);
  const [businessPhone, setBusinessPhone] = useState("");
  const [defaultMessage, setDefaultMessage] = useState(
    "Hey — thanks for calling. We missed you. Reply here and we’ll get you scheduled."
  );
  const [testNumber, setTestNumber] = useState("");
  const [smsPaused, setSmsPaused] = useState(false);
  const [missedLogs, setMissedLogs] = useState<any[]>([]);
  const [missedError, setMissedError] = useState<string | null>(null);
  const [loadingMissed, setLoadingMissed] = useState(false);
  const [twilioNumber, setTwilioNumber] = useState("");
  const [smsActionLoading, setSmsActionLoading] = useState(false);
  const [useExistingTwilio, setUseExistingTwilio] = useState(false);
  const [existingTwilioNumber, setExistingTwilioNumber] = useState("");
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const smsCharCount = defaultMessage.length;

  useEffect(() => {
    const idFromUrl = searchParams.get("business_id");
    if (idFromUrl) {
      setBusinessId(idFromUrl);
      try {
        localStorage.setItem("business_id", idFromUrl);
      } catch {
        // ignore storage errors
      }
      return;
    }

    try {
      const stored = localStorage.getItem("business_id");
      if (stored) {
        setBusinessId(stored);
        router.replace(`/dashboard?business_id=${stored}`);
      }
    } catch {
      // ignore storage errors
    }
  }, [searchParams, router]);

  // Fetch reviews from backend API
  useEffect(() => {
    if (!businessId) {
      setLoading(false);
      return;
    }

    const fetchReviews = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
        const response = await fetch(`${backendUrl}/reviews?business_id=${businessId}&limit=50`, {
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        
        // Normalize backend response to frontend format
        if (data.reviews && Array.isArray(data.reviews)) {
          const normalizedReviews = data.reviews.map((r: any) => ({
            id: r.id,
            reviewer: r.reviewer || "Anonymous",
            rating: r.rating || 0,
            comment: r.comment || "",
            time: r.time || "unknown",
            status: r.status || "posted",
            response: r.response || null,
            flagReason: r.flagReason || undefined,
          }));
          setReviews(normalizedReviews);
        } else {
          setReviews([]);
        }
      } catch (err) {
        console.error("Failed to fetch reviews:", err);
        setError(err instanceof Error ? err.message : "Failed to load reviews");
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [businessId]);

  // Fetch business name for sidebar
  useEffect(() => {
    if (!businessId) {
      setBusinessName(null);
      return;
    }
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
    fetch(`${backendUrl}/businesses/${businessId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        const name = data?.business?.name;
        setBusinessName(name && name.trim() ? name.trim() : null);
      })
      .catch(() => setBusinessName(null));
  }, [businessId]);

  useEffect(() => {
    if (activeNav !== "missed" || !businessId) return;

    const fetchMissed = async () => {
      try {
        setLoadingMissed(true);
        setMissedError(null);
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

        const [settingsRes, logsRes] = await Promise.all([
          fetch(`${backendUrl}/calls/settings?business_id=${businessId}`),
          fetch(`${backendUrl}/calls/missed?business_id=${businessId}`),
        ]);

        if (!settingsRes.ok) {
          throw new Error(`Settings error: ${settingsRes.status}`);
        }
        if (!logsRes.ok) {
          throw new Error(`Logs error: ${logsRes.status}`);
        }

        const settingsData = await settingsRes.json();
        const logsData = await logsRes.json();

        const settings = settingsData.settings || {};
        setTwilioNumber(settings.twilio_number || "");
        setBusinessPhone(settings.real_number || "");
        setDefaultMessage(settings.missed_call_message || defaultMessage);
        setSmsPaused(!!settings.missed_call_paused);
        setSmsSetupComplete(!!settings.twilio_number && !!settings.real_number);

        const normalizedLogs = (logsData.missed_calls || []).map((log: any) => ({
          id: log.id,
          number: log.caller_number || "Unknown",
          time: log.called_at ? new Date(log.called_at).toLocaleString() : "Unknown",
          sent: !!log.sms_sent,
        }));
        setMissedLogs(normalizedLogs);
      } catch (err) {
        setMissedError(err instanceof Error ? err.message : "Failed to load Missed Call Net");
      } finally {
        setLoadingMissed(false);
      }
    };

    fetchMissed();
  }, [activeNav, businessId]);

  const posted = reviews.filter((r) => r.status === "posted").length;
  const held = reviews.filter((r) => r.status === "held").length;
  const avg = reviews.length > 0
    ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  async function approve(id: string) {
    if (!businessId) {
      setReviewActionError("No business selected");
      return;
    }

    const responseText = editText.trim();
    if (!responseText) {
      setReviewActionError("Response text is required");
      return;
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
    setReviewActionLoadingId(id);
    setReviewActionError(null);

    try {
      const res = await fetch(`${backendUrl}/reviews/${id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id: businessId,
          response: responseText,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.detail || `Failed to post response (${res.status})`);
      }

      // Source of truth refresh after successful write.
      const reviewsRes = await fetch(`${backendUrl}/reviews?business_id=${businessId}&limit=50`, {
        headers: { "Content-Type": "application/json" },
      });
      if (!reviewsRes.ok) {
        throw new Error(`Reply saved but refresh failed (${reviewsRes.status})`);
      }
      const reviewsData = await reviewsRes.json();
      if (reviewsData.reviews && Array.isArray(reviewsData.reviews)) {
        const normalizedReviews = reviewsData.reviews.map((r: any) => ({
          id: r.id,
          reviewer: r.reviewer || "Anonymous",
          rating: r.rating || 0,
          comment: r.comment || "",
          time: r.time || "unknown",
          status: r.status || "posted",
          response: r.response || null,
          flagReason: r.flagReason || undefined,
        }));
        setReviews(normalizedReviews);
      } else {
        setReviews([]);
      }
      setEditingId(null);
      setEditText("");
    } catch (err) {
      // Keep current UI/edit state as-is so nothing is falsely shown as persisted.
      setReviewActionError(err instanceof Error ? err.message : "Failed to save response");
    } finally {
      setReviewActionLoadingId(null);
    }
  }

  return (
    <div className="flex min-h-screen bg-[#f7f9fc]">

      {/* ─ Mobile header ───────────────────────────────── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-white border-b border-black/[0.06]">
        <Link href="/" className="no-underline">
          <span className="text-[15px] font-black tracking-tight text-black">
            {businessName || (
              <>
                Sol<span className="text-[#0055ff]">sara</span>
              </>
            )}
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-[11px] font-semibold text-emerald-600">Live</span>
        </div>
      </header>

      {/* ─ Sidebar ──────────────────────────────────── */}
      <aside className="hidden md:flex md:fixed md:inset-y-0 md:left-0 md:w-60 flex-col bg-white border-r border-black/[0.06]">

        {/* Logo + Back */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-black/[0.05]">
          <Link href="/" className="no-underline">
            <div>
              <span className="text-[15px] font-black tracking-tight text-black block">
                {businessName || (
                  <>
                    Sol<span className="text-[#0055ff]">sara</span>
                  </>
                )}
              </span>
              {businessName && (
                <span className="text-[10px] font-medium text-black/40">Solsara</span>
              )}
            </div>
          </Link>
          <Link href="/" className="text-[13px] font-medium text-black/50 no-underline hover:underline">
            ← Back
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="mb-1.5 px-3 text-[9px] font-bold uppercase tracking-[0.2em] text-black/25">
            Modules
          </div>
          {NAV_ITEMS.filter((n) => !n.soon).map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={cn(
                "group mb-0.5 flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all",
                activeNav === item.id
                  ? "bg-[#0055ff] text-white shadow-[0_2px_12px_rgba(0,85,255,0.25)]"
                  : "text-black/50 hover:bg-black/[0.04] hover:text-black"
              )}
            >
              <span className="text-[13px] w-4 text-center opacity-70">{item.icon}</span>
              {item.label}
            </button>
          ))}

          <div className="mb-1.5 mt-5 px-3 text-[9px] font-bold uppercase tracking-[0.2em] text-black/20">
            Coming Soon
          </div>
          {NAV_ITEMS.filter((n) => n.soon).map((item) => (
            <div
              key={item.id}
              className="mb-0.5 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium text-black/25"
            >
              <span className="text-[13px] w-4 text-center">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              <span className="rounded-full bg-black/[0.05] px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-black/25">
                Soon
              </span>
            </div>
          ))}
        </nav>

        {/* Google status + Subscribe */}
        <div className="border-t border-black/[0.05] px-5 py-4 space-y-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-[11px] font-semibold text-emerald-600">Google connected</span>
            </div>
            <p className="mt-1 text-[10px] text-black/30">Last sync · 2 min ago</p>
          </div>
          {businessId && (
            <Link
              href={`/onboarding?business_id=${businessId}&step=4`}
              className="block w-full rounded-lg border border-[#0055ff]/30 bg-[#0055ff]/5 py-2.5 text-center text-[12px] font-semibold text-[#0055ff] no-underline transition hover:bg-[#0055ff]/10"
            >
              Subscribe — $149/mo
            </Link>
          )}
        </div>
      </aside>

      {/* ─ Main ─────────────────────────────────────── */}
      <main className="flex-1 md:ml-60 px-6 pt-16 md:pt-8 pb-16 md:px-10">

        {/* Header */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-black tracking-[-0.03em] text-black">
              {activeNav === "missed" ? "Missed Call Net" : "Review Replies"}
            </h1>
            <p className="mt-1 text-[12px] font-medium text-black/40">
              {activeNav === "missed"
                ? "Auto-texts every missed caller · Set once, runs forever"
                : loading
                ? "Loading..."
                : error
                ? "Connection issue"
                : "Monitoring · Auto-responding · 24/7"}
            </p>
          </div>
          <Button
            variant="outline"
            className="h-9 rounded-lg border-black/[0.08] bg-white text-[12px] font-semibold text-black/50 hover:border-black/20 hover:text-black shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
          >
            Settings
          </Button>
        </div>

        {/* Loading state */}
        {activeNav === "reviews" && loading && !businessId && (
          <div className="rounded-xl border border-black/[0.06] bg-white p-12 text-center">
            <div className="inline-flex h-8 w-8 animate-spin rounded-full border-2 border-black/20 border-t-[#0055ff] mb-4" />
            <p className="text-[13px] font-medium text-black/40">Loading your reviews...</p>
          </div>
        )}

        {/* Error state */}
        {activeNav === "reviews" && error && businessId && (
          <div className="rounded-xl border border-red-100 bg-red-50 p-6 mb-8">
            <p className="text-[13px] font-medium text-red-700">
              ⚠️ Failed to load reviews: {error}
            </p>
            <p className="mt-2 text-[12px] text-red-600/70">
              Make sure your backend is running at {process.env.NEXT_PUBLIC_BACKEND_URL || "localhost:8000"}
            </p>
          </div>
        )}

        {/* No business ID state */}
        {activeNav === "reviews" && !businessId && !loading && (
          <div className="rounded-xl border border-amber-100 bg-amber-50 p-6 mb-8">
            <p className="text-[13px] font-medium text-amber-700">
              📋 No business selected
            </p>
            <p className="mt-2 text-[12px] text-amber-600/70">
              Sign in with Google to connect your business profile and see real reviews.
            </p>
            <Link href="/api/auth/google" className="mt-4 inline-block">
              <Button className="h-9 rounded-lg bg-[#0055ff] text-[12px] font-semibold text-white hover:bg-[#0044dd]">
                Connect Business
              </Button>
            </Link>
          </div>
        )}

        {/* Empty state */}
        {activeNav === "reviews" && !loading && businessId && reviews.length === 0 && (
          <div className="rounded-xl border border-black/[0.06] bg-white p-12 text-center">
            <div className="text-[32px] mb-3">📭</div>
            <p className="text-[14px] font-semibold text-black">No reviews yet</p>
            <p className="mt-2 text-[12px] text-black/40">
              Reviews sync from your Google Business Profile. Click below to fetch them now.
            </p>
            {syncError && (
              <p className="mt-2 text-[12px] text-amber-600">{syncError}</p>
            )}
            <Button
              className="mt-4 h-10 rounded-lg bg-[#0055ff] px-5 text-[13px] font-semibold text-white hover:bg-[#0044dd] disabled:opacity-60"
              disabled={syncLoading}
              onClick={async () => {
                if (!businessId) return;
                setSyncLoading(true);
                setSyncError(null);
                try {
                  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
                  const res = await fetch(`${backendUrl}/reviews/sync/${businessId}`, {
                    method: "POST",
                  });
                  const data = await res.json().catch(() => ({}));
                  if (!res.ok) {
                    throw new Error(data.detail || data.message || "Sync failed");
                  }
                  // Refetch reviews
                  const revRes = await fetch(`${backendUrl}/reviews?business_id=${businessId}&limit=50`);
                  const revData = await revRes.json();
                  if (revData.reviews?.length) {
                    setReviews(revData.reviews.map((r: any) => ({
                      id: r.id,
                      reviewer: r.reviewer || "Anonymous",
                      rating: r.rating || 0,
                      comment: r.comment || "",
                      time: r.time || "unknown",
                      status: r.status || "posted",
                      response: r.response || null,
                      flagReason: r.flagReason,
                    })));
                  }
                } catch (e) {
                  setSyncError(e instanceof Error ? e.message : "Sync failed");
                } finally {
                  setSyncLoading(false);
                }
              }}
            >
              {syncLoading ? "Syncing…" : "Sync from Google"}
            </Button>
            <p className="mt-4 text-[11px] text-black/30">
              Syncs run automatically every 30 min. Need test data?{" "}
              <code className="rounded bg-black/5 px-1.5 py-0.5 text-[10px] font-mono">
                POST /reviews/seed/{businessId}
              </code>
            </p>
            {businessId && (
              <Link
                href={`/onboarding?business_id=${businessId}&step=4`}
                className="mt-4 inline-block text-[12px] font-semibold text-[#0055ff] hover:underline"
              >
                Subscribe $149/mo →
              </Link>
            )}
          </div>
        )}

        {/* Content sections (only show if we have data) */}
        {activeNav === "reviews" && !loading && reviews.length > 0 && (
          <>
        {/* Stats */}
        <div className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Avg. Rating",    value: avg,    sub: "↑ 0.2 this week",  accent: "text-amber-500",  bg: "bg-amber-50",  dot: "bg-amber-400" },
            { label: "Auto-Posted",    value: posted, sub: "This week",         accent: "text-[#0055ff]",  bg: "bg-[#f0f5ff]", dot: "bg-[#0055ff]" },
            { label: "Needs Review",   value: held,   sub: "Flagged by AI",     accent: held > 0 ? "text-amber-500" : "text-black", bg: held > 0 ? "bg-amber-50" : "bg-[#f9fafb]", dot: held > 0 ? "bg-amber-400" : "bg-black/20" },
            { label: "Response Rate",  value: "100%", sub: "All time",          accent: "text-emerald-600", bg: "bg-emerald-50", dot: "bg-emerald-400" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.07 }}
              className="rounded-xl border border-black/[0.06] bg-white p-5 shadow-[0_1px_6px_rgba(0,0,0,0.04)]"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/35">{stat.label}</span>
                <span className={cn("flex h-6 w-6 items-center justify-center rounded-lg", stat.bg)}>
                  <span className={cn("h-2 w-2 rounded-full", stat.dot)} />
                </span>
              </div>
              <div className={cn("text-[28px] font-black tracking-tight", stat.accent)}>{stat.value}</div>
              <div className="mt-1.5 text-[11px] font-medium text-black/35">{stat.sub}</div>
            </motion.div>
          ))}
        </div>

        {/* Flagged reviews */}
        <AnimatePresence initial={false}>
          {held > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-8"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-[13px] font-bold text-black">Needs Your Attention</h2>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-600">
                  {held} flagged
                </span>
              </div>

              <div className="space-y-3">
                {reviews
                  .filter((r) => r.status === "held")
                  .map((review) => (
                    <motion.div key={review.id}>
                      <div className="rounded-xl border border-amber-100 bg-white shadow-[0_1px_8px_rgba(0,0,0,0.04)] overflow-hidden">
                        {/* Orange top accent */}
                        <div className="h-0.5 w-full bg-gradient-to-r from-amber-400 to-amber-200" />
                        <div className="p-6 space-y-4">
                          {/* Reviewer */}
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <Avatar name={review.reviewer} />
                              <div>
                                <div className="text-[14px] font-semibold text-black">{review.reviewer}</div>
                                <div className="mt-0.5 flex items-center gap-2">
                                  <Stars rating={review.rating} />
                                  <span className="text-[11px] text-black/30">{review.time}</span>
                                </div>
                              </div>
                            </div>
                            <StatusPill status={review.status} />
                          </div>

                          <p className="text-[13px] leading-relaxed text-black/60">{review.comment}</p>

                          {/* Flag reason */}
                          <div className="flex items-center gap-2.5 rounded-lg border border-amber-100 bg-amber-50 px-3.5 py-2.5">
                            <span className="text-amber-500 text-[13px]">⚠</span>
                            <span className="text-[12px] font-medium text-amber-700">{review.flagReason}</span>
                          </div>

                          {/* Response editor */}
                          {editingId === review.id ? (
                            <div className="space-y-3">
                              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/35">Your response</p>
                              <Textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                placeholder="Write a professional response..."
                                className="min-h-[100px] resize-none border-black/[0.08] bg-[#f9fafb] text-[13px] text-black placeholder:text-black/25 focus-visible:ring-[#0055ff]/20"
                              />
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => approve(review.id)}
                                  disabled={reviewActionLoadingId === review.id}
                                  className="h-9 rounded-lg bg-[#0055ff] text-[12px] font-semibold text-white hover:bg-[#0044dd] disabled:opacity-60"
                                >
                                  {reviewActionLoadingId === review.id ? "Posting..." : "Post response"}
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => setEditingId(null)}
                                  className="h-9 rounded-lg border-black/[0.08] text-[12px] font-semibold text-black/50 hover:text-black"
                                >
                                  Cancel
                                </Button>
                              </div>
                              {reviewActionError && (
                                <p className="text-[12px] font-medium text-red-600">{reviewActionError}</p>
                              )}
                            </div>
                          ) : (
                            <Button
                              onClick={() => { setEditingId(review.id); setEditText(review.response || ""); setReviewActionError(null); }}
                              className="h-9 rounded-lg bg-[#0055ff] text-[12px] font-semibold text-white hover:bg-[#0044dd]"
                            >
                              Write response
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Recent activity */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[13px] font-bold text-black">Recent Activity</h2>
            <span className="text-[11px] font-medium text-black/30">{posted} auto-posted</span>
          </div>

          <div className="space-y-3">
            {reviews
              .filter((r) => r.status !== "held")
              .map((review, i) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.06 }}
                >
                  <div className="rounded-xl border border-black/[0.06] bg-white p-6 shadow-[0_1px_6px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-shadow duration-300">
                    {/* Reviewer row */}
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={review.reviewer} />
                        <div>
                          <div className="text-[14px] font-semibold text-black">{review.reviewer}</div>
                          <div className="mt-0.5 flex items-center gap-2">
                            <Stars rating={review.rating} />
                            <span className="text-[11px] text-black/30">{review.time}</span>
                          </div>
                        </div>
                      </div>
                      <StatusPill status={review.status} />
                    </div>

                    {/* Review text */}
                    <p className="text-[13px] leading-relaxed text-black/55 mb-0">{review.comment}</p>

                    {/* Auto response */}
                    {review.response && (
                      <>
                        <Separator className="my-4 bg-black/[0.05]" />
                        <div className="flex gap-3">
                          <div className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-[#0055ff] flex items-center justify-center">
                            <span className="text-white text-[7px] font-black">S</span>
                          </div>
                          <div>
                            <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#0055ff]">
                              Solsara · Auto-replied
                            </div>
                            <p className="text-[13px] leading-relaxed text-black/55">{review.response}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
          </div>
        </section>
          </>
        )}

        {/* Missed Call Net module */}
        {activeNav === "missed" && !businessId && (
          <div className="rounded-xl border border-amber-100 bg-amber-50 p-6 mb-6">
            <p className="text-[13px] font-medium text-amber-700">📋 No business selected</p>
            <p className="mt-2 text-[12px] text-amber-600/70">
              Connect your Google business to enable Missed Call Net.
            </p>
            <Link href="/api/auth/google" className="mt-4 inline-block">
              <Button className="h-9 rounded-lg bg-[#0055ff] text-[12px] font-semibold text-white hover:bg-[#0044dd]">
                Connect Business
              </Button>
            </Link>
          </div>
        )}

        {activeNav === "missed" && businessId && (
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Left: Setup wizard / status */}
            <div className="space-y-4">
              {missedError && (
                <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-[12px] font-medium text-red-700">
                  ⚠️ {missedError}
                </div>
              )}
              {loadingMissed && (
                <div className="rounded-xl border border-black/[0.06] bg-white p-4 text-[12px] font-medium text-black/40">
                  Loading Missed Call Net...
                </div>
              )}
              {!smsSetupComplete ? (
                <div className="rounded-xl border border-black/[0.06] bg-white p-6 shadow-[0_1px_6px_rgba(0,0,0,0.04)]">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/30">Setup wizard</p>
                      <h2 className="mt-1 text-[16px] font-bold text-black">Set it once. Never touch it again.</h2>
                    </div>
                    <span className="rounded-full bg-black/[0.05] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-black/40">
                      Step {smsStep} of 3
                    </span>
                  </div>

                  {smsStep === 1 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-[12px] text-black/60">
                        <button
                          onClick={() => setUseExistingTwilio((v) => !v)}
                          className={cn(
                            "h-5 w-9 rounded-full border transition-colors",
                            useExistingTwilio ? "bg-[#0055ff] border-[#0055ff]" : "bg-white border-black/20"
                          )}
                        >
                          <span
                            className={cn(
                              "block h-4 w-4 rounded-full bg-white shadow transition-transform",
                              useExistingTwilio ? "translate-x-4" : "translate-x-0"
                            )}
                          />
                        </button>
                        Use my existing Twilio number (trial accounts only get one)
                      </div>

                      {useExistingTwilio && (
                        <div>
                          <p className="text-[13px] font-semibold text-black">Your Twilio number</p>
                          <input
                            className="mt-3 w-full rounded-xl border border-black/[0.09] bg-[#f9fafb] px-4 py-3 text-[14px] font-medium text-black outline-none placeholder:text-black/30 focus:border-[#0055ff]/40 focus:bg-white focus:ring-2 focus:ring-[#0055ff]/10"
                            placeholder="+18445551234"
                            value={existingTwilioNumber}
                            onChange={(e) => setExistingTwilioNumber(e.target.value)}
                          />
                        </div>
                      )}

                      <div>
                        <p className="text-[13px] font-semibold text-black">
                          What’s your current business phone number? We’ll buy you a local number in the same area code.
                        </p>
                        <input
                          className="mt-3 w-full rounded-xl border border-black/[0.09] bg-[#f9fafb] px-4 py-3 text-[14px] font-medium text-black outline-none placeholder:text-black/30 focus:border-[#0055ff]/40 focus:bg-white focus:ring-2 focus:ring-[#0055ff]/10"
                          placeholder="(704) 555-0123"
                          value={businessPhone}
                          onChange={(e) => setBusinessPhone(e.target.value)}
                        />
                      </div>
                      <Button
                        onClick={async () => {
                          if (!businessId) return;
                          try {
                            setSmsActionLoading(true);
                            setMissedError(null);
                            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
                            const endpoint = useExistingTwilio ? "attach" : "provision";
                            const payload = useExistingTwilio
                              ? { real_number: businessPhone, twilio_number: existingTwilioNumber }
                              : { real_number: businessPhone };
                            const res = await fetch(`${backendUrl}/calls/${endpoint}?business_id=${businessId}`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify(payload),
                            });
                            if (!res.ok) {
                              let detail = "";
                              try {
                                const errData = await res.json();
                                detail = errData.detail ? `: ${errData.detail}` : "";
                              } catch {
                                // ignore parse errors
                              }
                              throw new Error(`Provision failed: ${res.status}${detail}`);
                            }
                            const data = await res.json();
                            setTwilioNumber(data.twilio_number || "");
                            setSmsStep(2);
                          } catch (err) {
                            setMissedError(err instanceof Error ? err.message : "Failed to provision number");
                          } finally {
                            setSmsActionLoading(false);
                          }
                        }}
                        disabled={!businessPhone.trim() || (useExistingTwilio && !existingTwilioNumber.trim()) || smsActionLoading}
                        className="h-10 w-full rounded-lg bg-black text-[12px] font-semibold text-white hover:bg-black/85 disabled:opacity-50"
                      >
                        {smsActionLoading ? "Provisioning..." : "Continue →"}
                      </Button>
                    </div>
                  )}

                  {smsStep === 2 && (
                    <div className="space-y-4">
                      <div>
                        <p className="text-[13px] font-semibold text-black">Customize your message</p>
                        <Textarea
                          value={defaultMessage}
                          onChange={(e) => setDefaultMessage(e.target.value.slice(0, 160))}
                          className="mt-3 min-h-[110px] resize-none border-black/[0.08] bg-[#f9fafb] text-[13px] text-black placeholder:text-black/25 focus-visible:ring-[#0055ff]/20"
                        />
                        <div className="mt-2 flex items-center justify-between text-[11px] text-black/35">
                          <span>Characters</span>
                          <span className={cn("font-semibold", smsCharCount > 160 ? "text-red-500" : "text-black/60")}>
                            {smsCharCount}/160
                          </span>
                        </div>
                      </div>
                      <div className="rounded-lg border border-black/[0.06] bg-[#f9fafb] p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/30">Live preview</p>
                        <div className="mt-2 rounded-lg bg-white px-3 py-2.5 text-[12px] text-black/70 shadow-[0_1px_6px_rgba(0,0,0,0.05)]">
                          {defaultMessage || "Your message preview will appear here."}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setSmsStep(1)}
                          className="h-10 flex-1 rounded-lg border-black/[0.08] text-[12px] font-semibold text-black/50 hover:text-black"
                        >
                          Back
                        </Button>
                        <Button
                          onClick={async () => {
                            if (!businessId) return;
                            try {
                              setSmsActionLoading(true);
                              setMissedError(null);
                              const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
                              const res = await fetch(`${backendUrl}/calls/message?business_id=${businessId}`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ message: defaultMessage }),
                              });
                              if (!res.ok) {
                                throw new Error(`Message update failed: ${res.status}`);
                              }
                              setSmsStep(3);
                            } catch (err) {
                              setMissedError(err instanceof Error ? err.message : "Failed to save message");
                            } finally {
                              setSmsActionLoading(false);
                            }
                          }}
                          className="h-10 flex-1 rounded-lg bg-black text-[12px] font-semibold text-white hover:bg-black/85"
                        >
                          {smsActionLoading ? "Saving..." : "Continue →"}
                        </Button>
                      </div>
                    </div>
                  )}

                  {smsStep === 3 && (
                    <div className="space-y-4">
                      <div>
                        <p className="text-[13px] font-semibold text-black">
                          Enter your personal number to receive a test message right now.
                        </p>
                        <input
                          className="mt-3 w-full rounded-xl border border-black/[0.09] bg-[#f9fafb] px-4 py-3 text-[14px] font-medium text-black outline-none placeholder:text-black/30 focus:border-[#0055ff]/40 focus:bg-white focus:ring-2 focus:ring-[#0055ff]/10"
                          placeholder="(704) 555-0170"
                          value={testNumber}
                          onChange={(e) => setTestNumber(e.target.value)}
                        />
                      </div>
                      <Button
                        onClick={async () => {
                          if (!businessId) return;
                          try {
                            setSmsActionLoading(true);
                            setMissedError(null);
                            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
                            const res = await fetch(`${backendUrl}/calls/test?business_id=${businessId}`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ to_number: testNumber }),
                            });
                            if (!res.ok) {
                              throw new Error(`Test SMS failed: ${res.status}`);
                            }
                            setSmsSetupComplete(true);
                          } catch (err) {
                            setMissedError(err instanceof Error ? err.message : "Failed to send test message");
                          } finally {
                            setSmsActionLoading(false);
                          }
                        }}
                        disabled={!testNumber.trim() || smsActionLoading}
                        className="h-10 w-full rounded-lg bg-[#0055ff] text-[12px] font-semibold text-white hover:bg-[#0044dd] disabled:opacity-50"
                      >
                        {smsActionLoading ? "Sending..." : "Send test message & finish setup"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setSmsStep(2)}
                        className="h-10 w-full rounded-lg border-black/[0.08] text-[12px] font-semibold text-black/50 hover:text-black"
                      >
                        Back
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-black/[0.06] bg-white p-6 shadow-[0_1px_6px_rgba(0,0,0,0.04)]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/30">Live</p>
                      <h2 className="mt-1 text-[16px] font-bold text-black">Missed Call Net is active</h2>
                      <p className="mt-1 text-[12px] text-black/45">Set once. It runs forever.</p>
                    </div>
                    <button
                      onClick={async () => {
                        if (!businessId) return;
                        try {
                          setSmsActionLoading(true);
                          setMissedError(null);
                          const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
                          const nextPaused = !smsPaused;
                          const res = await fetch(`${backendUrl}/calls/pause?business_id=${businessId}`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ paused: nextPaused }),
                          });
                          if (!res.ok) {
                            throw new Error(`Pause toggle failed: ${res.status}`);
                          }
                          setSmsPaused(nextPaused);
                        } catch (err) {
                          setMissedError(err instanceof Error ? err.message : "Failed to update pause state");
                        } finally {
                          setSmsActionLoading(false);
                        }
                      }}
                      disabled={smsActionLoading}
                      className={cn(
                        "rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider disabled:opacity-50",
                        smsPaused
                          ? "bg-amber-50 text-amber-700"
                          : "bg-emerald-50 text-emerald-700"
                      )}
                    >
                      {smsPaused ? "Paused" : "Running"}
                    </button>
                  </div>

                  <div className="mt-5 rounded-lg border border-black/[0.06] bg-[#f9fafb] p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/30">Your Solsara number</p>
                    <div className="mt-2 text-[18px] font-black text-black">{twilioNumber}</div>
                    <p className="mt-1 text-[11px] text-black/40">Use this on Google so missed callers get an instant text.</p>
                  </div>

                  <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-[12px] font-bold text-black">Missed calls</h3>
                      <span className="text-[10px] font-semibold text-black/35">Last 7 days</span>
                    </div>
                    <div className="mb-3 rounded-lg border border-black/[0.06] bg-[#f9fafb] p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          className="flex-1 min-w-[200px] rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-[12px] text-black outline-none placeholder:text-black/30 focus:border-[#0055ff]/40"
                          placeholder="Your phone number for a test SMS"
                          value={testNumber}
                          onChange={(e) => setTestNumber(e.target.value)}
                        />
                        <Button
                          onClick={async () => {
                            if (!businessId) return;
                            try {
                              setSmsActionLoading(true);
                              setMissedError(null);
                              const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
                              const res = await fetch(`${backendUrl}/calls/test?business_id=${businessId}`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ to_number: testNumber }),
                              });
                              if (!res.ok) {
                                let detail = "";
                                try {
                                  const errData = await res.json();
                                  detail = errData.detail ? `: ${errData.detail}` : "";
                                } catch {
                                  // ignore
                                }
                                throw new Error(`Resend failed: ${res.status}${detail}`);
                              }
                            } catch (err) {
                              setMissedError(err instanceof Error ? err.message : "Failed to send test message");
                            } finally {
                              setSmsActionLoading(false);
                            }
                          }}
                          disabled={!testNumber.trim() || smsActionLoading}
                          className="h-8 rounded-lg bg-[#0055ff] px-3 text-[11px] font-semibold text-white hover:bg-[#0044dd] disabled:opacity-50"
                        >
                          {smsActionLoading ? "Sending..." : "Resend test SMS"}
                        </Button>
                      </div>
                      <p className="mt-2 text-[10px] text-black/35">Didn’t get anything? Resend a test message to confirm delivery.</p>
                    </div>
                    <div className="space-y-2">
                      {missedLogs.map((log) => (
                        <div
                          key={log.id}
                          className="flex items-center justify-between rounded-lg border border-black/[0.06] bg-white px-3 py-2"
                        >
                          <div>
                            <div className="text-[12px] font-semibold text-black">{log.number}</div>
                            <div className="text-[10px] text-black/35">{log.time}</div>
                          </div>
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider",
                              log.sent ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                            )}
                          >
                            {log.sent ? "SMS sent" : "Paused"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Summary */}
            <div className="space-y-4">
              <div className="rounded-xl border border-black/[0.06] bg-white p-6 shadow-[0_1px_6px_rgba(0,0,0,0.04)]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/30">How it works</p>
                <ol className="mt-3 space-y-3 text-[13px] text-black/60">
                  <li className="flex gap-2">
                    <span className="text-black/30">1.</span>
                    A caller hits voicemail.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-black/30">2.</span>
                    Solsara auto-texts them your message.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-black/30">3.</span>
                    They reply, and you convert the lead.
                  </li>
                </ol>
              </div>

              <div className="rounded-xl border border-black/[0.06] bg-white p-6 shadow-[0_1px_6px_rgba(0,0,0,0.04)]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/30">Message preview</p>
                <div className="mt-3 rounded-lg bg-[#f9fafb] p-4 text-[12px] text-black/70">
                  {defaultMessage || "Your default message will appear here."}
                </div>
                <p className="mt-2 text-[11px] text-black/35">Keep it short and human — under 160 characters.</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-[#f7f9fc] px-6">
          <div className="rounded-xl border border-black/[0.06] bg-white px-5 py-4 text-[13px] font-medium text-black/45 shadow-[0_1px_6px_rgba(0,0,0,0.04)]">
            Loading dashboard...
          </div>
        </main>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
