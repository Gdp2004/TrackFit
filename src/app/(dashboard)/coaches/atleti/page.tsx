// ============================================================
// /coaches/atleti – Roster Atleti del Coach
// Visibile solo ai COACH
// ============================================================
"use client";

import { useEffect, useState } from "react";
import { useRoleRedirect } from "@frontend/hooks/useRoleRedirect";
import { RuoloEnum } from "@backend/domain/model/enums";
import type { User } from "@backend/domain/model/types";

function AtletaCard({ atleta }: { atleta: User }) {
    const initials = `${atleta.nome[0]}${atleta.cognome[0]}`.toUpperCase();
    const colors = ["hsl(var(--tf-primary))", "hsl(var(--tf-accent))", "hsl(200 80% 55%)"];
    const color = colors[atleta.id.charCodeAt(0) % colors.length];

    return (
        <div style={{
            padding: "1.25rem",
            borderRadius: "var(--tf-radius)",
            background: "hsl(var(--tf-surface))",
            border: "1px solid hsl(var(--tf-border))",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            transition: "border-color 0.2s, transform 0.15s",
        }}
            onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "hsl(var(--tf-primary)/.4)";
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
            }}
            onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "hsl(var(--tf-border))";
                (e.currentTarget as HTMLDivElement).style.transform = "none";
            }}
        >
            {/* Avatar */}
            <div style={{
                width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
                background: color, display: "flex",
                alignItems: "center", justifyContent: "center",
                fontWeight: 800, fontSize: "1rem", color: "#fff",
            }}>
                {initials}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: "0.95rem" }}>{atleta.nome} {atleta.cognome}</p>
                <p style={{ fontSize: "0.78rem", color: "hsl(var(--tf-text-muted))", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {atleta.email}
                </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.25rem" }}>
                {atleta.peso && (
                    <span style={{ fontSize: "0.72rem", color: "hsl(var(--tf-text-muted))" }}>
                        ⚖️ {atleta.peso} kg
                    </span>
                )}
                {atleta.altezza && (
                    <span style={{ fontSize: "0.72rem", color: "hsl(var(--tf-text-muted))" }}>
                        📏 {atleta.altezza} cm
                    </span>
                )}
            </div>
        </div>
    );
}

export default function CoachAtletiPage() {
    const { user, loading } = useRoleRedirect(RuoloEnum.COACH);
    const [atleti, setAtleti] = useState<User[]>([]);
    const [loadingAtleti, setLoadingAtleti] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (!user) return;
        const fetchAtleti = async () => {
            try {
                // First get coach profile, then get atleti
                const meRes = await fetch("/api/coaches/me");
                if (!meRes.ok) return;
                const meData = await meRes.json();
                const coachId = meData.coach?.id;
                if (!coachId) return;

                const res = await fetch(`/api/coaches/${coachId}/atleti`);
                if (res.ok) {
                    const data = await res.json();
                    setAtleti(data ?? []);
                }
            } finally {
                setLoadingAtleti(false);
            }
        };
        fetchAtleti();
    }, [user]);

    if (loading) return null;

    const atletiFiltrati = search
        ? atleti.filter(a =>
            `${a.nome} ${a.cognome} ${a.email}`.toLowerCase().includes(search.toLowerCase())
        )
        : atleti;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                    <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.25rem" }}>
                        👥 I miei Atleti
                    </h1>
                    <p style={{ fontSize: "0.875rem", color: "hsl(var(--tf-text-muted))" }}>
                        {loadingAtleti ? "Caricamento…" : `${atleti.length} atleti nel tuo roster`}
                    </p>
                </div>
            </div>

            {/* Search */}
            <input
                type="text"
                placeholder="🔍 Cerca atleta per nome o email…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                    padding: "0.75rem 1rem",
                    borderRadius: "var(--tf-radius-sm)",
                    background: "hsl(var(--tf-surface))",
                    border: "1px solid hsl(var(--tf-border))",
                    color: "hsl(var(--tf-text))",
                    fontSize: "0.875rem",
                    outline: "none",
                    width: "100%",
                    maxWidth: 400,
                }}
            />

            {/* Lista */}
            {loadingAtleti ? (
                <div style={{ textAlign: "center", padding: "3rem", color: "hsl(var(--tf-text-muted))" }}>
                    <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⏳</div>
                    <p>Caricamento atleti…</p>
                </div>
            ) : atletiFiltrati.length === 0 ? (
                <div style={{
                    textAlign: "center", padding: "3rem",
                    borderRadius: "var(--tf-radius)",
                    border: "2px dashed hsl(var(--tf-border))",
                    color: "hsl(var(--tf-text-muted))",
                }}>
                    <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>👤</div>
                    <p style={{ fontWeight: 600 }}>
                        {search ? "Nessun atleta trovato" : "Nessun atleta nel roster"}
                    </p>
                    <p style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>
                        {search ? "Prova con un termine diverso" : "Gli atleti appariranno qui quando prenoteranno sessioni con te"}
                    </p>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "0.75rem" }}>
                    {atletiFiltrati.map(atleta => (
                        <AtletaCard key={atleta.id} atleta={atleta} />
                    ))}
                </div>
            )}
        </div>
    );
}
