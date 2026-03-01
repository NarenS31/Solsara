"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface Review {
    id: number;
    reviewer: string;
    rating: number;
    comment: string;
    time: string;
    status: string;
    response: string | null;
    flagReason?: string;
}

const NAV_ITEMS = [
    { id: "reviews", label: "Review Replies", icon: "◈", active: true },
    { id: "velocity", label: "Review Velocity", icon: "◎", soon: true },
    { id: "missed", label: "Missed Call Net", icon: "⌁", soon: true },
    { id: "gemini", label: "Gemini Feeder", icon: "◇", soon: true },
    { id: "social", label: "Social Proof", icon: "▣", soon: true },
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
    },
    {
        id: 2,
        reviewer: "Sarah Mitchell",
        rating: 1,
        comment: "I got food poisoning after eating here. Been sick for two days. This is completely unacceptable and I'm considering legal action.",
        time: "4h ago",
        status: "held",
        response: null,
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
    },
    {
        id: 4,
        reviewer: "Emma Rodriguez",
        rating: 3,
        comment: "Decent place but the wait time was longer than expected. Food quality was good though.",
        time: "1d ago",
        status: "posted",
        response: "Hi Emma, thank you for the honest feedback! We're actively working on our wait times and hope to give you a much faster experience next visit.",
    },
    {
        id: 5,
        reviewer: "Michael Chen",
        rating: 5,
        comment: "Incredible attention to detail. You can tell the team really cares about what they do.",
        time: "2d ago",
        status: "posted",
        response: "Michael, this genuinely made our day — thank you! We do care deeply and it means everything to hear that it shows.",
    },
];

function Stars({ rating }: { rating: number }) {
    return (
        <div style={{ display: "flex", gap: "2px" }}>
            {[1, 2, 3, 4, 5].map(s => (
                <span key={s} style={{ color: s <= rating ? "#F5A623" : "#2A2A2A", fontSize: "11px" }}>★</span>
            ))}
        </div>
    );
}

function Badge({ status }: { status: string }) {
    const map: Record<string, { bg: string; color: string; label: string }> = {
        posted: { bg: "#0A2A1A", color: "#3DDB82", label: "Posted" },
        held: { bg: "#2A1A0A", color: "#F5A623", label: "Needs Review" },
        pending: { bg: "#1A1A2A", color: "#7B8CDE", label: "Pending" },
    };
    const s = map[status] || map.pending;
    return (
        <span style={{
            background: s.bg, color: s.color,
            padding: "3px 10px", borderRadius: "20px",
            fontSize: "10px", fontWeight: "600",
            letterSpacing: "0.06em", textTransform: "uppercase",
            fontFamily: "DM Mono, monospace",
        }}>
            {s.label}
        </span>
    );
}

export default function Dashboard() {
    const [reviews, setReviews] = useState<Review[]>(MOCK_REVIEWS);
    const [activeNav, setActiveNav] = useState("reviews");
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editText, setEditText] = useState("");
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const posted = reviews.filter(r => r.status === "posted").length;
    const held = reviews.filter(r => r.status === "held").length;
    const avg = (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1);

    function approve(id: number) {
        setReviews(prev => prev.map(r =>
            r.id === id ? { ...r, status: "posted", response: editText } : r
        ));
        setEditingId(null);
        setEditText("");
    }

    return (
        <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>

            {/* SIDEBAR */}
            <aside style={{
                width: "240px", minHeight: "100vh",
                background: "#0A0A0A",
                borderRight: "1px solid #141414",
                display: "flex", flexDirection: "column",
                padding: "28px 0",
                position: "fixed", left: 0, top: 0, bottom: 0,
                zIndex: 100,
            }}>
                {/* Logo */}
                <div style={{ padding: "0 20px 24px", borderBottom: "1px solid #141414" }}>
                    <Link href="/" style={{ textDecoration: "none" }}>
                        <div style={{ fontWeight: "800", fontSize: "18px", letterSpacing: "-0.03em", color: "#E8E4DC" }}>
                            Sol<span style={{ color: "#F5A623" }}>sara</span>
                        </div>
                    </Link>
                    <div style={{ fontFamily: "DM Mono", fontSize: "9px", color: "#333", letterSpacing: "0.12em", marginTop: "4px", textTransform: "uppercase" }}>
                        Reputation OS
                    </div>
                </div>

                {/* Nav */}
                <nav style={{ padding: "20px 10px", flex: 1 }}>
                    <div style={{ fontFamily: "DM Mono", fontSize: "9px", color: "#2A2A2A", letterSpacing: "0.15em", textTransform: "uppercase", padding: "0 10px", marginBottom: "8px" }}>
                        Active
                    </div>

                    {NAV_ITEMS.filter(n => !n.soon).map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveNav(item.id)}
                            style={{
                                display: "flex", alignItems: "center", gap: "10px",
                                width: "100%", padding: "9px 10px",
                                borderRadius: "8px", border: "none",
                                background: activeNav === item.id ? "#141414" : "transparent",
                                color: activeNav === item.id ? "#E8E4DC" : "#444",
                                fontFamily: "Syne, sans-serif", fontSize: "13px", fontWeight: "500",
                                cursor: "pointer", textAlign: "left",
                                transition: "all 0.15s",
                                position: "relative",
                            }}
                        >
                            {activeNav === item.id && (
                                <div style={{
                                    position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
                                    width: "3px", height: "16px", background: "#F5A623", borderRadius: "0 2px 2px 0",
                                }} />
                            )}
                            <span style={{ fontSize: "13px", width: "18px", textAlign: "center" }}>{item.icon}</span>
                            {item.label}
                        </button>
                    ))}

                    <div style={{ fontFamily: "DM Mono", fontSize: "9px", color: "#2A2A2A", letterSpacing: "0.15em", textTransform: "uppercase", padding: "0 10px", marginBottom: "8px", marginTop: "24px" }}>
                        Coming Soon
                    </div>

                    {NAV_ITEMS.filter(n => n.soon).map(item => (
                        <div
                            key={item.id}
                            style={{
                                display: "flex", alignItems: "center", gap: "10px",
                                padding: "9px 10px", borderRadius: "8px",
                                color: "#2A2A2A", fontSize: "13px", fontWeight: "500",
                                opacity: 0.5, cursor: "default",
                            }}
                        >
                            <span style={{ fontSize: "13px", width: "18px", textAlign: "center" }}>{item.icon}</span>
                            {item.label}
                            <span style={{
                                marginLeft: "auto", fontFamily: "DM Mono", fontSize: "8px",
                                background: "#141414", color: "#333",
                                padding: "2px 6px", borderRadius: "4px",
                            }}>
                                Soon
                            </span>
                        </div>
                    ))}
                </nav>

                {/* Connected status */}
                <div style={{ padding: "20px", borderTop: "1px solid #141414" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{
                            width: "6px", height: "6px", background: "#3DDB82",
                            borderRadius: "50%", animation: "pulse 2s infinite",
                        }} />
                        <span style={{ fontFamily: "DM Mono", fontSize: "10px", color: "#3DDB82" }}>
                            Google connected
                        </span>
                    </div>
                    <div style={{ fontFamily: "DM Mono", fontSize: "9px", color: "#2A2A2A", marginTop: "6px" }}>
                        Last sync · 2 min ago
                    </div>
                </div>
            </aside>

            {/* MAIN */}
            <main style={{ marginLeft: "240px", flex: 1, padding: "40px 48px", maxWidth: "calc(100vw - 240px)" }}>

                {/* Header */}
                <div style={{ marginBottom: "40px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                        <h1 style={{ fontSize: "26px", fontWeight: "800", letterSpacing: "-0.03em", color: "#E8E4DC" }}>
                            Review Replies
                        </h1>
                        <div style={{ fontFamily: "DM Mono", fontSize: "11px", color: "#333", marginTop: "6px", letterSpacing: "0.05em" }}>
                            Monitoring · Auto-responding · 24/7
                        </div>
                    </div>
                    <button style={{
                        padding: "9px 16px", background: "#0C0C0C",
                        border: "1px solid #1A1A1A", borderRadius: "8px",
                        color: "#888", fontFamily: "Syne, sans-serif",
                        fontSize: "12px", fontWeight: "600", cursor: "pointer",
                    }}>
                        Settings
                    </button>
                </div>

                {/* Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "40px" }}>
                    {[
                        { label: "Avg Rating", value: avg, color: "#F5A623", change: "↑ 0.2 this week" },
                        { label: "Auto-Posted", value: posted, color: "#3DDB82", change: "This week" },
                        { label: "Needs Review", value: held, color: held > 0 ? "#F5A623" : "#E8E4DC", change: "Flagged by AI" },
                        { label: "Response Rate", value: "100%", color: "#3DDB82", change: "All time" },
                    ].map((stat) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                            style={{
                                background: "#0C0C0C", border: "1px solid #141414",
                                borderRadius: "12px", padding: "20px 24px",
                            }}
                        >
                            <div style={{ fontFamily: "DM Mono", fontSize: "9px", color: "#333", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "10px" }}>
                                {stat.label}
                            </div>
                            <div style={{ fontSize: "30px", fontWeight: "800", letterSpacing: "-0.04em", color: stat.color }}>
                                {stat.value}
                            </div>
                            <div style={{ fontFamily: "DM Mono", fontSize: "10px", color: "#2A2A2A", marginTop: "6px" }}>
                                {stat.change}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Held reviews */}
                <AnimatePresence>
                    {held > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            style={{ marginBottom: "32px" }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                                <div style={{ fontSize: "14px", fontWeight: "700", letterSpacing: "-0.01em" }}>Needs Your Attention</div>
                                <div style={{
                                    fontFamily: "DM Mono", fontSize: "10px",
                                    background: "#2A1A0A", color: "#F5A623",
                                    padding: "4px 10px", borderRadius: "20px",
                                }}>
                                    {held} flagged
                                </div>
                            </div>

                            {reviews.filter(r => r.status === "held").map(review => (
                                <motion.div
                                    key={review.id}
                                    layout
                                    style={{
                                        background: "#0C0A08", border: "1px solid #2A1500",
                                        borderRadius: "12px", padding: "24px",
                                        marginBottom: "12px",
                                    }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                                        <div>
                                            <div style={{ fontSize: "14px", fontWeight: "700", marginBottom: "6px" }}>{review.reviewer}</div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                <Stars rating={review.rating} />
                                                <span style={{ fontFamily: "DM Mono", fontSize: "10px", color: "#333" }}>{review.time}</span>
                                            </div>
                                        </div>
                                        <Badge status={review.status} />
                                    </div>

                                    <p style={{ fontSize: "13px", color: "#777", lineHeight: "1.6", marginBottom: "16px" }}>{review.comment}</p>

                                    <div style={{
                                        display: "flex", alignItems: "center", gap: "10px",
                                        background: "#1A0F00", border: "1px solid #2A1800",
                                        borderRadius: "8px", padding: "12px 16px", marginBottom: "16px",
                                    }}>
                                        <span style={{ fontSize: "13px" }}>⚠</span>
                                        <span style={{ fontFamily: "DM Mono", fontSize: "11px", color: "#F5A623" }}>
                                            {review.flagReason}
                                        </span>
                                    </div>

                                    {editingId === review.id ? (
                                        <>
                                            <div style={{ fontFamily: "DM Mono", fontSize: "9px", color: "#333", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "8px" }}>
                                                Your response
                                            </div>
                                            <textarea
                                                value={editText}
                                                onChange={e => setEditText(e.target.value)}
                                                placeholder="Write your response..."
                                                style={{
                                                    width: "100%", background: "#141414",
                                                    border: "1px solid #2A2A2A", borderRadius: "8px",
                                                    padding: "12px", color: "#E8E4DC",
                                                    fontFamily: "Syne, sans-serif", fontSize: "13px",
                                                    lineHeight: "1.6", resize: "vertical", minHeight: "80px",
                                                    outline: "none", marginBottom: "12px",
                                                }}
                                            />
                                            <div style={{ display: "flex", gap: "8px" }}>
                                                <button
                                                    onClick={() => approve(review.id)}
                                                    style={{
                                                        padding: "8px 18px", background: "#F5A623",
                                                        color: "#080808", border: "none", borderRadius: "8px",
                                                        fontSize: "12px", fontWeight: "700", cursor: "pointer",
                                                        fontFamily: "Syne, sans-serif",
                                                    }}
                                                >
                                                    Post response
                                                </button>
                                                <button
                                                    onClick={() => setEditingId(null)}
                                                    style={{
                                                        padding: "8px 16px", background: "#141414",
                                                        color: "#888", border: "1px solid #1A1A1A",
                                                        borderRadius: "8px", fontSize: "12px",
                                                        fontWeight: "600", cursor: "pointer",
                                                        fontFamily: "Syne, sans-serif",
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => { setEditingId(review.id); setEditText(""); }}
                                            style={{
                                                padding: "8px 18px", background: "#F5A623",
                                                color: "#080808", border: "none", borderRadius: "8px",
                                                fontSize: "12px", fontWeight: "700", cursor: "pointer",
                                                fontFamily: "Syne, sans-serif",
                                            }}
                                        >
                                            Write response
                                        </button>
                                    )}
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Recent activity */}
                <div>
                    <div style={{ fontSize: "14px", fontWeight: "700", letterSpacing: "-0.01em", marginBottom: "14px" }}>
                        Recent Activity
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {reviews.filter(r => r.status !== "held").map((review, i) => (
                            <motion.div
                                key={review.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.35, delay: i * 0.06 }}
                                style={{
                                    background: "#0C0C0C", border: "1px solid #141414",
                                    borderRadius: "12px", padding: "22px 24px",
                                }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                                    <div>
                                        <div style={{ fontSize: "14px", fontWeight: "700", marginBottom: "6px" }}>{review.reviewer}</div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                            <Stars rating={review.rating} />
                                            <span style={{ fontFamily: "DM Mono", fontSize: "10px", color: "#333" }}>{review.time}</span>
                                        </div>
                                    </div>
                                    <Badge status={review.status} />
                                </div>

                                <p style={{ fontSize: "13px", color: "#777", lineHeight: "1.6", marginBottom: "14px" }}>{review.comment}</p>

                                {review.response && (
                                    <>
                                        <div style={{ height: "1px", background: "#141414", marginBottom: "14px" }} />
                                        <div style={{ fontFamily: "DM Mono", fontSize: "9px", color: "#F5A623", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "8px" }}>
                                            Solsara responded · Auto
                                        </div>
                                        <p style={{ fontSize: "13px", color: "#555", lineHeight: "1.6" }}>{review.response}</p>
                                    </>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
