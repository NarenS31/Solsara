"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import VantaBackground from "./components/VantaBackground";
import VantaCloudsBackground from "./components/VantaCloudsBackground";

const FADE_UP = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

const STAGGER = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
};

const REVIEWS = [
    { name: "James T.", rating: 5, text: "Absolutely outstanding service. The team went above and beyond.", time: "2m ago", responded: true },
    { name: "Sarah M.", rating: 4, text: "Really solid experience overall. Would definitely recommend.", time: "14m ago", responded: true },
    { name: "David P.", rating: 5, text: "Best experience I've had in years. Will be coming back.", time: "31m ago", responded: true },
    { name: "Emma R.", rating: 3, text: "Decent place but the wait time was longer than expected.", time: "1h ago", responded: true },
];

function Star({ filled }: { filled: boolean }) {
    return <span style={{ color: filled ? "#F5A623" : "#2A2A2A", fontSize: "13px" }}>★</span>;
}

function ReviewTicker() {
    return (
        <div className="relative overflow-hidden" style={{ height: "340px" }}>
            <div className="absolute inset-0 z-10 pointer-events-none"
                style={{ background: "linear-gradient(to bottom, var(--bg) 0%, transparent 18%, transparent 82%, var(--bg) 100%)" }} />
            <motion.div
                animate={{ y: [0, -260] }}
                transition={{ duration: 10, repeat: Infinity, repeatType: "loop", ease: "linear" }}
                className="flex flex-col gap-4"
            >
                {[...REVIEWS, ...REVIEWS].map((r, i) => (
                    <div
                        key={i}
                        className="review-card"
                        style={{
                            background: "rgba(18,18,18,0.55)",
                            backdropFilter: "blur(10px)",
                            WebkitBackdropFilter: "blur(10px)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: "14px",
                            padding: "20px 24px",
                            minWidth: "300px",
                            boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                            <span style={{ fontFamily: "var(--font-display)", fontSize: "15px", fontWeight: "600", color: "var(--text-primary)", letterSpacing: "-0.02em" }}>{r.name}</span>
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>{r.time}</span>
                        </div>
                        <div style={{ display: "flex", gap: "3px", marginBottom: "12px" }}>
                            {[1, 2, 3, 4, 5].map(s => <Star key={s} filled={s <= r.rating} />)}
                        </div>
                        <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.6", marginBottom: "12px" }}>{r.text}</p>
                        {r.responded && (
                            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
                                <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--accent)", letterSpacing: "0.12em", fontWeight: "500" }}>
                                    SOLSARA RESPONDED · AUTO
                                </span>
                            </div>
                        )}
                    </div>
                ))}
            </motion.div>
        </div>
    );
}

const FEATURES = [
    {
        icon: "◈",
        title: "Review Automation",
        desc: "Responds to every Google review in your voice within 30 minutes. The entry point to your new reputation.",
        active: true,
    },
    {
        icon: "◎",
        title: "Review Velocity",
        desc: "Surgical SMS drip to recent customers. Keep a steady flow of fresh 5-star reviews without effort.",
        active: false,
    },
    {
        icon: "⌁",
        title: "Missed Call Net",
        desc: "Catches every missed call, qualifies the lead, and sends you a summary. Perfect for local service businesses.",
        active: false,
    },
    {
        icon: "◇",
        title: "Gemini Feeder",
        desc: "Optimizes your data so Google AI knows exactly who to recommend when customers search nearby.",
        active: false,
    },
    {
        icon: "▣",
        title: "Social Proof Pack",
        desc: "Turns reviews into premium social media assets. One tap to approve and post to Instagram/Facebook.",
        active: false,
    },
    {
        icon: "⊡",
        title: "Text Receptionist",
        desc: "AI agent behind your Google Text button. Handles FAQs and routes qualified leads directly to you.",
        active: false,
    },
];

const PRICING = [
    {
        label: "OS",
        price: "$99.99",
        period: "/mo",
        desc: "Review Automation + Reputation Dashboard. One location.",
        fineprint: "14 days free, then $99.99/mo. Cancel anytime. No credit card required.",
        cta: "Start free trial",
        primary: true,
    },
];

export default function Landing() {
    const [email, setEmail] = useState("");
    const [submitted, setSubmitted] = useState(false);

    return (
        <main style={{ position: "relative", minHeight: "100vh", overflowX: "hidden", zIndex: 1 }}>
            <VantaBackground />
            <div aria-hidden style={{ position: "fixed", inset: 0, background: "linear-gradient(180deg, rgba(14,14,14,0.85) 0%, rgba(14,14,14,0.92) 50%, rgba(14,14,14,0.95) 100%)", zIndex: 0, pointerEvents: "none" }} />
            <div style={{ position: "relative", zIndex: 1 }}>

                {/* NAV - minimal */}
                <nav className="nav-minimal" style={{
                    position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
                    background: "rgba(14,14,14,0.6)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    padding: "22px clamp(24px, 6vw, 80px)",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                    <Link href="/" style={{ textDecoration: "none" }}>
                        <span style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "18px", letterSpacing: "-0.04em", color: "var(--text-primary)" }}>
                            Sol<span style={{ color: "var(--accent)" }}>sara</span>
                        </span>
                    </Link>
                    <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
                        <Link href="#how-it-works" className="nav-link" style={{ fontFamily: "var(--font-display)", fontSize: "13px", fontWeight: "500", color: "var(--text-secondary)", textDecoration: "none" }}>Product</Link>
                        <Link href="#pricing" className="nav-link" style={{ fontFamily: "var(--font-display)", fontSize: "13px", fontWeight: "500", color: "var(--text-secondary)", textDecoration: "none" }}>Pricing</Link>
                        <Link href="/dashboard" style={{
                            fontFamily: "var(--font-display)", fontSize: "12px", fontWeight: "600",
                            color: "var(--text-primary)", textDecoration: "none",
                            padding: "10px 18px", borderRadius: "999px",
                            border: "1px solid var(--border-hover)",
                            background: "rgba(255,255,255,0.03)",
                        }}>
                            Dashboard
                        </Link>
                    </div>
                </nav>

                {/* HERO */}
                <section className="grid-bg" style={{
                    paddingTop: "160px", paddingBottom: "120px",
                    paddingLeft: "clamp(20px, 5vw, 64px)", paddingRight: "clamp(20px, 5vw, 64px)",
                    width: "100%", maxWidth: "100%",
                    display: "grid", gridTemplateColumns: "1fr 1fr",
                    gap: "80px", alignItems: "center",
                }}>
                    <motion.div variants={STAGGER} initial="hidden" animate="show">
                        <motion.div variants={FADE_UP} style={{
                            fontFamily: "var(--font-display)", fontSize: "13px", fontWeight: "600", color: "var(--accent)",
                            letterSpacing: "0.08em", textTransform: "uppercase",
                            marginBottom: "24px", display: "flex", alignItems: "center", gap: "12px",
                        }}>
                            <span style={{ display: "inline-block", width: "6px", height: "6px", background: "var(--accent)", borderRadius: "50%", animation: "pulse 2s infinite" }} />
                            Reputation OS for Local Business
                        </motion.div>

                        <motion.h1 variants={FADE_UP} style={{
                            fontSize: "clamp(40px, 5vw, 64px)",
                            fontWeight: "800",
                            letterSpacing: "-0.04em",
                            lineHeight: "1.05",
                            marginBottom: "24px",
                            color: "#E8E4DC",
                        }}>
                            More customers find you.<br />
                            More trust you.<br />
                            <span style={{ color: "#F5A623" }}>On autopilot.</span>
                        </motion.h1>

                        <motion.p variants={FADE_UP} style={{
                            fontSize: "16px", color: "#666",
                            lineHeight: "1.7", marginBottom: "40px",
                            maxWidth: "480px",
                        }}>
                            Solsara is the operating system for your Google presence. We automate your reputation, dominate local search, and handle customer interaction—starting with 100% automated review replies.
                        </motion.p>

                        <motion.div variants={FADE_UP} style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                            <Link href="/dashboard" style={{
                                background: "#F5A623", color: "#080808",
                                padding: "14px 28px", borderRadius: "10px",
                                fontSize: "14px", fontWeight: "700",
                                textDecoration: "none", letterSpacing: "0.01em",
                            }}>
                                Get Early Access →
                            </Link>
                            <span style={{ fontFamily: "DM Mono", fontSize: "11px", color: "#333" }}>
                                Join the waitlist · Launching soon
                            </span>
                        </motion.div>

                        <motion.div variants={FADE_UP} style={{
                            display: "flex", gap: "32px", marginTop: "48px",
                            paddingTop: "32px", borderTop: "1px solid #1A1A1A",
                        }}>
                            {[
                                { value: "< 30min", label: "Response time" },
                                { value: "100%", label: "Response rate" },
                                { value: "98%", label: "Gross margin" },
                            ].map((stat) => (
                                <div key={stat.label}>
                                    <div style={{ fontSize: "22px", fontWeight: "800", color: "#E8E4DC", letterSpacing: "-0.03em" }}>{stat.value}</div>
                                    <div style={{ fontFamily: "DM Mono", fontSize: "10px", color: "#444", marginTop: "4px" }}>{stat.label}</div>
                                </div>
                            ))}
                        </motion.div>
                    </motion.div>

                    {/* REVIEW TICKER */}
                    <motion.div
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] as const }}
                    >
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", marginBottom: "16px", textAlign: "right", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                            Preview: Your profile on Solsara
                        </div>
                        <ReviewTicker />
                    </motion.div>
                </section>

                {/* HOW IT WORKS */}
                <section id="how-it-works" style={{
                    padding: "120px clamp(20px, 5vw, 64px)",
                    width: "100%", maxWidth: "100%",
                    borderTop: "1px solid #111",
                }}>
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        style={{ marginBottom: "64px" }}
                    >
                        <div className="section-label">How it works</div>
                        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(26px, 3.5vw, 38px)", fontWeight: "700", letterSpacing: "-0.03em", maxWidth: "480px", color: "var(--text-primary)" }}>
                            Set it once. It runs forever.
                        </h2>
                    </motion.div>

                    <div style={{ display: "flex", alignItems: "stretch", justifyContent: "center", flexWrap: "wrap", gap: "0" }}>
                        {[
                            { step: 1, title: "Connect Google", desc: "Link your Google Business Profile in 60 seconds. Solsara scans your presence and identifies growth gaps." },
                            { step: 2, title: "Activate Modules", desc: "Configure your voice and rules for Review Automation. One switch to start dominating your local area." },
                            { step: 3, title: "Growth Autopilot", desc: "Solsara handles the heavy lifting—reviews, search ranking, and lead capture. You just watch the dashboard." },
                        ].map((item, i) => (
                            <div key={item.step} style={{ display: "flex", alignItems: "stretch" }}>
                                <motion.div
                                    initial={{ opacity: 0, y: 16 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.4, delay: i * 0.08 }}
                                    style={{
                                        background: "transparent",
                                        border: "1px solid var(--border)",
                                        borderRadius: "12px",
                                        padding: "36px 28px",
                                        minWidth: "260px",
                                        maxWidth: "320px",
                                        borderLeft: "2px solid var(--accent)",
                                    }}
                                >
                                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", letterSpacing: "0.1em", marginBottom: "14px", display: "block" }}>
                                        {String(item.step).padStart(2, "0")}
                                    </span>
                                    <div style={{ fontFamily: "var(--font-display)", fontSize: "19px", fontWeight: "700", marginBottom: "10px", letterSpacing: "-0.02em", color: "var(--text-primary)" }}>{item.title}</div>
                                    <div style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.65" }}>{item.desc}</div>
                                </motion.div>
                                {i < 2 && (
                                    <div style={{ display: "flex", alignItems: "center", padding: "0 10px", flexShrink: 0 }}>
                                        <span style={{ color: "var(--border)", fontSize: "18px" }}>→</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Google OAuth section - Clouds background */}
                <section
                    id="google-oauth"
                    style={{
                        position: "relative",
                        padding: "100px clamp(24px, 6vw, 80px)",
                        minHeight: "340px",
                        display: "flex",
                        alignItems: "center",
                        borderTop: "1px solid var(--border)",
                    }}
                >
                    <VantaCloudsBackground />
                    <div aria-hidden style={{ position: "absolute", inset: 0, background: "rgba(14,14,14,0.72)", zIndex: 1, pointerEvents: "none" }} />
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        style={{ position: "relative", zIndex: 2, maxWidth: "520px" }}
                    >
                        <div className="section-label" style={{ marginBottom: "10px" }}>Connect once</div>
                        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px, 3vw, 32px)", fontWeight: "700", letterSpacing: "-0.03em", color: "var(--text-primary)", marginBottom: "14px", lineHeight: "1.25" }}>
                            Google OAuth — your profile, unlocked.
                        </h2>
                        <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.65", margin: 0 }}>
                            One connection gives Solsara secure access to your Google Business Profile. Most businesses never hook it up to anything and leave reviews unanswered. We reply to every one in your voice, in under 30 minutes. Most don’t capitalize on it — you do.
                        </p>
                    </motion.div>
                </section>

                {/* FEATURES / MODULES - bento */}
                <section style={{
                    padding: "100px clamp(24px, 6vw, 80px)",
                    width: "100%", maxWidth: "100%",
                    borderTop: "1px solid var(--border)",
                }}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4 }}
                        style={{ marginBottom: "48px" }}
                    >
                        <div className="section-label">The platform</div>
                        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(26px, 3.5vw, 36px)", fontWeight: "700", letterSpacing: "-0.03em", color: "var(--text-primary)", marginBottom: "8px" }}>
                            One platform. Your entire reputation.
                        </h2>
                        <p style={{ fontSize: "14px", color: "var(--text-secondary)", maxWidth: "480px", lineHeight: "1.6" }}>
                            Review replies first. More modules ship over the next 12 months — all included.
                        </p>
                    </motion.div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px", maxWidth: "900px" }}>
                        {FEATURES.map((f, i) => (
                            <motion.div
                                key={f.title}
                                initial={{ opacity: 0, y: 12 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.35, delay: i * 0.05 }}
                                style={{
                                    padding: "22px 24px",
                                    background: "rgba(255,255,255,0.02)",
                                    border: "1px solid var(--border)",
                                    borderRadius: "12px",
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                                    <span style={{ fontFamily: "var(--font-display)", fontSize: "15px", fontWeight: "600", color: "var(--text-primary)", letterSpacing: "-0.02em" }}>{f.title}</span>
                                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", fontWeight: "600", letterSpacing: "0.1em", color: f.active ? "var(--green)" : "var(--text-muted)" }}>
                                        {f.active ? "Live" : "Soon"}
                                    </span>
                                </div>
                                <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.55", margin: 0 }}>{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* PRICING - clean */}
                <section id="pricing" style={{
                    padding: "100px clamp(24px, 6vw, 80px)",
                    width: "100%", maxWidth: "100%",
                    borderTop: "1px solid var(--border)",
                }}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4 }}
                        style={{ marginBottom: "48px" }}
                    >
                        <div className="section-label">Pricing</div>
                        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(26px, 3.5vw, 36px)", fontWeight: "700", letterSpacing: "-0.03em", color: "var(--text-primary)" }}>
                            Simple. No surprises.
                        </h2>
                    </motion.div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: "24px", justifyContent: "center", width: "100%" }}>
                        {PRICING.map((plan, i) => (
                            <motion.div
                                key={plan.label}
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: i * 0.06 }}
                                style={{
                                    margin: "0 auto",
                                    background: plan.primary ? "rgba(245, 166, 35, 0.06)" : "transparent",
                                    border: plan.primary ? "1px solid rgba(245, 166, 35, 0.25)" : "1px solid var(--border)",
                                    borderRadius: "16px",
                                    padding: "32px 36px",
                                    minWidth: "240px",
                                    maxWidth: "280px",
                                }}
                            >
                                <div style={{ fontFamily: "var(--font-display)", fontSize: "12px", fontWeight: "600", color: plan.primary ? "var(--accent)" : "var(--text-muted)", letterSpacing: "0.04em", marginBottom: "16px" }}>
                                    {plan.label}
                                </div>
                                <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "8px" }}>
                                    <span style={{ fontFamily: "var(--font-display)", fontSize: "32px", fontWeight: "700", letterSpacing: "-0.04em", color: plan.primary ? "var(--accent)" : "var(--text-primary)" }}>{plan.price}</span>
                                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-muted)" }}>{plan.period}</span>
                                </div>
                                <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5", marginBottom: "12px", marginTop: 0 }}>{plan.desc}</p>
                                {plan.fineprint && (
                                    <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: "1.5", marginBottom: "24px", marginTop: 0 }}>{plan.fineprint}</p>
                                )}
                                <Link
                                    href="/onboarding"
                                    style={{
                                        display: "block", textAlign: "center",
                                        padding: "12px 20px",
                                        background: plan.primary ? "var(--accent)" : "transparent",
                                        color: plan.primary ? "#0a0a0a" : "var(--text-primary)",
                                        border: plan.primary ? "none" : "1px solid var(--border-hover)",
                                        borderRadius: "10px",
                                        fontFamily: "var(--font-display)", fontSize: "13px", fontWeight: "600",
                                        textDecoration: "none",
                                        cursor: "pointer",
                                        margin: "0 auto",
                                        maxWidth: "220px",
                                    }}
                                >
                                    {plan.cta}
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* WAITLIST / CTA */}
                <section style={{
                    padding: "120px clamp(20px, 5vw, 64px)",
                    borderTop: "1px solid #111",
                    textAlign: "center",
                    width: "100%",
                }}>
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <div style={{ fontFamily: "DM Mono", fontSize: "10px", color: "#444", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "24px" }}>
                            Get early access
                        </div>
                        <h2 style={{ fontSize: "clamp(32px, 4vw, 52px)", fontWeight: "800", letterSpacing: "-0.04em", marginBottom: "16px" }}>
                            Your reviews.<br /><span style={{ color: "#F5A623" }}>Handled.</span>
                        </h2>
                        <p style={{ fontSize: "15px", color: "#555", marginBottom: "40px" }}>
                            Join businesses already on Solsara. Setup takes 3 minutes.
                        </p>

                        {submitted ? (
                            <div style={{ fontFamily: "DM Mono", fontSize: "13px", color: "#3DDB82" }}>
                                ✓ You're on the list. We'll be in touch.
                            </div>
                        ) : (
                            <div style={{ display: "flex", gap: "8px", justifyContent: "center", maxWidth: "400px", margin: "0 auto" }}>
                                <input
                                    type="email"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    style={{
                                        flex: 1, padding: "12px 16px",
                                        background: "#0C0C0C", border: "1px solid #1A1A1A",
                                        borderRadius: "8px", color: "#E8E4DC",
                                        fontFamily: "DM Mono", fontSize: "12px",
                                        outline: "none",
                                    }}
                                />
                                <button
                                    onClick={() => setSubmitted(true)}
                                    style={{
                                        padding: "12px 20px", background: "#F5A623",
                                        color: "#080808", border: "none", borderRadius: "8px",
                                        fontSize: "12px", fontWeight: "700", cursor: "pointer",
                                        fontFamily: "Syne, sans-serif", letterSpacing: "0.02em",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    Get access →
                                </button>
                            </div>
                        )}
                    </motion.div>
                </section>

                {/* FOOTER */}
                <footer style={{
                    borderTop: "1px solid #111",
                    padding: "32px clamp(20px, 5vw, 64px)",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    width: "100%",
                }}>
                    <div style={{ fontWeight: "800", fontSize: "16px", letterSpacing: "-0.03em" }}>
                        Sol<span style={{ color: "#F5A623" }}>sara</span>
                    </div>
                    <div style={{ fontFamily: "DM Mono", fontSize: "10px", color: "#333" }}>
                        © 2025 Solsara · Reputation OS
                    </div>
                </footer>

            </div>
        </main>
    );
}
