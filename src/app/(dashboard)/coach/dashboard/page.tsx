// ============================================================
// /coach/dashboard – Dashboard principale Coach
// Dati reali: statistiche dal DB tramite RPC e API
// ============================================================
"use client";

import { useEffect, useState } from "react";
import { useRoleRedirect } from "@frontend/hooks/useRoleRedirect";
import { RuoloEnum } from "@backend/domain/model/enums";
import type { CoachStats, Coach } from "@backend/domain/model/types";
import Link from "next/link";

interface StatCardProps {
    label: string;
    value: string | number;
    icon: string;
    color: string;
    suffix?: string;
}

function StatCard({ label, value, icon, color, suffix }: StatCardProps) {
    return (
        <div style={{
            padding: "1.5rem",
            borderRadius: "var(--tf-radius)",
            background: "hsl(var(--tf-surface))",
            border: "1px solid hsl(var(--tf-border))",
            display: "flex", flexDirection: "column", gap: "0.5rem",
            position: "relative", overflow: "hidden",
        }}>
            <div style={{
                position: "absolute", top: 0, right: 0,
                width: 80, height: 80, borderRadius: "0 0 0 80px",
                background: `${color}18`, display: "flex",
                alignItems: "flex-start", justifyContent: "flex-end",
                padding: "0.75rem",
            }}>
                <span style={{ fontSize: "1.4rem" }}>{icon}</span>
            </div>
            <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "hsl(var(--tf-text-muted))", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {label}
            </p>
            <p style={{ fontSize: "2rem", fontWeight: 900, color, lineHeight: 1 }}>
                {value}{suffix && <span style={{ fontSize: "1rem", marginLeft: "0.2rem" }}>{suffix}</span>}
            </p>
        </div>
    );
}

const QUICK_LINKS = [
    { href: "/coaches/atleti", icon: "👥", label: "I miei atleti", desc: "Visualizza il tuo roster" },
    { href: "/coaches/disponibilita", icon: "🗓️", label: "Disponibilità", desc: "Gestisci i tuoi slot" },
    { href: "/coaches/piani", icon: "📋", label: "Sessioni", desc: "Tutte le tue prenotazioni" },
];

export default function CoachDashboard() {
    const { user, loading } = useRoleRedirect(RuoloEnum.COACH);
    const [coach, setCoach] = useState<Coach | null>(null);
    const [stats, setStats] = useState<CoachStats | null>(null);
    const [loadingStats, setLoadingStats] = useState(true);

    useEffect(() => {
        if (!user) return;
        const fetchData = async () => {
            try {
                const res = await fetch("/api/coaches/me");
                if (res.ok) {
                    const data = await res.json();
                    setCoach(data.coach ?? null);
                    setStats(data.stats ?? null);
                }
            } finally {
                setLoadingStats(false);
            }
        };
        fetchData();
    }, [user]);

    if (loading) return null;

    const displayName = user?.user_metadata?.nome ?? user?.email?.split("@")[0] ?? "Coach";

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
            {/* Header */}
            <div style={{
                padding: "1.75rem 2rem",
                borderRadius: "var(--tf-radius)",
                background: "linear-gradient(135deg, hsl(145 60% 35%), hsl(var(--tf-primary)))",
                color: "#fff",
                position: "relative", overflow: "hidden",
            }}>
                <div style={{ position: "absolute", top: -30, right: -30, width: 150, height: 150, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
                <div style={{ position: "absolute", bottom: -20, right: 60, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
                <h1 style={{ fontSize: "1.6rem", fontWeight: 900, marginBottom: "0.25rem" }}>
                    👋 Ciao, {displayName}!
                </h1>
                <p style={{ opacity: 0.8, fontSize: "0.9rem" }}>
                    {coach?.specializzazione ? `${coach.specializzazione} · ` : ""}Dashboard Coach TrackFit
                </p>
                {coach?.rating !== undefined && coach.rating > 0 && (
                    <div style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", gap: "4px" }}>
                        {[1, 2, 3, 4, 5].map(s => (
                            <span key={s} style={{ fontSize: "1rem", color: s <= Math.round(coach.rating!) ? "#fbbf24" : "rgba(255,255,255,0.3)" }}>★</span>
                        ))}
                        <span style={{ fontSize: "0.8rem", marginLeft: 6, opacity: 0.9 }}>{coach.rating.toFixed(1)} / 5.0</span>
                    </div>
                )}
            </div>

            {/* Statistiche */}
            <div>
                <h2 style={{ fontSize: "0.85rem", fontWeight: 700, color: "hsl(var(--tf-text-muted))", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>
                    LE TUE STATISTICHE
                </h2>
                {loadingStats ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem" }}>
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} style={{ height: 110, borderRadius: "var(--tf-radius)", background: "hsl(var(--tf-surface))", border: "1px solid hsl(var(--tf-border))", opacity: 0.5 }} />
                        ))}
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem" }}>
                        <StatCard label="Atleti Seguiti" value={stats?.atleti_seguiti ?? 0} icon="👥" color="hsl(145 60% 45%)" />
                        <StatCard label="Sessioni Oggi" value={stats?.sessioni_oggi ?? 0} icon="📅" color="hsl(var(--tf-primary))" />
                        <StatCard label="Sessioni Mese" value={stats?.sessioni_mese ?? 0} icon="📊" color="hsl(200 80% 55%)" />
                        <StatCard label="Rating" value={(stats?.rating_medio ?? 0).toFixed(1)} icon="⭐" color="hsl(45 90% 55%)" suffix="/ 5" />
                    </div>
                )}
            </div>

            {/* Quick links */}
            <div>
                <h2 style={{ fontSize: "0.85rem", fontWeight: 700, color: "hsl(var(--tf-text-muted))", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>
                    ACCESSO RAPIDO
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
                    {QUICK_LINKS.map(link => (
                        <Link key={link.href} href={link.href} style={{
                            padding: "1.25rem",
                            borderRadius: "var(--tf-radius)",
                            background: "hsl(var(--tf-surface))",
                            border: "1px solid hsl(var(--tf-border))",
                            textDecoration: "none", color: "inherit",
                            display: "flex", gap: "1rem", alignItems: "center",
                            transition: "border-color 0.2s, transform 0.15s",
                        }}
                            onMouseEnter={e => {
                                (e.currentTarget as HTMLAnchorElement).style.borderColor = "hsl(var(--tf-primary)/.4)";
                                (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)";
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLAnchorElement).style.borderColor = "hsl(var(--tf-border))";
                                (e.currentTarget as HTMLAnchorElement).style.transform = "none";
                            }}
                        >
                            <span style={{ fontSize: "1.75rem" }}>{link.icon}</span>
                            <div>
                                <p style={{ fontWeight: 700, fontSize: "0.9rem" }}>{link.label}</p>
                                <p style={{ fontSize: "0.75rem", color: "hsl(var(--tf-text-muted))" }}>{link.desc}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Profilo info */}
            {coach && (
                <div style={{
                    padding: "1.25rem",
                    borderRadius: "var(--tf-radius)",
                    background: "hsl(var(--tf-surface))",
                    border: "1px solid hsl(var(--tf-border))",
                }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                        <h2 style={{ fontSize: "0.95rem", fontWeight: 700 }}>Il tuo profilo</h2>
                        <Link href="/coaches/disponibilita" style={{ fontSize: "0.78rem", color: "hsl(var(--tf-primary))", textDecoration: "none" }}>
                            ✏️ Modifica →
                        </Link>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                        {coach.specializzazione && (
                            <div>
                                <p style={{ fontSize: "0.7rem", color: "hsl(var(--tf-text-muted))", fontWeight: 600 }}>Specializzazione</p>
                                <p style={{ fontSize: "0.875rem" }}>{coach.specializzazione}</p>
                            </div>
                        )}
                        {coach.telefono && (
                            <div>
                                <p style={{ fontSize: "0.7rem", color: "hsl(var(--tf-text-muted))", fontWeight: 600 }}>Telefono</p>
                                <p style={{ fontSize: "0.875rem" }}>{coach.telefono}</p>
                            </div>
                        )}
                        {coach.bio && (
                            <div style={{ gridColumn: "1 / -1" }}>
                                <p style={{ fontSize: "0.7rem", color: "hsl(var(--tf-text-muted))", fontWeight: 600, marginBottom: "0.25rem" }}>Bio</p>
                                <p style={{ fontSize: "0.875rem", color: "hsl(var(--tf-text-muted))", lineHeight: 1.5 }}>{coach.bio}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
