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
  voice: string;
  businessDescription: string;
  neverSay: string;
  exampleResponse: string;
  moduleChoice: "reviews" | "missed" | "";
  businessPhone: string;
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
  { n: 1, label: "Account" },
  { n: 2, label: "Module" },
  { n: 3, label: "Setup" },
  { n: 4, label: "Trial" },
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

/* ─── Step 1: Create account ────────────────────────────────── */
function StepAccount({
  data,
  onChange,
  onNext,
  saving,
  error,
}: {
  data: FormData;
  onChange: (k: keyof FormData, v: string | boolean) => void;
  onNext: () => void;
  saving: boolean;
  error: string;
}) {
  const valid = data.businessName.trim() && data.email.trim() && data.password.trim();
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[24px] font-black tracking-[-0.04em] text-black">Create your account</h2>
        <p className="mt-1.5 text-[14px] text-black/45 font-medium">
          Start with the basics. No Google needed yet.
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="block text-[13px] font-bold text-black">Business name</label>
        <input
          className={inputCls}
          placeholder="e.g. Charlotte HVAC Co."
          value={data.businessName}
          onChange={(e) => onChange("businessName", e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-[13px] font-bold text-black">Email</label>
        <input
          className={inputCls}
          placeholder="you@company.com"
          value={data.email}
          onChange={(e) => onChange("email", e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-[13px] font-bold text-black">Password</label>
        <input
          type="password"
          className={inputCls}
          placeholder="Create a password"
          value={data.password}
          onChange={(e) => onChange("password", e.target.value)}
        />
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] font-semibold text-red-700">
          {error}
        </div>
      )}

      <button
        onClick={onNext}
        disabled={!valid || saving}
        className={cn(
          "w-full rounded-xl py-3.5 text-[14px] font-bold transition-all duration-200",
          valid && !saving
            ? "bg-black text-white hover:bg-black/85 hover:scale-[1.01] active:scale-[0.99]"
            : "bg-black/[0.06] text-black/25 cursor-not-allowed"
        )}
      >
        {saving ? "Creating..." : "Continue →"}
      </button>
    </div>
  );
}

/* ─── Step 2: Module choice ─────────────────────────────────── */
function StepModule({
  data,
  onChange,
  onNext,
}: {
  data: FormData;
  onChange: (k: keyof FormData, v: string | boolean) => void;
  onNext: () => void;
}) {
  const valid = !!data.moduleChoice;
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[24px] font-black tracking-[-0.04em] text-black">Choose your first module</h2>
        <p className="mt-1.5 text-[14px] text-black/45 font-medium">
          Pick what you want to enable first.
        </p>
      </div>

      <div className="grid gap-3">
        {[{ id: "reviews", title: "Review Replies", desc: "Auto-respond to Google reviews" }, { id: "missed", title: "Missed Call Net", desc: "Auto-text every missed caller" }].map((opt) => (
          <button
            key={opt.id}
            onClick={() => onChange("moduleChoice", opt.id)}
            className={cn(
              "flex items-start gap-3 rounded-xl border p-4 text-left transition-all",
              data.moduleChoice === opt.id
                ? "border-[#0055ff]/40 bg-[#f0f5ff] shadow-[0_0_0_2px_rgba(0,85,255,0.1)]"
                : "border-black/[0.07] bg-white hover:border-black/15"
            )}
          >
            <div className={cn("text-[12px] font-bold", data.moduleChoice === opt.id ? "text-[#0055ff]" : "text-black")}>{opt.title}</div>
            <div className="text-[12px] text-black/45">{opt.desc}</div>
          </button>
        ))}
      </div>

      <button
        onClick={onNext}
        disabled={!valid}
        className={cn(
          "w-full rounded-xl py-3.5 text-[14px] font-bold transition-all duration-200",
          valid
            ? "bg-black text-white hover:bg-black/85 hover:scale-[1.01] active:scale-[0.99]"
            : "bg-black/[0.06] text-black/25 cursor-not-allowed"
        )}
      >
        Continue →
      </button>
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

/* ─── Step 3: Module setup ──────────────────────────────────── */
function ReviewRepliesSetup({
  data,
  onChange,
  onNext,
  businessId,
  googleConnected,
}: {
  data: FormData;
  onChange: (k: keyof FormData, v: string) => void;
  onNext: (customRules: string[]) => Promise<void>;
  businessId?: string | null;
  googleConnected: boolean;
}) {
  const connectUrl = businessId ? `/api/auth/google?business_id=${businessId}` : "/api/auth/google";
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[24px] font-black tracking-[-0.04em] text-black">Connect Google</h2>
        <p className="mt-1.5 text-[14px] text-black/45 font-medium">
          Review Replies needs Google Business Profile access.
        </p>
      </div>

      {!googleConnected ? (
        <a
          href={connectUrl}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-black/[0.09] bg-white py-3.5 text-[14px] font-semibold text-black shadow-[0_1px_8px_rgba(0,0,0,0.06)] hover:border-black/20 hover:shadow-[0_2px_16px_rgba(0,0,0,0.1)] transition-all duration-200 no-underline"
        >
          Connect Google
        </a>
      ) : (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-[13px] font-semibold text-emerald-700">
          Google connected
        </div>
      )}

      {googleConnected && (
        <StepVoice data={data} onChange={onChange} onNext={onNext} />
      )}
    </div>
  );
}

function MissedCallSetup({
  businessId,
  businessPhone,
  setBusinessPhone,
  useExistingTwilio,
  setUseExistingTwilio,
  existingTwilioNumber,
  setExistingTwilioNumber,
  onNext,
  error,
  setError,
}: {
  businessId?: string | null;
  businessPhone: string;
  setBusinessPhone: (v: string) => void;
  useExistingTwilio: boolean;
  setUseExistingTwilio: (v: boolean) => void;
  existingTwilioNumber: string;
  setExistingTwilioNumber: (v: string) => void;
  onNext: () => void;
  error: string;
  setError: (v: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  async function handleProvision() {
    if (!businessId) return;
    try {
      setLoading(true);
      setError("");
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
          // ignore
        }
        throw new Error(`Setup failed: ${res.status}${detail}`);
      }
      onNext();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to set up Missed Call Net");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[24px] font-black tracking-[-0.04em] text-black">Missed Call Net setup</h2>
        <p className="mt-1.5 text-[14px] text-black/45 font-medium">
          We’ll text every missed caller for you.
        </p>
      </div>

      <div className="flex items-center gap-2 text-[12px] text-black/60">
        <button
          onClick={() => setUseExistingTwilio(!useExistingTwilio)}
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
        <div className="space-y-1.5">
          <label className="block text-[13px] font-bold text-black">Your Twilio number</label>
          <input
            className={inputCls}
            placeholder="+18445551234"
            value={existingTwilioNumber}
            onChange={(e) => setExistingTwilioNumber(e.target.value)}
          />
        </div>
      )}

      <div className="space-y-1.5">
        <label className="block text-[13px] font-bold text-black">
          What’s your current business phone number?
        </label>
        <input
          className={inputCls}
          placeholder="(704) 555-0123"
          value={businessPhone}
          onChange={(e) => setBusinessPhone(e.target.value)}
        />
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] font-semibold text-red-700">
          {error}
        </div>
      )}

      <button
        onClick={handleProvision}
        disabled={!businessPhone.trim() || (useExistingTwilio && !existingTwilioNumber.trim()) || loading}
        className={cn(
          "w-full rounded-xl py-3.5 text-[14px] font-bold transition-all duration-200",
          !loading && businessPhone.trim()
            ? "bg-black text-white hover:bg-black/85 hover:scale-[1.01] active:scale-[0.99]"
            : "bg-black/[0.06] text-black/25 cursor-not-allowed"
        )}
      >
        {loading ? "Setting up..." : "Continue →"}
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
      const res = await fetch(`${backendUrl}/businesses/${businessId}/start-trial`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        throw new Error(`Trial start failed: ${res.status}`);
      }
      onDone();
    } catch (e) {
      setError("Could not start your free trial. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[24px] font-black tracking-[-0.04em] text-black">Start your plan</h2>
        <p className="mt-1.5 text-[14px] text-black/45 font-medium">
          14-day free trial. No card today. We’ll prompt you to add billing before day 14.
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

      {/* Trial CTA */}
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
            Starting trial...
          </span>
        ) : (
          "Start free trial"
        )}
      </button>

      {!businessId && (
        <p className="text-center text-[11px] text-black/35">
          Connect Google first to start checkout.
        </p>
      )}

      <div className="flex items-center justify-center gap-4 text-[11px] text-black/25">
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
  const googleConnectedFromUrl = searchParams.get("google") === "connected";

  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [done, setDone] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(businessIdFromUrl);
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState("");
  const [missedSetupError, setMissedSetupError] = useState("");
  const [useExistingTwilio, setUseExistingTwilio] = useState(false);
  const [existingTwilioNumber, setExistingTwilioNumber] = useState("");
  const [form, setForm] = useState<FormData>({
    businessName: "",
    email: "",
    password: "",
    googleConnected: googleConnectedFromUrl,
    voice: "",
    businessDescription: "",
    neverSay: "",
    exampleResponse: "",
    moduleChoice: "",
    businessPhone: "",
  });

  function update(k: keyof FormData, v: string | boolean) {
    setForm((prev) => ({ ...prev, [k]: v }));
    if (k === "moduleChoice" && typeof v === "string") {
      try {
        localStorage.setItem("module_choice", v);
      } catch {
        // ignore
      }
    }
  }

  // When landing with business_id from OAuth callback, persist and stay on setup
  useEffect(() => {
    if (businessIdFromUrl) {
      try {
        localStorage.setItem("business_id", businessIdFromUrl);
      } catch {
        // ignore storage errors
      }
      setBusinessId(businessIdFromUrl);
      if (googleConnectedFromUrl) {
        setForm((prev) => ({ ...prev, googleConnected: true, moduleChoice: "reviews" }));
        setStep(3);
      }
    }
  }, [businessIdFromUrl, googleConnectedFromUrl]);

  useEffect(() => {
    if (businessId) return;
    try {
      const stored = localStorage.getItem("business_id");
      if (stored) setBusinessId(stored);
    } catch {
      // ignore
    }
  }, [businessId]);

  useEffect(() => {
    if (form.moduleChoice) return;
    try {
      const storedChoice = localStorage.getItem("module_choice");
      if (storedChoice === "reviews" || storedChoice === "missed") {
        setForm((prev) => ({ ...prev, moduleChoice: storedChoice }));
      }
    } catch {
      // ignore
    }
  }, [form.moduleChoice]);

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
                <Done name={form.businessName} businessId={businessId} />
              ) : step === 1 ? (
                <StepAccount
                  data={form}
                  onChange={update}
                  saving={signupLoading}
                  error={signupError}
                  onNext={async () => {
                    if (signupLoading) return;
                    try {
                      setSignupLoading(true);
                      setSignupError("");
                      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
                      const res = await fetch(`${backendUrl}/businesses/signup`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          business_name: form.businessName,
                          email: form.email,
                          password: form.password,
                        }),
                      });
                      if (!res.ok) {
                        let detail = "";
                        try {
                          const errData = await res.json();
                          detail = errData.detail ? `: ${errData.detail}` : "";
                        } catch {
                          // ignore
                        }
                        throw new Error(`Signup failed${detail}`);
                      }
                      const data = await res.json();
                      setBusinessId(data.business_id);
                      try {
                        localStorage.setItem("business_id", data.business_id);
                      } catch {
                        // ignore
                      }
                      next();
                    } catch (e) {
                      setSignupError(e instanceof Error ? e.message : "Failed to create account");
                    } finally {
                      setSignupLoading(false);
                    }
                  }}
                />
              ) : step === 2 ? (
                <StepModule data={form} onChange={update} onNext={next} />
              ) : step === 3 ? (
                form.moduleChoice === "reviews" ? (
                  <ReviewRepliesSetup
                    data={form}
                    onChange={update}
                    businessId={businessId}
                    googleConnected={form.googleConnected}
                    onNext={async (customRules) => {
                      if (!businessId) return;
                      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
                      const response = await fetch(`${backendUrl}/businesses/${businessId}/tone`, {
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
                  <MissedCallSetup
                    businessId={businessId}
                    businessPhone={form.businessPhone}
                    setBusinessPhone={(v) => update("businessPhone", v)}
                    useExistingTwilio={useExistingTwilio}
                    setUseExistingTwilio={setUseExistingTwilio}
                    existingTwilioNumber={existingTwilioNumber}
                    setExistingTwilioNumber={setExistingTwilioNumber}
                    onNext={next}
                    error={missedSetupError}
                    setError={setMissedSetupError}
                  />
                )
              ) : (
                <StepPayment data={form} onDone={() => setDone(true)} businessId={businessId} />
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
