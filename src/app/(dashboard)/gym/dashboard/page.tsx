// ============================================================
// Dashboard Gestore Palestra – /gym/dashboard
// Visibile solo agli utenti con ruolo GESTORE
// ============================================================
"use client";

import { useRoleRedirect } from "@frontend/hooks/useRoleRedirect";
import { RuoloEnum } from "@backend/domain/model/enums";

const STAT_CARDS = [
    { icon: "💳", label: "Abbonamenti Attivi", value: "—", color: "hsl(var(--tf-primary))" },
    { icon: "🏃", label: "Accessi Oggi", value: "—", color: "hsl(var(--tf-accent))" },
    { icon: "📆", label: "Corsi Settimana", value: "—", color: "hsl(200 80% 60%)" },
    { icon: "💰", label: "Incasso Mese", value: "—", color: "hsl(145 60% 50%)" },
];

const QUICK_LINKS = [
    { icon: "🏋️", label: "Gestisci Struttura", href: "/gyms/struttura", desc: "Modifica dati e orari palestra" },
    { icon: "💳", label: "Abbonamenti", href: "/subscription", desc: "Gestisci piani e iscritti" },
    { icon: "🎟️", label: "Coupon Promo", href: "/gyms/coupon", desc: "Crea codici sconto" },
    { icon: "📈", label: "Report Palestra", href: "/reports", desc: "Analisi presenze e incassi" },
];

export default function GymDashboardPage() {
    const { user, ruolo, loading } = useRoleRedirect(RuoloEnum.GESTORE);

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
                background: "linear-gradient(135deg, hsl(145 60% 40%/.15), hsl(var(--tf-primary)/.08))",
                border: "1px solid hsl(145 60% 40%/.25)",
                position: "relative",
                overflow: "hidden",
                minHeight: 120,
            }}>
                {/* Hero image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="/images/gym/dashboard-hero.png"
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
                        background: "linear-gradient(135deg, hsl(145 60% 45%), hsl(var(--tf-primary)))",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "1.5rem", flexShrink: 0,
                    }}>🏋️</div>
                    <div>
                        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.25rem" }}>
                            Ciao, {nome ?? "Gestore"} 👋
                        </h1>
                        <p style={{ color: "hsl(var(--tf-text-muted))", fontSize: "0.875rem" }}>
                            Pannello Gestore Palestra · {ruolo}
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
                <h2 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "1rem" }}>Gestione Palestra</h2>
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
                                (e.currentTarget as HTMLAnchorElement).style.borderColor = "hsl(145 60% 45%/.5)";
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

            {/* Alert struttura non configurata */}
            <div style={{
                padding: "1.25rem",
                borderRadius: "var(--tf-radius-sm)",
                background: "hsl(45 90% 55%/.1)",
                border: "1px solid hsl(45 90% 55%/.3)",
                display: "flex", alignItems: "center", gap: "0.75rem",
                fontSize: "0.875rem",
            }}>
                <span style={{ fontSize: "1.25rem" }}>⚡</span>
                <div>
                    <span style={{ fontWeight: 600, marginRight: "0.5rem" }}>Prima configurazione:</span>
                    <span style={{ color: "hsl(var(--tf-text-muted))" }}>
                        Configura i dati della tua struttura per abilitare la gestione degli abbonamenti.
                    </span>
                    <a href="/gyms/struttura" style={{ marginLeft: "0.5rem", color: "hsl(var(--tf-primary))", fontWeight: 600 }}>
                        Configura ora →
                    </a>
                </div>
            </div>
        </div>
    );
}
