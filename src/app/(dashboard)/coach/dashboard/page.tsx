// ============================================================
// Dashboard Coach – /coach/dashboard
// Visibile solo agli utenti con ruolo COACH
// ============================================================
"use client";

import { useRoleRedirect } from "@frontend/hooks/useRoleRedirect";
import { RuoloEnum } from "@backend/domain/model/enums";

const STAT_CARDS = [
    { icon: "👥", label: "Atleti Seguiti", value: "—", color: "hsl(var(--tf-primary))" },
    { icon: "📅", label: "Sessioni Oggi", value: "—", color: "hsl(var(--tf-accent))" },
    { icon: "📊", label: "Report Mese", value: "—", color: "hsl(200 80% 60%)" },
    { icon: "⭐", label: "Rating Medio", value: "—", color: "hsl(45 90% 55%)" },
];

const QUICK_LINKS = [
    { icon: "👥", label: "Gestisci Atleti", href: "/coaches/atleti", desc: "Visualizza e gestisci il tuo roster" },
    { icon: "🗓️", label: "Slot Disponibilità", href: "/coaches/disponibilita", desc: "Configura i tuoi orari" },
    { icon: "📋", label: "Piani Allenamento", href: "/coaches/piani", desc: "Crea e modifica piani" },
    { icon: "📈", label: "I miei Report", href: "/reports", desc: "Visualizza statistiche" },
];

export default function CoachDashboardPage() {
    const { user, ruolo, loading } = useRoleRedirect(RuoloEnum.COACH);

    if (loading || !user) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
                <div style={{ textAlign: "center", color: "hsl(var(--tf-text-muted))" }}>
                    <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⏳</div>
                    <p>Caricamento...</p>
                </div>
            </div>
        );
    }

    const nome = user.user_metadata?.nome as string | undefined;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {/* Header */}
            <div style={{
                padding: "2rem",
                borderRadius: "var(--tf-radius)",
                background: "linear-gradient(135deg, hsl(var(--tf-primary)/.15), hsl(var(--tf-accent)/.08))",
                border: "1px solid hsl(var(--tf-primary)/.2)",
                position: "relative",
                overflow: "hidden",
                minHeight: 120,
            }}>
                {/* Hero image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="/images/coach/dashboard-hero.png"
                    alt=""
                    aria-hidden="true"
                    style={{
                        position: "absolute", inset: 0,
                        width: "100%", height: "100%",
                        objectFit: "cover", objectPosition: "center",
                        opacity: 0.18, borderRadius: "var(--tf-radius)",
                    }}
                />

                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{
                        width: 56, height: 56, borderRadius: "14px",
                        background: "linear-gradient(135deg, hsl(var(--tf-primary)), hsl(var(--tf-accent)))",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "1.5rem", flexShrink: 0,
                    }}>🎯</div>
                    <div>
                        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.25rem" }}>
                            Ciao, {nome ?? "Coach"} 👋
                        </h1>
                        <p style={{ color: "hsl(var(--tf-text-muted))", fontSize: "0.875rem" }}>
                            Pannello Coach · {ruolo}
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
                {STAT_CARDS.map(({ icon, label, value, color }) => (
                    <div key={label} style={{
                        padding: "1.5rem",
                        borderRadius: "var(--tf-radius)",
                        background: "hsl(var(--tf-surface))",
                        border: "1px solid hsl(var(--tf-border))",
                        display: "flex", flexDirection: "column", gap: "0.5rem",
                    }}>
                        <div style={{ fontSize: "1.5rem" }}>{icon}</div>
                        <div style={{ fontSize: "1.75rem", fontWeight: 800, color }}>{value}</div>
                        <div style={{ fontSize: "0.8rem", color: "hsl(var(--tf-text-muted))", fontWeight: 500 }}>{label}</div>
                    </div>
                ))}
            </div>

            {/* Quick Links */}
            <div>
                <h2 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "1rem" }}>Accesso Rapido</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
                    {QUICK_LINKS.map(({ icon, label, href, desc }) => (
                        <a key={label} href={href} style={{
                            padding: "1.25rem",
                            borderRadius: "var(--tf-radius-sm)",
                            background: "hsl(var(--tf-surface))",
                            border: "1px solid hsl(var(--tf-border))",
                            textDecoration: "none", color: "inherit",
                            display: "flex", alignItems: "flex-start", gap: "0.75rem",
                            transition: "border-color 0.2s, transform 0.15s",
                        }}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLAnchorElement).style.borderColor = "hsl(var(--tf-primary)/.5)";
                                (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)";
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLAnchorElement).style.borderColor = "hsl(var(--tf-border))";
                                (e.currentTarget as HTMLAnchorElement).style.transform = "none";
                            }}
                        >
                            <span style={{ fontSize: "1.25rem", flexShrink: 0 }}>{icon}</span>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: "0.25rem" }}>{label}</div>
                                <div style={{ fontSize: "0.75rem", color: "hsl(var(--tf-text-muted))" }}>{desc}</div>
                            </div>
                        </a>
                    ))}
                </div>
            </div>

            {/* Info banner */}
            <div style={{
                padding: "1.25rem",
                borderRadius: "var(--tf-radius-sm)",
                background: "hsl(var(--tf-primary)/.08)",
                border: "1px solid hsl(var(--tf-primary)/.2)",
                display: "flex", alignItems: "center", gap: "0.75rem",
                fontSize: "0.875rem", color: "hsl(var(--tf-text-muted))",
            }}>
                <span style={{ fontSize: "1.25rem" }}>ℹ️</span>
                Le statistiche in tempo reale vengono aggiornate ogni 24 ore. I dati storici sono disponibili nella sezione Report.
            </div>
        </div>
    );
}
