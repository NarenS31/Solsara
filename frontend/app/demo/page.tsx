"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";

/* ─── Fake business data ─────────────────────────────────────── */
const BUSINESS = {
  name: "Marco's Italian Kitchen",
  location: "Austin, TX",
  rating: 4.7,
  totalReviews: 312,
  photo: "🍝",
};

/* ─── Incoming review pool ───────────────────────────────────── */
const INCOMING_REVIEWS = [
  {
    id: 101,
    name: "Tyler B.",
    rating: 5,
    text: "Best pasta I've had outside of Italy. The carbonara is unreal. We're coming back every week.",
    initials: "TB",
    hue: 220,
  },
  {
    id: 102,
    name: "Priya S.",
    rating: 4,
    text: "Great food and atmosphere. Service was a little slow but the tiramisu made up for everything.",
    initials: "PS",
    hue: 280,
  },
  {
    id: 103,
    name: "Derek O.",
    rating: 5,
    text: "Took my wife here for our anniversary. They remembered our reservation and had a candle on the table. Absolute class.",
    initials: "DO",
    hue: 160,
  },
  {
    id: 104,
    name: "Lisa M.",
    rating: 3,
    text: "Food was good but we waited 25 minutes for our table even with a reservation. Would still recommend the lasagna though.",
    initials: "LM",
    hue: 30,
  },
];

/* ─── Pre-written AI responses ───────────────────────────────── */
const AI_RESPONSES: Record<number, string> = {
  101: "Tyler, you just made our whole team's day! The carbonara is our chef's pride and joy — can't wait to see you back at the table soon. 🍝",
  102: "Thanks so much Priya! We're working hard on our service times — your feedback genuinely helps. And we'll let the tiramisu know it saved the day! 😄",
  103: "This truly means the world to us Derek. Anniversary dinners are something we take to heart. Wishing you both many more special evenings ahead.",
  104: "Hi Lisa, thank you for being honest with us. A 25-minute wait is not acceptable and we're addressing it directly. Your loyalty means a lot — see you next time!",
};

/* ─── Existing reviews ───────────────────────────────────────── */
const INITIAL_REVIEWS = [
  {
    id: 1,
    name: "James T.",
    rating: 5,
    text: "Absolutely outstanding. Authentic flavors, warm service, and the kind of place that instantly feels like home.",
    response: "James, grazie mille! This is exactly the feeling we work every day to create. See you again soon! 🙏",
    time: "2h ago",
    initials: "JT",
    hue: 200,
  },
  {
    id: 2,
    name: "Sarah M.",
    rating: 4,
    text: "Really solid experience. The focaccia bread basket alone is worth the trip.",
    response: "Haha, we'll pass that on to our baker Sarah — she'll be thrilled! Thanks for the kind words.",
    time: "5h ago",
    initials: "SM",
    hue: 320,
  },
  {
    id: 3,
    name: "David P.",
    rating: 5,
    text: "Came in on a Tuesday night, wasn't expecting much. Left absolutely blown away. 10/10.",
    response: "Tuesday nights are secretly our best kept secret 😄 So glad we got to surprise you David — come back anytime!",
    time: "1d ago",
    initials: "DP",
    hue: 140,
  },
];

/* ─── Helpers ────────────────────────────────────────────────── */
function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  return (
    <div className={cn("flex gap-px", size === "lg" ? "text-[16px]" : "text-[12px]")}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= rating ? "text-amber-400" : "text-black/10"}>★</span>
      ))}
    </div>
  );
}

function Avatar({ initials, hue, size = "md" }: { initials: string; hue: number; size?: "sm" | "md" }) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-bold text-white",
        size === "sm" ? "h-8 w-8 text-[11px]" : "h-10 w-10 text-[13px]"
      )}
      style={{ background: `hsl(${hue}, 50%, 55%)` }}
    >
      {initials}
    </div>
  );
}

/* ─── Typing animation ───────────────────────────────────────── */
function TypedText({ text, onDone }: { text: string; onDone: () => void }) {
  const [displayed, setDisplayed] = useState("");
  const idx = useRef(0);

  useEffect(() => {
    idx.current = 0;
    setDisplayed("");
    const interval = setInterval(() => {
      idx.current += 1;
      setDisplayed(text.slice(0, idx.current));
      if (idx.current >= text.length) {
        clearInterval(interval);
        setTimeout(onDone, 400);
      }
    }, 18);
    return () => clearInterval(interval);
  }, [text, onDone]);

  return (
    <span>
      {displayed}
      {displayed.length < text.length && (
        <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-[#0055ff]" />
      )}
    </span>
  );
}

/* ─── Live demo section ──────────────────────────────────────── */
type ReviewState = "idle" | "incoming" | "typing" | "done";

interface LiveReview {
  id: number;
  name: string;
  rating: number;
  text: string;
  initials: string;
  hue: number;
  response?: string;
  time: string;
}

const DEMO_RULES = [
  { id: "r1", text: "Sound human and genuine, not like a template", locked: true },
  { id: "r2", text: "Be 2–4 sentences max", locked: true },
  { id: "r3", text: "Thank the reviewer by name", locked: true },
  { id: "r4", text: "Address the specific things they mentioned", locked: true },
  { id: "r5", text: "For negative reviews, acknowledge and invite them to reach out directly", locked: true },
  { id: "r6", text: "Never make promises you can't keep", locked: true },
  { id: "r7", text: "Never mention staff names unless the reviewer did", locked: true },
  { id: "r8", text: "Never use em dashes or AI-sounding formatting", locked: true },
];

export default function Demo() {
  const [reviews, setReviews] = useState<LiveReview[]>(
    INITIAL_REVIEWS.map((r) => ({ ...r }))
  );
  const [state, setState] = useState<ReviewState>("idle");
  const [activeReview, setActiveReview] = useState<typeof INCOMING_REVIEWS[0] | null>(null);
  const [stats, setStats] = useState({ total: 312, posted: 3, rate: "100%", avg: "4.7" });
  const [usedIds, setUsedIds] = useState<number[]>([]);
  const [pulseStats, setPulseStats] = useState(false);
  const nextRef = useRef(0);
  const [rules, setRules] = useState(DEMO_RULES);
  const [newRule, setNewRule] = useState("");
  const [showRules, setShowRules] = useState(false);
  const [tone, setTone] = useState("warm");
  const [liveResponse, setLiveResponse] = useState("");
  const [llmError, setLlmError] = useState(false);

  function getNextReview() {
    const remaining = INCOMING_REVIEWS.filter((r) => !usedIds.includes(r.id));
    if (remaining.length === 0) {
      setUsedIds([]);
      return INCOMING_REVIEWS[0];
    }
    return remaining[nextRef.current % remaining.length];
  }

  async function simulateReview() {
    if (state !== "idle") return;
    const review = getNextReview();
    nextRef.current += 1;
    setUsedIds((prev) => [...prev, review.id]);
    setActiveReview(review);
    setLiveResponse("");
    setLlmError(false);
    setState("incoming");

    // Fetch from real LLM while the "incoming" animation plays
    try {
      const customRules = rules.filter((r) => !r.locked).map((r) => r.text);
      const res = await fetch("/api/demo/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewer_name: review.name,
          rating: review.rating,
          review_text: review.text,
          tone,
          custom_rules: customRules,
        }),
      });
      const data = await res.json();
      setLiveResponse(data.response || AI_RESPONSES[review.id]);
    } catch {
      // Backend not running — fall back to hardcoded responses
      setLiveResponse(AI_RESPONSES[review.id]);
      setLlmError(true);
    }
  }

  function handleTypingDone() {
    const review = activeReview!;
    const response = liveResponse || AI_RESPONSES[review.id];
    const newReview: LiveReview = {
      ...review,
      response,
      time: "just now",
    };
    setReviews((prev) => [newReview, ...prev]);
    setStats((prev) => ({
      total: prev.total + 1,
      posted: prev.posted + 1,
      rate: "100%",
      avg: ((parseFloat(prev.avg) * prev.total + review.rating) / (prev.total + 1)).toFixed(1),
    }));
    setPulseStats(true);
    setTimeout(() => setPulseStats(false), 1200);
    setState("done");
    setTimeout(() => {
      setState("idle");
      setActiveReview(null);
    }, 2000);
  }

  return (
    <div className="min-h-screen bg-[#f7f9fc]">

      {/* ─ Top bar ───────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-black/[0.06] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 md:px-10">
          <div className="flex items-center gap-4">
            <Link href="/" className="no-underline">
              <span className="text-[15px] font-black tracking-tight text-black">
                Sol<span className="text-[#0055ff]">sara</span>
              </span>
            </Link>
            <div className="hidden items-center gap-2 rounded-full bg-[#f0f5ff] px-3 py-1 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0055ff] animate-pulse" />
              <span className="text-[11px] font-semibold text-[#0055ff]">Interactive Demo</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/onboarding"
              className="h-9 rounded-full bg-black px-5 text-[12px] font-semibold text-white no-underline flex items-center hover:bg-black/85 transition-colors"
            >
              Start free trial →
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-10 md:px-10">

        {/* ─ Hero callout ──────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 rounded-2xl border border-[#0055ff]/15 bg-white p-6 shadow-[0_2px_20px_rgba(0,85,255,0.06)]"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f0f5ff] text-3xl">
                {BUSINESS.photo}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-[18px] font-black tracking-tight text-black">{BUSINESS.name}</h1>
                  <span className="rounded-full bg-[#f0f5ff] px-2.5 py-0.5 text-[10px] font-bold text-[#0055ff] uppercase tracking-wider">Demo</span>
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-[12px] text-black/40 font-medium">
                  <Stars rating={5} />
                  <span>{BUSINESS.rating} · {stats.total} reviews · {BUSINESS.location}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1 md:text-right">
              <p className="text-[13px] font-medium text-black/50">
                This is a live demo. Hit the button below to watch Solsara respond to a real review in real time.
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">

          {/* ─ Left: Activity feed ───────────────────── */}
          <div className="space-y-4">

            <div className="flex items-center justify-between">
              <h2 className="text-[13px] font-bold text-black">Review Feed</h2>
              <span className="text-[11px] font-medium text-black/30">{reviews.length} reviews</span>
            </div>

            {/* Incoming review animation */}
            <AnimatePresence>
              {activeReview && state !== "idle" && (
                <motion.div
                  key="incoming"
                  initial={{ opacity: 0, y: -16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="relative overflow-hidden rounded-xl border border-[#0055ff]/20 bg-white shadow-[0_4px_24px_rgba(0,85,255,0.1)]"
                >
                  {/* Blue top bar */}
                  <div className="h-0.5 w-full bg-gradient-to-r from-[#0055ff] to-[#4d90ff]" />

                  <div className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar initials={activeReview.initials} hue={activeReview.hue} />
                        <div>
                          <div className="text-[14px] font-semibold text-black">{activeReview.name}</div>
                          <div className="mt-0.5 flex items-center gap-2">
                            <Stars rating={activeReview.rating} />
                            <span className="text-[10px] text-black/30">just now · Google</span>
                          </div>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full bg-[#f0f5ff] px-2.5 py-1 text-[10px] font-bold text-[#0055ff] uppercase tracking-wider">
                        New review
                      </span>
                    </div>

                    <p className="text-[13px] leading-relaxed text-black/60">{activeReview.text}</p>

                    {/* AI responding section */}
                    {(state === "typing" || state === "done") && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        transition={{ duration: 0.3 }}
                        className="border-t border-black/[0.05] pt-3"
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0055ff]">
                            <span className="text-[9px] font-black text-white">S</span>
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#0055ff]">
                            Solsara · Responding now
                          </span>
                        </div>
                        <p className="text-[13px] leading-relaxed text-black/70 pl-7">
                          {state === "typing" ? (
                            <TypedText
                              text={liveResponse}
                              onDone={() => {
                                setState("done");
                                setTimeout(handleTypingDone, 300);
                              }}
                            />
                          ) : (
                            liveResponse
                          )}
                        </p>
                      </motion.div>
                    )}

                    {/* Trigger typing once LLM response arrives */}
                    {state === "incoming" && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onAnimationComplete={() => {
                          // Poll until liveResponse is populated, then switch to typing
                          const wait = () => {
                            if (liveResponse) {
                              setState("typing");
                            } else {
                              setTimeout(wait, 150);
                            }
                          };
                          setTimeout(wait, 400);
                        }}
                        className="flex items-center gap-2 border-t border-black/[0.05] pt-3"
                      >
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0055ff]/10">
                          <span className="text-[9px] font-black text-[#0055ff]">S</span>
                        </div>
                        <div className="flex gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-black/20 animate-bounce [animation-delay:0ms]" />
                          <span className="h-1.5 w-1.5 rounded-full bg-black/20 animate-bounce [animation-delay:150ms]" />
                          <span className="h-1.5 w-1.5 rounded-full bg-black/20 animate-bounce [animation-delay:300ms]" />
                        </div>
                        <span className="text-[11px] text-black/30 font-medium">AI crafting response...</span>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Review history */}
            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {reviews.map((review, i) => (
                  <motion.div
                    key={review.id}
                    layout
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i === 0 ? 0 : 0 }}
                    className="rounded-xl border border-black/[0.06] bg-white p-5 shadow-[0_1px_6px_rgba(0,0,0,0.03)]"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar initials={review.initials} hue={review.hue} size="sm" />
                        <div>
                          <div className="text-[13px] font-semibold text-black">{review.name}</div>
                          <div className="mt-0.5 flex items-center gap-2">
                            <Stars rating={review.rating} />
                            <span className="text-[10px] text-black/25">{review.time}</span>
                          </div>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-emerald-600">
                        <span className="h-1 w-1 rounded-full bg-emerald-400" />
                        Auto-posted
                      </span>
                    </div>

                    <p className="mb-3 text-[13px] leading-relaxed text-black/50">{review.text}</p>

                    {review.response && (
                      <div className="border-t border-black/[0.04] pt-3">
                        <div className="flex gap-2.5">
                          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0055ff]">
                            <span className="text-[8px] font-black text-white">S</span>
                          </div>
                          <div>
                            <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#0055ff]">
                              Solsara · Auto-replied
                            </div>
                            <p className="text-[13px] leading-relaxed text-black/55">{review.response}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* ─ Right: sticky control panel ───────────── */}
          <div className="space-y-4 lg:sticky lg:top-[73px] lg:self-start lg:max-h-[calc(100vh-90px)] lg:overflow-y-auto lg:pb-4">

            {/* Simulate button */}
            <button
              onClick={simulateReview}
              disabled={state !== "idle"}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-[13px] font-bold transition-all duration-200",
                state === "idle"
                  ? "bg-[#0055ff] text-white hover:bg-[#0044dd] hover:scale-[1.01] active:scale-[0.99] shadow-[0_2px_16px_rgba(0,85,255,0.3)]"
                  : "bg-black/[0.06] text-black/25 cursor-not-allowed"
              )}
            >
              {state === "idle" && (
                <>
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[10px]">▶</span>
                  Simulate incoming review
                </>
              )}
              {state === "incoming" && (
                <>
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="5" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                    <path d="M7 2a5 5 0 0 1 5 5" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Fetching AI response...
                </>
              )}
              {(state === "typing" || state === "done") && (
                <>
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="5" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                    <path d="M7 2a5 5 0 0 1 5 5" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  AI typing response...
                </>
              )}
            </button>

            {/* Tone selector */}
            <div className="rounded-xl border border-black/[0.06] bg-white p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-[12px] font-bold text-black">Response tone</h2>
                {llmError ? (
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-amber-500">
                    Offline · preview mode
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live AI
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: "warm",         label: "Warm & personal" },
                  { id: "professional", label: "Professional" },
                  { id: "casual",       label: "Casual & fun" },
                  { id: "premium",      label: "Premium" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setTone(opt.id)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-[11px] font-semibold text-left transition-all duration-150",
                      tone === opt.id
                        ? "border-[#0055ff]/30 bg-[#f0f5ff] text-[#0055ff]"
                        : "border-black/[0.07] bg-[#f9fafb] text-black/45 hover:border-black/15 hover:text-black/70"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-black/30 font-medium">
                Change tone, add a rule, then simulate a review — the AI response updates in real time.
              </p>
            </div>

            {/* Stats */}
            <div className="space-y-3">
              <h2 className="text-[13px] font-bold text-black">Live Stats</h2>
              {[
                { label: "Total Reviews",   value: stats.total, color: "text-black",       bg: "bg-[#f9fafb]",    note: "All time" },
                { label: "Auto-Posted",      value: stats.posted, color: "text-[#0055ff]",  bg: "bg-[#f0f5ff]",   note: "This session" },
                { label: "Response Rate",    value: stats.rate,  color: "text-emerald-600", bg: "bg-emerald-50",   note: "All time" },
                { label: "Avg. Rating",      value: stats.avg,   color: "text-amber-500",   bg: "bg-amber-50",     note: "Google score" },
              ].map((s) => (
                <motion.div
                  key={s.label}
                  animate={pulseStats ? { scale: [1, 1.02, 1] } : {}}
                  transition={{ duration: 0.4 }}
                  className={cn("rounded-xl border border-black/[0.05] p-4", s.bg)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/35 mb-1">{s.label}</div>
                      <div className={cn("text-[26px] font-black tracking-tight", s.color)}>{s.value}</div>
                    </div>
                    <div className="text-[11px] font-medium text-black/25">{s.note}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* How it works explainer */}
            <div className="rounded-xl border border-black/[0.06] bg-white p-5">
              <h3 className="text-[12px] font-bold text-black mb-3">What just happened</h3>
              <div className="space-y-3">
                {[
                  { n: "1", text: "Google notified Solsara of a new review", done: reviews.length > 3 },
                  { n: "2", text: "AI read the review and matched your voice", done: reviews.length > 3 },
                  { n: "3", text: "Response crafted and posted in under 30s", done: reviews.length > 3 },
                  { n: "4", text: "Your stats updated automatically", done: reviews.length > 3 },
                ].map((step) => (
                  <div key={step.n} className="flex items-start gap-2.5">
                    <div className={cn(
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-colors duration-500",
                      step.done ? "bg-[#0055ff] text-white" : "bg-black/[0.06] text-black/30"
                    )}>
                      {step.done ? (
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                          <path d="M1.5 4l2 2 3-3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : step.n}
                    </div>
                    <span className={cn("text-[12px] font-medium leading-relaxed", step.done ? "text-black/60" : "text-black/30")}>
                      {step.text}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-black/25 font-medium">
                Hit "Simulate" again to watch it happen.
              </p>
            </div>

            {/* AI Rules */}
            <div className="rounded-xl border border-black/[0.07] overflow-hidden">
              <button
                onClick={() => setShowRules((v) => !v)}
                className="flex w-full items-center justify-between px-4 py-3.5 bg-[#f9fafb] hover:bg-[#f4f6f9] transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-5 w-5 items-center justify-center rounded-md bg-[#0055ff]/10">
                    <span className="text-[9px] font-black text-[#0055ff]">AI</span>
                  </div>
                  <span className="text-[12px] font-bold text-black">AI response rules</span>
                  <span className="rounded-full bg-black/[0.06] px-2 py-0.5 text-[10px] font-semibold text-black/40">
                    {rules.length}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-medium text-black/35">
                  {showRules ? "Hide" : "View & edit"}
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                    className={cn("transition-transform duration-200", showRules ? "rotate-180" : "")}>
                    <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </button>

              <AnimatePresence>
                {showRules && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-black/[0.06] bg-white p-4 space-y-2">
                      <p className="text-[11px] text-black/35 font-medium mb-2.5">
                        These rules go into every AI prompt. Add your own to see how responses change.
                      </p>

                      {rules.map((rule) => (
                        <div
                          key={rule.id}
                          className={cn(
                            "flex items-start gap-2 rounded-lg px-3 py-2",
                            rule.locked ? "bg-[#f9fafb]" : "bg-[#f0f5ff]"
                          )}
                        >
                          <div className={cn(
                            "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                            rule.locked ? "bg-black/[0.07]" : "bg-[#0055ff]/15"
                          )}>
                            {rule.locked ? (
                              <svg width="7" height="8" viewBox="0 0 7 8" fill="none">
                                <rect x="0.75" y="3.25" width="5.5" height="4" rx="0.75" stroke="#888" strokeWidth="1.2" />
                                <path d="M2 3.25V2.25A1.5 1.5 0 0 1 5 2.25v1" stroke="#888" strokeWidth="1.2" strokeLinecap="round" />
                              </svg>
                            ) : (
                              <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
                                <path d="M1 3.5l2 2 3-3" stroke="#0055ff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                          <span className={cn(
                            "flex-1 text-[11px] leading-relaxed",
                            rule.locked ? "text-black/50" : "font-medium text-[#0055ff]"
                          )}>
                            {rule.text}
                          </span>
                          {!rule.locked && (
                            <button
                              onClick={() => setRules((prev) => prev.filter((r) => r.id !== rule.id))}
                              className="shrink-0 text-black/20 hover:text-red-400 transition-colors text-[15px] leading-none mt-0.5"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}

                      <div className="flex gap-2 pt-1">
                        <input
                          className="flex-1 rounded-lg border border-black/[0.08] bg-[#f9fafb] px-3 py-2 text-[11px] font-medium text-black outline-none placeholder:text-black/25 focus:border-[#0055ff]/30 focus:ring-2 focus:ring-[#0055ff]/8 transition-all"
                          placeholder="Add a rule, e.g. 'Always mention our loyalty program'"
                          value={newRule}
                          onChange={(e) => setNewRule(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && newRule.trim()) {
                              setRules((prev) => [...prev, { id: `c-${Date.now()}`, text: newRule.trim(), locked: false }]);
                              setNewRule("");
                            }
                          }}
                        />
                        <button
                          onClick={() => {
                            if (!newRule.trim()) return;
                            setRules((prev) => [...prev, { id: `c-${Date.now()}`, text: newRule.trim(), locked: false }]);
                            setNewRule("");
                          }}
                          disabled={!newRule.trim()}
                          className="shrink-0 rounded-lg bg-[#0055ff] px-3 text-[11px] font-bold text-white disabled:opacity-30 hover:bg-[#0044dd] transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* CTA */}
            <div className="rounded-xl bg-[#0a0f1e] p-5 space-y-3">
              <div className="text-[15px] font-black tracking-tight text-white leading-snug">
                Ready to put your<br />reviews on autopilot?
              </div>
              <p className="text-[12px] text-white/40 font-medium leading-relaxed">
                Takes 3 minutes to set up. Your first auto-reply goes live today.
              </p>
              <Link
                href="/onboarding"
                className="block w-full rounded-xl bg-[#0055ff] py-3 text-center text-[13px] font-bold text-white no-underline hover:bg-[#0044dd] transition-colors"
              >
                Start free trial →
              </Link>
              <Link
                href="/"
                className="block text-center text-[11px] font-medium text-white/25 no-underline hover:text-white/50 transition-colors"
              >
                Back to homepage
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
