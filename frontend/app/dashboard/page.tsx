"use client";

import { useState } from "react";
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
  { id: "missed",       label: "Missed Call Net",   icon: "⌁", soon: true },
  { id: "gemini",       label: "Gemini Feeder",     icon: "◇", soon: true },
  { id: "social",       label: "Social Proof",      icon: "▣", soon: true },
  { id: "receptionist", label: "Text Receptionist", icon: "⊡", soon: true },
];

const MOCK_REVIEWS = [
  {
    id: 1,
    reviewer: "James Thornton",
    rating: 5,
    comment: "Absolutely outstanding service. The team went above and beyond every expectation I had. Best experience in years.",
    time: "2h ago",
    status: "posted",
    response: "Thank you so much James! We truly appreciate your kind words and are thrilled we could exceed your expectations. Hope to see you again soon!",
    flagReason: undefined as string | undefined,
  },
  {
    id: 2,
    reviewer: "Sarah Mitchell",
    rating: 1,
    comment: "I got food poisoning after eating here. Been sick for two days. This is completely unacceptable and I'm considering legal action.",
    time: "4h ago",
    status: "held",
    response: null as string | null,
    flagReason: "Health complaint + legal threat detected",
  },
  {
    id: 3,
    reviewer: "David Park",
    rating: 4,
    comment: "Really solid experience overall. The staff were friendly and the quality was great. Would definitely recommend to friends.",
    time: "6h ago",
    status: "posted",
    response: "Thanks so much David! We're really glad you had a great experience and we appreciate the recommendation.",
    flagReason: undefined as string | undefined,
  },
  {
    id: 4,
    reviewer: "Emma Rodriguez",
    rating: 3,
    comment: "Decent place but the wait time was longer than expected. Food quality was good though.",
    time: "1d ago",
    status: "posted",
    response: "Hi Emma, thank you for the honest feedback! We're actively working on our wait times and hope to give you a much faster experience next visit.",
    flagReason: undefined as string | undefined,
  },
  {
    id: 5,
    reviewer: "Michael Chen",
    rating: 5,
    comment: "Incredible attention to detail. You can tell the team really cares about what they do.",
    time: "2d ago",
    status: "posted",
    response: "Michael, this genuinely made our day — thank you! We do care deeply and it means everything to hear that it shows.",
    flagReason: undefined as string | undefined,
  },
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
export default function Dashboard() {
  const [reviews, setReviews] = useState(MOCK_REVIEWS);
  const [activeNav, setActiveNav] = useState("reviews");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  const posted = reviews.filter((r) => r.status === "posted").length;
  const held = reviews.filter((r) => r.status === "held").length;
  const avg = (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1);

  function approve(id: number) {
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status: "posted", response: editText } : r)));
    setEditingId(null);
    setEditText("");
  }

  return (
    <div className="flex min-h-screen bg-[#f7f9fc]">

      {/* ─ Sidebar ──────────────────────────────────── */}
      <aside className="hidden md:flex md:fixed md:inset-y-0 md:left-0 md:w-60 flex-col bg-white border-r border-black/[0.06]">

        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-black/[0.05]">
          <Link href="/" className="no-underline">
            <span className="text-[15px] font-black tracking-tight text-black">
              Sol<span className="text-[#0055ff]">sara</span>
            </span>
          </Link>
          <span className="rounded-full bg-[#f0f5ff] px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-[#0055ff]">
            v1
          </span>
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

        {/* Google status */}
        <div className="border-t border-black/[0.05] px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[11px] font-semibold text-emerald-600">Google connected</span>
          </div>
          <p className="mt-1 text-[10px] text-black/30">Last sync · 2 min ago</p>
        </div>
      </aside>

      {/* ─ Main ─────────────────────────────────────── */}
      <main className="flex-1 md:ml-60 px-6 pt-8 pb-16 md:px-10">

        {/* Header */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-black tracking-[-0.03em] text-black">Review Replies</h1>
            <p className="mt-1 text-[12px] font-medium text-black/40">
              Monitoring · Auto-responding · 24/7
            </p>
          </div>
          <Button
            variant="outline"
            className="h-9 rounded-lg border-black/[0.08] bg-white text-[12px] font-semibold text-black/50 hover:border-black/20 hover:text-black shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
          >
            Settings
          </Button>
        </div>

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
        <AnimatePresence>
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
                    <motion.div key={review.id} layout>
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
                                  className="h-9 rounded-lg bg-[#0055ff] text-[12px] font-semibold text-white hover:bg-[#0044dd]"
                                >
                                  Post response
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => setEditingId(null)}
                                  className="h-9 rounded-lg border-black/[0.08] text-[12px] font-semibold text-black/50 hover:text-black"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              onClick={() => { setEditingId(review.id); setEditText(""); }}
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
      </main>
    </div>
  );
}
