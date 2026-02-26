// ============================================================
// /gym/dashboard – Dashboard principale Gestore Palestra
// Dati reali: statistiche dal DB tramite RPC e API
// ============================================================
"use client";

import { useEffect, useState } from "react";
import { useRoleRedirect } from "@frontend/hooks/useRoleRedirect";
import { RuoloEnum } from "@backend/domain/model/enums";
import type { GestoreStats, Struttura } from "@backend/domain/model/types";
import Link from "next/link";

function StatCard({ label, value, icon, color, suffix, prefix }: {
    label: string;
    value: string | number;
    icon: string;
    color: string;
    suffix?: string;
    prefix?: string;
}) {
    return (
        <div style={{
            padding: "1.5rem",
            borderRadius: "var(--tf-radius)",
            background: "hsl(var(--tf-surface))",
            border: "1px solid hsl(var(--tf-border))",
            position: "relative", overflow: "hidden",
        }}>
            <div style={{
                position: "absolute", top: 0, right: 0, width: 80, height: 80,
                borderRadius: "0 0 0 80px",
                background: `${color}18`,
                display: "flex", alignItems: "flex-start", justifyContent: "flex-end",
                padding: "0.75rem",
            }}>
                <span style={{ fontSize: "1.4rem" }}>{icon}</span>
            </div>
            <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "hsl(var(--tf-text-muted))", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
                {label}
            </p>
            <p style={{ fontSize: "2rem", fontWeight: 900, color, lineHeight: 1 }}>
                {prefix}{value}{suffix && <span style={{ fontSize: "1rem", marginLeft: "0.2rem" }}>{suffix}</span>}
            </p>
        </div>
    );
}

const QUICK_LINKS = [
    { href: "/gyms/struttura", icon: "🏋️", label: "Dati Struttura", desc: "Info e contatti palestra" },
    { href: "/gyms/coaches", icon: "💪", label: "Coach", desc: "Gestisci i trainer" },
    { href: "/gyms/corsi", icon: "📆", label: "Corsi", desc: "Programma e gestisci" },
    { href: "/gyms/abbonamenti", icon: "💳", label: "Abbonamenti", desc: "Piani e prezzi" },
    { href: "/gyms/coupon", icon: "🎟️", label: "Coupon", desc: "Promozioni attive" },
];

export default function GymDashboard() {
    const { user, loading } = useRoleRedirect(RuoloEnum.GESTORE);
    const [struttura, setStruttura] = useState<Struttura | null>(null);
    const [stats, setStats] = useState<GestoreStats | null>(null);
    const [loadingStats, setLoadingStats] = useState(true);

    useEffect(() => {
        if (!user) return;
        const fetchData = async () => {
            try {
                const res = await fetch("/api/gyms/me");
                if (res.ok) {
                    const data = await res.json();
                    setStruttura(data.struttura ?? null);
                    setStats(data.stats ?? null);
                }
            } finally {
                setLoadingStats(false);
            }
        };
        fetchData();
    }, [user]);

    if (loading) return null;

    const displayName = user?.user_metadata?.nome ?? user?.email?.split("@")[0] ?? "Gestore";

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
            {/* Hero Header */}
            <div style={{
                padding: "1.75rem 2rem",
                borderRadius: "var(--tf-radius)",
                background: "linear-gradient(135deg, hsl(220 80% 45%), hsl(var(--tf-primary)))",
                color: "#fff",
                position: "relative", overflow: "hidden",
            }}>
                <div style={{ position: "absolute", top: -30, right: -30, width: 150, height: 150, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
                <div style={{ position: "absolute", bottom: -20, right: 60, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
                <h1 style={{ fontSize: "1.6rem", fontWeight: 900, marginBottom: "0.25rem" }}>
                    🏋️ Ciao, {displayName}!
                </h1>
                {struttura ? (
                    <>
                        <p style={{ opacity: 0.9, fontWeight: 700, fontSize: "1rem" }}>{struttura.denominazione}</p>
                        <p style={{ opacity: 0.7, fontSize: "0.85rem", marginTop: "0.2rem" }}>
                            📍 {struttura.indirizzo}
                        </p>
                        <div style={{ marginTop: "0.75rem" }}>
                            <span style={{
                                padding: "0.25rem 0.75rem", borderRadius: "999px",
                                background: struttura.stato === "Attiva" ? "rgba(0,255,100,0.2)" : "rgba(255,0,0,0.2)",
                                fontSize: "0.75rem", fontWeight: 700,
                                border: `1px solid ${struttura.stato === "Attiva" ? "rgba(0,255,100,0.4)" : "rgba(255,0,0,0.4)"}`,
                            }}>
                                {struttura.stato === "Attiva" ? "✓ Attiva" : "⏸ Sospesa"}
                            </span>
                        </div>
                    </>
                ) : (
                    <p style={{ opacity: 0.7, fontSize: "0.85rem", marginTop: "0.25rem" }}>
                        Dashboard Gestore Palestra · TrackFit
                    </p>
                )}
            </div>

            {/* Stats */}
            <div>
                <h2 style={{ fontSize: "0.85rem", fontWeight: 700, color: "hsl(var(--tf-text-muted))", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>
                    STATISTICHE OGGI
                </h2>
                {loadingStats ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem" }}>
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} style={{ height: 110, borderRadius: "var(--tf-radius)", background: "hsl(var(--tf-surface))", border: "1px solid hsl(var(--tf-border))", opacity: 0.5 }} />
                        ))}
                    </div>
                ) : !struttura ? (
                    <div style={{ padding: "1.5rem", borderRadius: "var(--tf-radius)", border: "2px dashed hsl(var(--tf-border))", textAlign: "center", color: "hsl(var(--tf-text-muted))" }}>
                        <p>Nessuna struttura associata al tuo account.</p>
                        <p style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>Contatta un amministratore per configurare la tua palestra.</p>
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem" }}>
                        <StatCard label="Abbonamenti Attivi" value={stats?.abbonamenti_attivi ?? 0} icon="💳" color="hsl(145 60% 45%)" />
                        <StatCard label="Corsi Settimana" value={stats?.corsi_settimana ?? 0} icon="📆" color="hsl(var(--tf-primary))" />
                        <StatCard label="Accessi Oggi" value={stats?.accessi_oggi ?? 0} icon="🚪" color="hsl(200 80% 55%)" />
                        <StatCard label="Incasso Mese" value={(stats?.incasso_mese ?? 0).toFixed(0)} icon="💶" color="hsl(45 90% 55%)" prefix="€" />
                    </div>
                )}
            </div>

            {/* Quick Links */}
            <div>
                <h2 style={{ fontSize: "0.85rem", fontWeight: 700, color: "hsl(var(--tf-text-muted))", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>
                    GESTIONE PALESTRA
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
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

            {/* Struttura detail */}
            {struttura && (
                <div style={{ padding: "1.25rem", borderRadius: "var(--tf-radius)", background: "hsl(var(--tf-surface))", border: "1px solid hsl(var(--tf-border))" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                        <h2 style={{ fontSize: "0.95rem", fontWeight: 700 }}>Dettagli struttura</h2>
                        <Link href="/gyms/struttura" style={{ fontSize: "0.78rem", color: "hsl(var(--tf-primary))", textDecoration: "none" }}>
                            ✏️ Modifica →
                        </Link>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.5rem" }}>
                        <div><p style={{ fontSize: "0.7rem", color: "hsl(var(--tf-text-muted))", fontWeight: 600 }}>P.IVA</p><p style={{ fontSize: "0.85rem", fontFamily: "monospace" }}>{struttura.piva}</p></div>
                        <div><p style={{ fontSize: "0.7rem", color: "hsl(var(--tf-text-muted))", fontWeight: 600 }}>CUN</p><p style={{ fontSize: "0.85rem", fontFamily: "monospace" }}>{struttura.cun}</p></div>
                        {struttura.telefono && <div><p style={{ fontSize: "0.7rem", color: "hsl(var(--tf-text-muted))", fontWeight: 600 }}>Telefono</p><p style={{ fontSize: "0.85rem" }}>{struttura.telefono}</p></div>}
                        {struttura.email && <div><p style={{ fontSize: "0.7rem", color: "hsl(var(--tf-text-muted))", fontWeight: 600 }}>Email</p><p style={{ fontSize: "0.85rem" }}>{struttura.email}</p></div>}
                    </div>
                </div>
            )}
        </div>
    );
}
