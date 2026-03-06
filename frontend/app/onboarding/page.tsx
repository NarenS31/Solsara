"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";

/* ─── Types ──────────────────────────────────────────────────── */
interface FormData {
  businessName: string;
  email: string;
  password: string;
  googleConnected: boolean;
  googleBusiness: string;
  voice: string;
  businessDescription: string;
  neverSay: string;
  exampleResponse: string;
}

/* ─── Motion ─────────────────────────────────────────────────── */
const SLIDE = {
  enter: (dir: number) => ({
    x: dir > 0 ? 40 : -40,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -40 : 40,
    opacity: 0,
    transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

/* ─── Shared input styles ────────────────────────────────────── */
const inputCls =
  "w-full rounded-xl border border-black/[0.09] bg-[#f9fafb] px-4 py-3 text-[14px] font-medium text-black outline-none placeholder:text-black/30 transition-all focus:border-[#0055ff]/40 focus:bg-white focus:ring-2 focus:ring-[#0055ff]/10";

/* ─── Step indicators ────────────────────────────────────────── */
const STEPS = [
  { n: 1, label: "Google" },
  { n: 2, label: "Voice" },
  { n: 3, label: "Payment" },
];

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {STEPS.map((s, i) => {
        const done = s.n < current;
        const active = s.n === current;
        return (
          <div key={s.n} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold transition-all duration-300",
                  done
                    ? "bg-[#0055ff] text-white"
                    : active
                    ? "bg-[#0055ff] text-white shadow-[0_0_0_4px_rgba(0,85,255,0.15)]"
                    : "bg-black/[0.06] text-black/30"
                )}
              >
                {done ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  s.n
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-semibold transition-colors",
                  active ? "text-[#0055ff]" : done ? "text-black/40" : "text-black/25"
                )}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="mb-4 h-px w-10 transition-colors duration-500" style={{ background: done ? "#0055ff" : "rgba(0,0,0,0.08)" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Step 1: Google OAuth ───────────────────────────────────── */
function StepGoogle({
  data,
  onChange,
  onNext,
  businessId,
}: {
  data: FormData;
  onChange: (k: keyof FormData, v: string | boolean) => void;
  onNext: () => void;
  businessId?: string | null;
}) {
  const [connecting, setConnecting] = useState(false);
  const alreadyConnected = !!businessId || data.googleConnected;

  function handleConnect() {
    // Real OAuth: redirect to backend
    window.location.href = "/api/auth/google";
    setConnecting(true);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[24px] font-black tracking-[-0.04em] text-black">Connect Google</h2>
        <p className="mt-1.5 text-[14px] text-black/45 font-medium">
          One click. We pull everything automatically — no manual entry.
        </p>
      </div>

      {/* What we get */}
      <div className="rounded-xl border border-black/[0.06] bg-[#f9fafb] p-4">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-black/30">What we get from Google</p>
        <div className="space-y-2">
          {[
            "Your business name & profile photo",
            "Your Google location ID",
            "Your existing reviews",
            "Your address and hours",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2.5 text-[13px] font-medium text-black/60">
              <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path d="M1.5 4l2 2 3-3" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Trust line */}
      <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
        <p className="text-[12px] font-semibold text-amber-800">
          We only access your reviews. We never edit your business info, hours, or listing details. Ever.
        </p>
        <p className="mt-1 text-[11px] text-amber-700/80">
          Google bundles review access under a broader permission, but we only call review read + reply endpoints.
        </p>
      </div>

      {/* OAuth button or success */}
      <AnimatePresence mode="wait">
        {alreadyConnected ? (
          <motion.div
            key="connected"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8l3.5 3.5L13 5" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <div className="text-[13px] font-bold text-emerald-700">Google connected</div>
              <div className="text-[12px] text-emerald-600/70">{data.googleBusiness || "Connected"}</div>
            </div>
          </motion.div>
        ) : (
          <motion.a
            key="connect"
            href="/api/auth/google"
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-black/[0.09] bg-white py-3.5 text-[14px] font-semibold text-black shadow-[0_1px_8px_rgba(0,0,0,0.06)] hover:border-black/20 hover:shadow-[0_2px_16px_rgba(0,0,0,0.1)] transition-all duration-200 no-underline"
          >
            {connecting ? (
              <>
                <svg className="animate-spin" width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="9" r="7" stroke="black" strokeOpacity="0.15" strokeWidth="2" />
                  <path d="M9 2a7 7 0 0 1 7 7" stroke="#0055ff" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Connecting...
              </>
            ) : (
              <>
                {/* Google G logo */}
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </>
            )}
          </motion.a>
        )}
      </AnimatePresence>

      <button
        onClick={onNext}
        disabled={!alreadyConnected}
        className={cn(
          "w-full rounded-xl py-3.5 text-[14px] font-bold transition-all duration-200",
          alreadyConnected
            ? "bg-black text-white hover:bg-black/85 hover:scale-[1.01] active:scale-[0.99]"
            : "bg-black/[0.06] text-black/25 cursor-not-allowed"
        )}
      >
        Continue →
      </button>

      {!alreadyConnected && (
        <p className="text-center text-[12px] text-black/30">
          Already have an account?{" "}
          <Link href="/login" className="text-[#0055ff] font-semibold no-underline hover:underline">
            Log in with Google
          </Link>
        </p>
      )}
    </div>
  );
}

/* ─── Step 2: Tone setup ─────────────────────────────────────── */

const DEFAULT_RULES = [
  { id: "r1", text: "Sound human and genuine, not like a template", locked: true },
  { id: "r2", text: "Be 2–4 sentences max", locked: true },
  { id: "r3", text: "Thank the reviewer by name", locked: true },
  { id: "r4", text: "Address the specific things they mentioned", locked: true },
  { id: "r5", text: "For negative reviews, acknowledge the issue and invite them to reach out directly", locked: true },
  { id: "r6", text: "Never make promises you can't keep", locked: true },
  { id: "r7", text: "Never mention staff names unless the reviewer did", locked: true },
  { id: "r8", text: "Never use em dashes or AI-sounding formatting — always sound like the business, not a bot", locked: true },
];

function StepVoice({
  data,
  onChange,
  onNext,
}: {
  data: FormData;
  onChange: (k: keyof FormData, v: string) => void;
  onNext: (customRules: string[]) => Promise<void>;
}) {
  const VOICE_OPTIONS = [
    { id: "warm",         label: "Calm & warm",       desc: "Like talking to a friend you trust" },
    { id: "professional", label: "Professional",      desc: "Polished and business-appropriate" },
    { id: "casual",       label: "Casual & fun",      desc: "Friendly, light, approachable" },
    { id: "premium",      label: "Premium & refined", desc: "Elevated, confident, high-end" },
  ];

  const VOICE_EXAMPLES: Record<string, string> = {
    warm: "James, this honestly made our morning. So glad you had a great experience. Hope to see you back soon!",
    professional: "James, thank you for coming in and sharing this. We are glad the team took good care of you and we appreciate the kind words.",
    casual: "James, love hearing this. Thanks for stopping by and for the shoutout. Come back soon!",
    premium: "James, thank you for the thoughtful review. We are delighted you enjoyed the experience and look forward to welcoming you back.",
  };

  const [rules, setRules] = useState(DEFAULT_RULES);
  const [newRule, setNewRule] = useState("");
  const [showRules, setShowRules] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  function addRule() {
    if (!newRule.trim()) return;
    setRules((prev) => [...prev, { id: `custom-${Date.now()}`, text: newRule.trim(), locked: false }]);
    setNewRule("");
  }

  function removeRule(id: string) {
    setRules((prev) => prev.filter((r) => r.id !== id));
  }

  const valid = data.voice.trim().length > 0;

  async function handleContinue() {
    if (!valid || saving) return;
    setSaving(true);
    setSaveError("");
    try {
      const customRules = rules.filter((r) => !r.locked).map((r) => r.text);
      await onNext(customRules);
    } catch {
      setSaveError("Could not save your voice. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[24px] font-black tracking-[-0.04em] text-black">Set your voice</h2>
        <p className="mt-1.5 text-[14px] text-black/45 font-medium">
          Tell the AI how you sound. Every response will match this exactly.
        </p>
      </div>

      {/* Q1 — Business description */}
      <div className="space-y-1.5">
        <label className="block text-[13px] font-bold text-black">
          Describe your business in one sentence like you're telling a friend
          <span className="font-normal text-black/30"> (optional)</span>
        </label>
        <textarea
          className={cn(inputCls, "min-h-[80px] resize-none")}
          placeholder="e.g. We’re a family-owned HVAC company in Charlotte, 22 years in, and we talk to customers like neighbors."
          value={data.businessDescription}
          onChange={(e) => onChange("businessDescription", e.target.value)}
        />
      </div>

      {/* Q2 — Voice */}
      <div className="space-y-2">
        <label className="block text-[13px] font-bold text-black">
          How would you describe your brand voice?
        </label>
        <div className="grid grid-cols-2 gap-2">
          {VOICE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => onChange("voice", opt.id)}
              className={cn(
                "flex flex-col items-start rounded-xl border p-3.5 text-left transition-all duration-200",
                data.voice === opt.id
                  ? "border-[#0055ff]/40 bg-[#f0f5ff] shadow-[0_0_0_2px_rgba(0,85,255,0.1)]"
                  : "border-black/[0.07] bg-white hover:border-black/15"
              )}
            >
              <span className={cn("text-[13px] font-semibold", data.voice === opt.id ? "text-[#0055ff]" : "text-black")}>
                {opt.label}
              </span>
              <span className="mt-0.5 text-[11px] text-black/35">{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Voice examples */}
      <div className="space-y-2">
        <label className="block text-[13px] font-bold text-black">
          Example responses by tone
        </label>
        <div className="grid gap-2">
          {VOICE_OPTIONS.map((opt) => (
            <div
              key={`ex-${opt.id}`}
              className={cn(
                "rounded-xl border p-3.5 text-left transition-all duration-200",
                data.voice === opt.id
                  ? "border-[#0055ff]/40 bg-[#f0f5ff]"
                  : "border-black/[0.07] bg-white"
              )}
            >
              <div className={cn("text-[12px] font-semibold", data.voice === opt.id ? "text-[#0055ff]" : "text-black/70")}>
                {opt.label}
              </div>
              <div className="mt-1 text-[12px] text-black/60 leading-relaxed">
                {VOICE_EXAMPLES[opt.id]}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Q3 — Never say */}
      <div className="space-y-1.5">
        <label className="block text-[13px] font-bold text-black">
          What words would you never use when talking to customers?{" "}
          <span className="font-normal text-black/30">(optional)</span>
        </label>
        <input
          className={inputCls}
          placeholder="e.g. never say ‘synergy’, avoid corporate-speak, don't mention competitors"
          value={data.neverSay}
          onChange={(e) => onChange("neverSay", e.target.value)}
        />
      </div>

      {/* Q4 — Example */}
      <div className="space-y-1.5">
        <label className="block text-[13px] font-bold text-black">
          Paste an example of how you'd respond to a great review{" "}
          <span className="font-normal text-black/30">(optional)</span>
        </label>
        <textarea
          className={cn(inputCls, "min-h-[80px] resize-none")}
          placeholder="A real response you wrote that felt perfect..."
          value={data.exampleResponse}
          onChange={(e) => onChange("exampleResponse", e.target.value)}
        />
      </div>

      {/* AI Rules accordion */}
      <div className="rounded-xl border border-black/[0.07] overflow-hidden">
        <button
          onClick={() => setShowRules((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3.5 text-left bg-[#f9fafb] hover:bg-[#f4f6f9] transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-[#0055ff]/10">
              <span className="text-[10px] font-black text-[#0055ff]">AI</span>
            </div>
            <span className="text-[13px] font-bold text-black">AI response rules</span>
            <span className="rounded-full bg-black/[0.06] px-2 py-0.5 text-[10px] font-semibold text-black/40">
              {rules.length} rules
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-black/35">
            {showRules ? "Hide" : "View & edit"}
            <svg
              width="14" height="14" viewBox="0 0 14 14" fill="none"
              className={cn("transition-transform duration-200", showRules ? "rotate-180" : "")}
            >
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
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] as const }}
              className="overflow-hidden"
            >
              <div className="border-t border-black/[0.06] p-4 space-y-2 bg-white">
                <p className="text-[11px] font-medium text-black/35 mb-3">
                  These rules are sent directly to the AI with every response. Locked rules are our core quality standards. You can add your own below.
                </p>

                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className={cn(
                      "flex items-start gap-2.5 rounded-lg px-3 py-2.5",
                      rule.locked ? "bg-[#f9fafb]" : "bg-[#f0f5ff]"
                    )}
                  >
                    <div className={cn(
                      "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                      rule.locked ? "bg-black/[0.08]" : "bg-[#0055ff]/15"
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
                    <span className={cn("flex-1 text-[12px] leading-relaxed", rule.locked ? "text-black/55" : "text-[#0055ff] font-medium")}>
                      {rule.text}
                    </span>
                    {!rule.locked && (
                      <button
                        onClick={() => removeRule(rule.id)}
                        className="shrink-0 text-black/20 hover:text-red-400 transition-colors text-[16px] leading-none mt-0.5"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}

                {/* Add custom rule */}
                <div className="flex gap-2 pt-1">
                  <input
                    className={cn(inputCls, "text-[12px] py-2")}
                    placeholder="Add a custom rule, e.g. 'Always mention our loyalty program'"
                    value={newRule}
                    onChange={(e) => setNewRule(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addRule()}
                  />
                  <button
                    onClick={addRule}
                    disabled={!newRule.trim()}
                    className="shrink-0 rounded-lg bg-[#0055ff] px-3 text-[12px] font-bold text-white disabled:opacity-30 hover:bg-[#0044dd] transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {saveError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] font-semibold text-red-700">
          {saveError}
        </div>
      )}

      <button
        onClick={handleContinue}
        disabled={!valid || saving}
        className={cn(
          "w-full rounded-xl py-3.5 text-[14px] font-bold transition-all duration-200",
          valid && !saving
            ? "bg-black text-white hover:bg-black/85 hover:scale-[1.01] active:scale-[0.99]"
            : "bg-black/[0.06] text-black/25 cursor-not-allowed"
        )}
      >
        {saving ? "Saving…" : "Continue →"}
      </button>
    </div>
  );
}

/* ─── Step 3: Payment ────────────────────────────────────────── */
function StepPayment({ data, onDone, businessId }: { data: FormData; onDone: () => void; businessId?: string | null }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCheckout() {
    if (!businessId) return;
    setLoading(true);
    setError("");
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      const res = await fetch(`${backendUrl}/checkout/${businessId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        throw new Error(`Checkout failed: ${res.status}`);
      }
      const data = await res.json();
      if (!data.url) {
        throw new Error("Missing checkout URL");
      }
      window.location.href = data.url;
    } catch (e) {
      setError("Could not start checkout. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[24px] font-black tracking-[-0.04em] text-black">Start your plan</h2>
        <p className="mt-1.5 text-[14px] text-black/45 font-medium">
          14-day free trial. Cancel anytime. No card surprises.
        </p>
      </div>

      {/* Plan card */}
      <div className="rounded-xl border border-[#0055ff]/20 bg-white p-5 shadow-[0_2px_20px_rgba(0,85,255,0.08)]">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#0055ff] mb-1">OS Entry</div>
            <div className="text-[32px] font-black tracking-[-0.04em] text-black leading-none">
              $149
              <span className="text-[15px] font-medium text-black/35">/mo</span>
            </div>
          </div>
          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
            14-day trial
          </span>
        </div>

        <div className="border-t border-black/[0.05] pt-4 space-y-2">
          {[
            "Review Automation — all reviews, 24/7",
            "Reputation Dashboard",
            "AI voice trained to your business",
            "Real-time Google sync",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2.5 text-[13px] font-medium text-black/60">
              <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#0055ff]/10">
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path d="M1.5 4l2 2 3-3" stroke="#0055ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Setup summary */}
      <div className="rounded-xl border border-black/[0.06] bg-[#f9fafb] px-4 py-3.5">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-black/30 mb-2.5">Your setup</p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-black/40 font-medium">Business</span>
            <span className="font-semibold text-black">{data.businessName || (businessId ? "Connected" : "—")}</span>
          </div>
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-black/40 font-medium">Google</span>
            <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Connected
            </span>
          </div>
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-black/40 font-medium">Voice</span>
            <span className="font-semibold text-black capitalize">{data.voice || "—"}</span>
          </div>
        </div>
      </div>

      {/* Stripe CTA */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] font-semibold text-red-700">
          {error}
        </div>
      )}

      <button
        onClick={handleCheckout}
        disabled={loading || !businessId}
        className="relative w-full overflow-hidden rounded-xl bg-[#0055ff] py-4 text-[14px] font-bold text-white transition-all duration-200 hover:bg-[#0044dd] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
              <path d="M8 2a6 6 0 0 1 6 6" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Redirecting to Stripe...
          </span>
        ) : (
          "Start free trial → Pay $149/mo after 14 days"
        )}
      </button>

      {!businessId && (
        <p className="text-center text-[11px] text-black/35">
          Connect Google first to start checkout.
        </p>
      )}

      <div className="flex items-center justify-center gap-4 text-[11px] text-black/25">
        <span className="flex items-center gap-1.5">
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <rect x="1" y="5" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M4 5V3.5a2 2 0 0 1 4 0V5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          Secured by Stripe
        </span>
        <span>·</span>
        <span>Cancel anytime</span>
        <span>·</span>
        <span>No contracts</span>
      </div>
    </div>
  );
}

/* ─── Done screen ────────────────────────────────────────────── */
function Done({ name, businessId }: { name: string; businessId?: string | null }) {
  const dashboardHref = businessId ? `/dashboard?business_id=${businessId}` : "/dashboard";
  return (
    <div className="flex flex-col items-center text-center space-y-5 py-6">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100"
      >
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path d="M6 14l5.5 5.5L22 9" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.div>

      <div>
        <h2 className="text-[24px] font-black tracking-[-0.04em] text-black">You're in.</h2>
        <p className="mt-2 text-[15px] text-black/45 font-medium max-w-[320px]">
          {name ? `${name} is` : "Your business is"} now live on Solsara. First automated response goes out within 30 minutes of your next review.
        </p>
      </div>

      <div className="w-full rounded-xl border border-black/[0.06] bg-[#f9fafb] p-4 space-y-2.5 text-left">
        {[
          { icon: "◈", text: "Review Automation is active" },
          { icon: "🔄", text: "Google sync running" },
          { icon: "🎯", text: "AI trained to your voice" },
        ].map((item) => (
          <div key={item.text} className="flex items-center gap-3 text-[13px] font-medium text-black/60">
            <span className="text-[16px]">{item.icon}</span>
            {item.text}
          </div>
        ))}
      </div>

      <Link
        href={dashboardHref}
        className="mt-2 w-full rounded-xl bg-black py-3.5 text-center text-[14px] font-bold text-white no-underline hover:bg-black/85 transition-colors"
      >
        Open Dashboard →
      </Link>
    </div>
  );
}

/* ─── Main onboarding content (uses useSearchParams) ───────────── */
function OnboardingContent() {
  const searchParams = useSearchParams();
  const businessIdFromUrl = searchParams.get("business_id");

  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState<FormData>({
    businessName: "",
    email: "",
    password: "",
    googleConnected: !!businessIdFromUrl,
    googleBusiness: businessIdFromUrl ? "Connected" : "",
    voice: "",
    businessDescription: "",
    neverSay: "",
    exampleResponse: "",
  });

  function update(k: keyof FormData, v: string | boolean) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  // When landing with business_id from OAuth callback, skip to Voice step
  useEffect(() => {
    if (businessIdFromUrl) {
      try {
        localStorage.setItem("business_id", businessIdFromUrl);
      } catch {
        // ignore storage errors
      }
      setStep(2);
      setForm((prev) => ({ ...prev, googleConnected: true, googleBusiness: "Connected" }));
    }
  }, [businessIdFromUrl]);

  function next() {
    setDir(1);
    setStep((s) => s + 1);
  }

  return (
    <div className="flex min-h-screen flex-col bg-white md:flex-row">

      {/* ─ Left panel (branding) ─────────────────────── */}
      <div className="relative hidden overflow-hidden md:flex md:w-[420px] md:shrink-0 md:flex-col md:justify-between bg-[#0a0f1e] px-10 py-12">
        {/* Background glow */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-80 w-80 rounded-full bg-[#0055ff]/20 blur-[80px]" />
        <div className="pointer-events-none absolute -bottom-20 -right-10 h-60 w-60 rounded-full bg-[#0055ff]/10 blur-[60px]" />

        {/* Logo */}
        <div className="relative">
          <Link href="/" className="no-underline">
            <span className="text-[18px] font-black tracking-tight text-white">
              Sol<span className="text-[#4d90ff]">sara</span>
            </span>
          </Link>
        </div>

        {/* Mid content */}
        <div className="relative space-y-8">
          <div>
            <h3 className="text-[28px] font-black tracking-[-0.04em] text-white leading-tight">
              Your reputation,<br />
              on <span className="text-[#4d90ff]">autopilot.</span>
            </h3>
            <p className="mt-3 text-[14px] text-white/45 leading-relaxed font-medium">
              Set up once in under 3 minutes. Every review handled. Every lead captured. You just check the numbers.
            </p>
          </div>

          {/* Stats */}
          <div className="space-y-4">
            {[
              { val: "< 30m", label: "Average response time" },
              { val: "100%",  label: "Response rate" },
              { val: "3 min", label: "Setup time" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-4">
                <div className="text-[22px] font-black text-white w-20 shrink-0">{s.val}</div>
                <div className="text-[12px] font-medium text-white/35">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative">
          <p className="text-[11px] text-white/20 font-medium">© 2025 Solsara · Reputation OS</p>
        </div>
      </div>

      {/* ─ Right panel (form) ────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-[420px]">

          {/* Mobile logo */}
          <div className="mb-8 md:hidden">
            <Link href="/" className="no-underline">
              <span className="text-[16px] font-black tracking-tight text-black">
                Sol<span className="text-[#0055ff]">sara</span>
              </span>
            </Link>
          </div>

          {!done && (
            <div className="mb-8">
              <StepBar current={step} />
            </div>
          )}

          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={done ? "done" : step}
              custom={dir}
              variants={SLIDE}
              initial="enter"
              animate="center"
              exit="exit"
            >
              {done ? (
                <Done name={form.businessName} businessId={businessIdFromUrl} />
              ) : step === 1 ? (
                <StepGoogle data={form} onChange={update} onNext={next} businessId={businessIdFromUrl} />
              ) : step === 2 ? (
                <StepVoice
                  data={form}
                  onChange={update}
                  onNext={async (customRules) => {
                    if (!businessIdFromUrl) {
                      next();
                      return;
                    }

                    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
                    const response = await fetch(`${backendUrl}/businesses/${businessIdFromUrl}/tone`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        voice: form.voice,
                        business_description: form.businessDescription,
                        never_say: form.neverSay,
                        example_response: form.exampleResponse,
                        custom_rules: customRules,
                      }),
                    });

                    if (!response.ok) {
                      throw new Error(`Failed to save voice: ${response.status}`);
                    }

                    next();
                  }}
                />
              ) : (
                <StepPayment data={form} onDone={() => setDone(true)} businessId={businessIdFromUrl} />
              )}
            </motion.div>
          </AnimatePresence>

          {!done && step > 1 && (
            <button
              onClick={() => { setDir(-1); setStep((s) => s - 1); }}
              className="mt-6 flex items-center gap-1.5 text-[12px] font-medium text-black/30 hover:text-black transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Page wrapper with Suspense ───────────────────────────────── */
export default function Onboarding() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0055ff] border-t-transparent" />
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  );
}
