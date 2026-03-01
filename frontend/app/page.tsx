"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import VantaBackground from "./components/VantaBackground";
import { cn } from "@/lib/utils";

/* ─── Motion presets ─────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const fadeIn = {
  hidden: { opacity: 0, scale: 0.97 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] as const } },
};

/* ─── Nav ────────────────────────────────────────────────────── */
function Navbar() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 flex justify-center pt-5 px-4">
      {/* Gradient border wrapper — gives the 3D edge refraction */}
      <div
        className="rounded-full p-px"
        style={{
          width: "min(96%, 900px)",
          background: "linear-gradient(160deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.6) 100%)",
          boxShadow: "0 16px 48px -8px rgba(0,0,0,0.10), 0 4px 12px -2px rgba(0,0,0,0.06)",
        }}
      >
        <nav
          className="relative flex w-full items-center justify-between gap-8 overflow-hidden rounded-full px-5 py-2.5"
          style={{
            background: "rgba(255,255,255,0.12)",
            backdropFilter: "blur(40px) saturate(180%)",
            WebkitBackdropFilter: "blur(40px) saturate(180%)",
          }}
        >
          {/* Top specular highlight — the "lens flare" stripe */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-full"
            style={{
              background: "linear-gradient(to bottom, rgba(255,255,255,0.55), transparent)",
            }}
          />

          {/* Logo */}
          <Link href="/" className="relative flex items-center no-underline shrink-0">
            <span className="text-[15px] font-black tracking-tight" style={{ color: "rgba(0,0,0,0.85)", textShadow: "0 1px 2px rgba(255,255,255,0.6)" }}>
              Sol<span className="text-[#0055ff]">sara</span>
            </span>
          </Link>

          {/* Links */}
          <div className="relative hidden md:flex items-center gap-7">
            {[
              { href: "#product", label: "Product" },
              { href: "#pricing", label: "Pricing" },
              { href: "#how", label: "How it works" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-[13px] font-medium no-underline transition-colors"
                style={{ color: "rgba(0,0,0,0.52)" }}
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/demo"
              className="relative flex items-center gap-1.5 text-[13px] font-semibold text-[#0055ff] no-underline hover:text-[#0044dd] transition-colors"
            >
              <span className="flex h-1.5 w-1.5 rounded-full bg-[#0055ff] animate-pulse" />
              Live demo
            </Link>
          </div>

          {/* CTA */}
          <Link
            href="/onboarding"
            className="relative h-9 px-5 rounded-full text-[12px] font-semibold flex items-center shrink-0 no-underline transition-all hover:scale-[1.04] active:scale-[0.97]"
            style={{
              background: "linear-gradient(160deg, rgba(10,10,10,0.88) 0%, rgba(30,30,30,0.96) 100%)",
              color: "#fff",
              boxShadow: "0 1px 0 rgba(255,255,255,0.15) inset, 0 6px 16px rgba(0,0,0,0.25)",
            }}
          >
            Try free →
          </Link>
        </nav>
      </div>
    </header>
  );
}

/* ─── Dashboard mockup ───────────────────────────────────────── */
function DashboardMockup() {
  return (
    <motion.div
      variants={fadeIn}
      className="relative mx-auto mt-14 w-full max-w-[860px]"
    >
      {/* Glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -bottom-8 h-40 rounded-full blur-3xl opacity-30"
        style={{ background: "radial-gradient(ellipse, #5588ff 0%, transparent 70%)" }}
      />

      {/* Card */}
      <div className="relative overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_8px_60px_rgba(0,0,0,0.1)]">

        {/* Titlebar */}
        <div className="flex items-center gap-2 border-b border-black/[0.05] bg-[#fafafa] px-5 py-3.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          <div className="mx-auto flex h-6 items-center rounded-md bg-black/[0.04] px-3 text-[10px] font-medium text-black/30 tracking-wide">
            solsara.co · dashboard
          </div>
        </div>

        {/* App layout */}
        <div className="flex h-[340px]">
          {/* Sidebar */}
          <div className="hidden sm:flex w-44 shrink-0 flex-col border-r border-black/[0.05] bg-[#fafafa] px-3 py-4">
            <div className="mb-3 flex items-center gap-2 px-2">
              <span className="text-[13px] font-black tracking-tight text-black">
                Sol<span className="text-[#0055ff]">sara</span>
              </span>
            </div>
            <div className="mt-2 space-y-0.5">
              {[
                { label: "Overview", active: true },
                { label: "Review Replies" },
                { label: "Review Velocity" },
                { label: "Missed Calls" },
                { label: "Social Proof" },
              ].map((item) => (
                <div
                  key={item.label}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[11px] font-medium",
                    item.active
                      ? "bg-black/[0.07] text-black"
                      : "text-black/40"
                  )}
                >
                  {item.active && (
                    <span className="mr-0.5 h-1.5 w-1 rounded-full bg-[#0055ff]" />
                  )}
                  {item.label}
                </div>
              ))}
            </div>
            <div className="mt-auto rounded-xl bg-[#0055ff]/5 border border-[#0055ff]/10 p-3">
              <div className="text-[9px] font-semibold uppercase tracking-widest text-[#0055ff]/60 mb-1">Growth</div>
              <div className="text-xl font-black text-[#0055ff]">+14.8%</div>
              <div className="mt-2 h-1 w-full rounded-full bg-blue-100 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: "72%" }}
                  transition={{ duration: 1.4, delay: 0.8, ease: [0.22, 1, 0.36, 1] as const }}
                  className="h-full rounded-full bg-[#0055ff]"
                />
              </div>
            </div>
          </div>

          {/* Main */}
          <div className="flex-1 overflow-hidden p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h4 className="text-[14px] font-bold text-black">Review Replies</h4>
                <p className="text-[11px] text-black/35 mt-0.5">Auto-responding · 24/7</p>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-[#0055ff]/10 px-3 py-1 text-[10px] font-bold text-[#0055ff] uppercase tracking-wider">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0055ff] animate-pulse" />
                Live
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: "Total Reviews", val: "455", delta: "+16.4%", up: true },
                { label: "Avg. Response", val: "22m", delta: "-4.8%", up: true },
                { label: "Sentiment", val: "94%", delta: "Positive", up: true },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-black/[0.05] bg-white p-3 shadow-[0_1px_6px_rgba(0,0,0,0.04)]">
                  <div className="text-[9px] font-semibold uppercase tracking-widest text-black/30 mb-1.5">{s.label}</div>
                  <div className="text-[18px] font-black tracking-tight text-black">{s.val}</div>
                  <div className="mt-0.5 text-[10px] font-semibold text-emerald-500">{s.delta}</div>
                </div>
              ))}
            </div>

            {/* Recent replies */}
            <div className="space-y-2.5">
              {[
                { name: "David P.", stars: 5, text: "Best experience I've had in years.", reply: "Thank you David! Thrilled you had a great experience." },
                { name: "Sarah M.", stars: 4, text: "Really solid experience overall.", reply: "We appreciate it Sarah! Glad we could help." },
              ].map((row) => (
                <div key={row.name} className="rounded-xl border border-black/[0.05] bg-[#fafafa] p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[12px] font-semibold text-black">{row.name}</span>
                    <div className="flex gap-px">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={cn("text-[10px]", i < row.stars ? "text-amber-400" : "text-black/10")}>★</span>
                      ))}
                    </div>
                  </div>
                  <p className="text-[11px] text-black/40 italic mb-1.5">"{row.text}"</p>
                  <div className="border-l-2 border-[#0055ff]/20 pl-2 text-[11px] font-medium text-black/60">
                    {row.reply}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Features bento ─────────────────────────────────────────── */
const COMING_SOON_MODULES = [
  {
    name: "Local Dominance",
    desc: "Keep your Google Business profile active with fresh signals to maintain a top ranking in the local map pack.",
  },
  {
    name: "Missed Call Recovery",
    desc: "Automatically follow up with anyone who called and couldn't get through, so no lead goes cold.",
  },
  {
    name: "Social Proof Pack",
    desc: "Turn 5-star reviews into polished social content, ready to approve and post in one tap.",
  },
  {
    name: "Review Velocity",
    desc: "Intelligently prompt satisfied customers at the right moment to leave a review without feeling pushy.",
  },
  {
    name: "AI Text Receptionist",
    desc: "Answer common customer questions via SMS automatically, 24/7, in your business's voice.",
  },
];

function FeaturesBento() {
  return (
    <section id="product" className="mx-auto max-w-5xl px-5 pb-28 md:px-10">
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.55 }}
        className="mb-12 text-center"
      >
        <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#0055ff]">Platform</span>
        <h2 className="mt-3 text-[32px] md:text-[44px] font-black tracking-[-0.04em] text-black leading-tight">
          One platform. Your entire reputation.
        </h2>
        <p className="mt-3 text-[15px] text-black/45 font-medium max-w-[480px] mx-auto">
          Start with Review Replies. Expand as you grow.
        </p>
      </motion.div>

      {/* Bento grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">

        {/* Hero card — Review Replies (LIVE) */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="md:col-span-7 relative overflow-hidden rounded-2xl bg-[#0055ff] p-8 text-white flex flex-col justify-between min-h-[260px]"
        >
          <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-white/80 mb-5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
              Live now
            </span>
            <h3 className="text-[22px] md:text-[26px] font-black tracking-tight leading-tight mb-3">
              Review Replies
            </h3>
            <p className="text-[14px] text-white/70 leading-relaxed max-w-[380px]">
              Every Google review answered in your voice — automatically — in under 30 minutes. While you sleep, your reputation builds itself.
            </p>
          </div>

          <div className="relative mt-8 flex gap-8 border-t border-white/15 pt-5">
            {[
              { val: "< 30m", label: "Avg. response time" },
              { val: "100%", label: "Response rate" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-[24px] font-black tracking-tight">{s.val}</div>
                <div className="text-[10px] text-white/55 font-medium mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Coming soon — first card (larger, right of hero) */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.07 }}
          className="md:col-span-5 relative overflow-hidden rounded-2xl border border-black/[0.06] bg-white p-7 flex flex-col justify-between min-h-[260px]"
        >
          <div>
            <span className="inline-block rounded-full border border-black/[0.07] bg-[#f7f8fa] px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-black/30 mb-5">
              Coming soon
            </span>
            <h3 className="text-[18px] font-black tracking-tight text-black mb-2">
              {COMING_SOON_MODULES[0].name}
            </h3>
            <p className="text-[13px] text-black/45 leading-relaxed">
              {COMING_SOON_MODULES[0].desc}
            </p>
          </div>
        </motion.div>

        {/* Coming soon — remaining 4 in a 2×2 row */}
        {COMING_SOON_MODULES.slice(1).map((mod, i) => (
          <motion.div
            key={mod.name}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 + i * 0.05 }}
            className="md:col-span-3 relative overflow-hidden rounded-2xl border border-black/[0.06] bg-[#f9fafb] p-6 flex flex-col min-h-[170px]"
          >
            <span className="inline-block rounded-full border border-black/[0.07] bg-white px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-black/25 mb-4">
              Coming soon
            </span>
            <h3 className="text-[15px] font-black tracking-tight text-black/60 mb-1.5">{mod.name}</h3>
            <p className="text-[12px] text-black/35 leading-relaxed">{mod.desc}</p>
          </motion.div>
        ))}

      </div>

      {/* Footer line */}
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mt-10 text-center text-[13px] text-black/35 font-medium"
      >
        New modules ship every quarter. All included in your plan.
      </motion.p>
    </section>
  );
}

/* ─── Pricing card ───────────────────────────────────────────── */
const PLANS = [
  {
    name: "OS Entry",
    price: "$299",
    period: "/mo",
    desc: "Review Automation + Reputation Dashboard. One location.",
    cta: "Get early access",
    primary: true,
    href: "/onboarding",
  },
  {
    name: "OS Growth",
    price: "$499",
    period: "/mo",
    desc: "Adds Review Velocity + Social Proof + Gemini Feeder.",
    cta: "Coming soon",
    primary: false,
    href: "#",
  },
  {
    name: "OS Full Stack",
    price: "$799",
    period: "/mo",
    desc: "Everything. All 6 modules + Dedicated AI assistant.",
    cta: "Coming soon",
    primary: false,
    href: "#",
  },
];

/* ─── Landing ────────────────────────────────────────────────── */
export default function Landing() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <main className="relative min-h-screen overflow-x-hidden">
      {/* Sky background */}
      <VantaBackground />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[1]"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(240,245,255,0.22) 40%, rgba(240,245,255,0.70) 70%, #f0f5ff 100%)",
        }}
      />

      <Navbar />

      {/* ─ Hero ─────────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center px-5 pt-36 pb-20 text-center">
        <motion.div
          initial="hidden"
          animate="show"
          variants={stagger}
          className="flex flex-col items-center"
        >
          {/* Eyebrow */}
          <motion.div variants={fadeUp} className="mb-7">
            <span className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-black/50 shadow-sm backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0055ff] animate-pulse" />
              Reputation OS — Early Access
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            className="max-w-[820px] text-[42px] font-black leading-[1.06] tracking-[-0.04em] text-black md:text-[72px]"
          >
            Run your Google presence <br className="hidden md:block" />
            like a <span className="text-[#0055ff]">pro.</span>
          </motion.h1>

          {/* Sub */}
          <motion.p
            variants={fadeUp}
            className="mt-6 max-w-[540px] text-[15px] font-medium leading-relaxed text-black/50 md:text-[17px]"
          >
            The all-in-one reputation operating system for local business. Automate reviews, dominate search, and grow—on autopilot.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={fadeUp} className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/onboarding"
              className="inline-flex h-12 items-center rounded-full bg-black px-7 text-[13px] font-semibold text-white no-underline transition-all hover:bg-black/85 hover:scale-[1.02] active:scale-[0.98]"
            >
              Try Solsara free
            </Link>
            <Link
              href="#how"
              className="inline-flex h-12 items-center gap-2.5 rounded-full border border-black/[0.1] bg-white/70 px-5 text-[13px] font-semibold text-black/60 no-underline backdrop-blur transition-all hover:text-black hover:border-black/20 hover:bg-white"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/[0.05]">
                <span className="ml-0.5 text-[9px]">▶</span>
              </span>
              See how it works
            </Link>
          </motion.div>

          {/* Social proof line */}
          <motion.p variants={fadeUp} className="mt-5 text-[12px] text-black/30 font-medium">
            Trusted by local businesses · Setup in under 3 minutes
          </motion.p>

          {/* Dashboard mockup */}
          <DashboardMockup />
        </motion.div>
      </section>

      {/* ─ Below-fold wrapper (white bg) ─────────────── */}
      <div className="relative z-10 bg-white">

        {/* ─ How it works ───────────────────────────── */}
        <section id="how" className="mx-auto max-w-5xl px-5 py-28 md:px-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="mb-14 text-center"
          >
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#0055ff]">How it works</span>
            <h2 className="mt-3 text-[32px] md:text-[44px] font-black tracking-[-0.04em] text-black leading-tight">
              Set it once. It runs forever.
            </h2>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              { step: "01", title: "Connect Google", desc: "Link your Google Business Profile in 60 seconds. We scan your presence and identify gaps." },
              { step: "02", title: "Set your voice", desc: "Configure your tone and rules once. Solsara learns how you speak and responds as you." },
              { step: "03", title: "Watch it grow", desc: "Reviews handled, search ranking rising, leads captured. You just check the dashboard." },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative rounded-2xl border border-black/[0.06] bg-[#f9fafb] p-7"
              >
                <span className="text-[11px] font-bold text-[#0055ff] tracking-widest mb-4 block">{item.step}</span>
                <h3 className="text-[17px] font-bold text-black mb-2 tracking-tight">{item.title}</h3>
                <p className="text-[13px] text-black/45 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ─ Features bento ─────────────────────────── */}
        <FeaturesBento />

        {/* ─ Pricing ────────────────────────────────── */}
        <section id="pricing" className="border-t border-black/[0.05] bg-[#f9fafb] px-5 py-28 md:px-10">
          <div className="mx-auto max-w-5xl">
            <div className="mb-14 text-center">
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#0055ff]">Pricing</span>
              <h2 className="mt-3 text-[32px] md:text-[44px] font-black tracking-[-0.04em] text-black leading-tight">
                Simple. No surprises.
              </h2>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {PLANS.map((plan, i) => (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className={cn(
                    "flex flex-col rounded-2xl border p-7",
                    plan.primary
                      ? "border-[#0055ff]/25 bg-white shadow-[0_4px_32px_rgba(0,85,255,0.1)]"
                      : "border-black/[0.06] bg-white"
                  )}
                >
                  <div className={cn("text-[11px] font-bold uppercase tracking-[0.18em] mb-4", plan.primary ? "text-[#0055ff]" : "text-black/40")}>
                    {plan.name}
                  </div>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-[36px] font-black tracking-[-0.04em] text-black">{plan.price}</span>
                    <span className="text-[13px] text-black/35 font-medium">{plan.period}</span>
                  </div>
                  <p className="text-[13px] text-black/45 leading-relaxed mb-7 flex-1">{plan.desc}</p>
                  <Link
                    href={plan.href}
                    className={cn(
                      "block rounded-xl px-5 py-3 text-center text-[13px] font-semibold no-underline transition-all",
                      plan.primary
                        ? "bg-black text-white hover:bg-black/85"
                        : "border border-black/[0.08] text-black/40 cursor-default"
                    )}
                  >
                    {plan.cta}
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─ CTA / waitlist ─────────────────────────── */}
        <section className="px-5 py-28 text-center md:px-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-[600px]"
          >
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#0055ff]">
              Early Access
            </span>
            <h2 className="mt-3 mb-4 text-[36px] md:text-[56px] font-black tracking-[-0.04em] text-black leading-[1.05]">
              Your reputation. <br />
              <span className="text-[#0055ff]">Automated.</span>
            </h2>
            <p className="mb-8 text-[15px] text-black/45 font-medium">
              Limited early access spots. Setup takes 3 minutes.
            </p>

            {submitted ? (
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-5 py-3 text-[14px] font-semibold text-emerald-600">
                ✓ You're on the list — we'll be in touch.
              </div>
            ) : (
              <div className="relative mx-auto max-w-[460px]">
                <input
                  type="email"
                  placeholder="business@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-14 w-full rounded-full border border-black/[0.08] bg-[#f9fafb] px-6 pr-36 text-[14px] font-medium text-black placeholder:text-black/30 outline-none focus:border-[#0055ff]/30 focus:ring-2 focus:ring-[#0055ff]/10 transition-all"
                />
                <button
                  onClick={() => setSubmitted(true)}
                  className="absolute right-1.5 top-1.5 bottom-1.5 rounded-full bg-black px-5 text-[12px] font-semibold text-white hover:bg-black/85 transition-colors"
                >
                  Join Phase 01
                </button>
              </div>
            )}
          </motion.div>
        </section>

        {/* ─ Footer ─────────────────────────────────── */}
        <footer className="border-t border-black/[0.05] px-5 py-8 md:px-10">
          <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 md:flex-row">
            <div className="text-[16px] font-black tracking-tight text-black">
              Sol<span className="text-[#0055ff]">sara</span>
            </div>
            <div className="text-[11px] font-medium text-black/25 uppercase tracking-[0.18em]">
              © 2025 Solsara · Reputation OS
            </div>
            <div className="flex gap-6">
              {["Terms", "Privacy"].map((l) => (
                <Link key={l} href="#" className="text-[11px] font-medium text-black/35 no-underline hover:text-black transition-colors uppercase tracking-widest">
                  {l}
                </Link>
              ))}
            </div>
          </div>
        </footer>

      </div>
    </main>
  );
}
