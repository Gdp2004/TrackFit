// ============================================================
// /coaches/piani – Piani Allenamento (Sessioni del Coach)
// Visibile solo ai COACH
// ============================================================
"use client";

import { useEffect, useState } from "react";
import { useRoleRedirect } from "@frontend/hooks/useRoleRedirect";
import { RuoloEnum } from "@backend/domain/model/enums";
import type { Prenotazione } from "@backend/domain/model/types";

type StatoColor = Record<string, string>;
const STATO_COLOR: StatoColor = {
    CONFERMATA: "hsl(145 60% 45%)",
    IN_ATTESA: "hsl(45 90% 55%)",
    CANCELLATA: "hsl(var(--tf-danger))",
};

const STATO_BG: StatoColor = {
    CONFERMATA: "hsl(145 60% 45%/.12)",
    IN_ATTESA: "hsl(45 90% 55%/.12)",
    CANCELLATA: "hsl(var(--tf-danger)/.12)",
};

function SessioneCard({
    prenotazione,
    onModifica,
}: {
    prenotazione: Prenotazione;
    onModifica: (id: string) => void;
}) {
    const data = new Date(prenotazione.dataora);
    const ora48h = Date.now() + 48 * 60 * 60 * 1000;
    const modificabile = prenotazione.stato === "CONFERMATA" && data.getTime() > ora48h;

    return (
        <div style={{
            padding: "1.25rem",
            borderRadius: "var(--tf-radius)",
            background: "hsl(var(--tf-surface))",
            border: "1px solid hsl(var(--tf-border))",
        }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                        <span style={{
                            padding: "0.2rem 0.6rem",
                            borderRadius: "999px",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            background: STATO_BG[prenotazione.stato] ?? "hsl(var(--tf-border)/.2)",
                            color: STATO_COLOR[prenotazione.stato] ?? "hsl(var(--tf-text-muted))",
                        }}>
                            {prenotazione.stato}
                        </span>
                    </div>
                    <p style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.25rem" }}>
                        📅 {data.toLocaleDateString("it-IT", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
                    </p>
                    <p style={{ fontSize: "0.825rem", color: "hsl(var(--tf-text-muted))" }}>
                        🕐 {data.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
                        {prenotazione.importototale > 0 && ` · 💶 €${prenotazione.importototale.toFixed(2)}`}
                    </p>
                </div>
                {modificabile && (
                    <button
                        onClick={() => onModifica(prenotazione.id)}
                        style={{
                            padding: "0.5rem 1rem",
                            borderRadius: "var(--tf-radius-sm)",
                            border: "1px solid hsl(var(--tf-primary)/.3)",
                            background: "hsl(var(--tf-primary)/.1)",
                            color: "hsl(var(--tf-primary))",
                            cursor: "pointer",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            flexShrink: 0,
                        }}
                    >
                        ✏️ Modifica
                    </button>
                )}
            </div>
        </div>
    );
}

function ModificaModal({
    sessioneId,
    onClose,
    onSuccess,
}: {
    sessioneId: string;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [nuovadataora, setNuovadataora] = useState("");
    const [motivazione, setMotivazione] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const meRes = await fetch("/api/coaches/me");
            const meData = await meRes.json();
            const coachId = meData.coach?.id;
            if (!coachId) throw new Error("Coach non trovato");

            const res = await fetch(`/api/coaches/${coachId}/prenotazioni`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessioneid: sessioneId, nuovadataora, motivazione }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Errore");
            onSuccess();
        } catch (err) {
            setError(String(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 100,
        }}>
            <div style={{
                background: "hsl(var(--tf-surface))",
                border: "1px solid hsl(var(--tf-border))",
                borderRadius: "var(--tf-radius)",
                padding: "2rem",
                width: "100%",
                maxWidth: 440,
            }}>
                <h2 style={{ fontWeight: 800, fontSize: "1.25rem", marginBottom: "1.25rem" }}>
                    ✏️ Modifica Sessione
                </h2>
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div>
                        <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "hsl(var(--tf-text-muted))", display: "block", marginBottom: "0.4rem" }}>
                            Nuova data e ora
                        </label>
                        <input
                            type="datetime-local"
                            value={nuovadataora}
                            onChange={e => setNuovadataora(e.target.value)}
                            required
                            style={{
                                width: "100%", padding: "0.65rem 0.85rem",
                                borderRadius: "var(--tf-radius-sm)",
                                border: "1px solid hsl(var(--tf-border))",
                                background: "hsl(var(--tf-bg))",
                                color: "hsl(var(--tf-text))",
                                fontSize: "0.875rem",
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "hsl(var(--tf-text-muted))", display: "block", marginBottom: "0.4rem" }}>
                            Motivazione *
                        </label>
                        <textarea
                            value={motivazione}
                            onChange={e => setMotivazione(e.target.value)}
                            required
                            placeholder="Es. Conflitto di orario imprevisto"
                            rows={3}
                            style={{
                                width: "100%", padding: "0.65rem 0.85rem",
                                borderRadius: "var(--tf-radius-sm)",
                                border: "1px solid hsl(var(--tf-border))",
                                background: "hsl(var(--tf-bg))",
                                color: "hsl(var(--tf-text))",
                                fontSize: "0.875rem", resize: "vertical",
                            }}
                        />
                    </div>
                    {error && (
                        <p style={{ padding: "0.6rem", borderRadius: "6px", background: "hsl(var(--tf-danger)/.1)", color: "hsl(var(--tf-danger))", fontSize: "0.8rem" }}>
                            ⚠️ {error}
                        </p>
                    )}
                    <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                        <button type="button" onClick={onClose} style={{
                            padding: "0.6rem 1.25rem", borderRadius: "var(--tf-radius-sm)",
                            border: "1px solid hsl(var(--tf-border))",
                            background: "transparent", color: "hsl(var(--tf-text))",
                            cursor: "pointer", fontSize: "0.875rem",
                        }}>
                            Annulla
                        </button>
                        <button type="submit" disabled={loading} style={{
                            padding: "0.6rem 1.5rem", borderRadius: "var(--tf-radius-sm)",
                            border: "none",
                            background: "linear-gradient(135deg, hsl(var(--tf-primary)), hsl(var(--tf-accent)))",
                            color: "#fff", cursor: loading ? "not-allowed" : "pointer",
                            fontSize: "0.875rem", fontWeight: 700, opacity: loading ? 0.7 : 1,
                        }}>
                            {loading ? "Salvando…" : "Salva"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function PianiPage() {
    const { user, loading } = useRoleRedirect(RuoloEnum.COACH);
    const [prenotazioni, setPrenotazioni] = useState<Prenotazione[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [modaleOpen, setModaleOpen] = useState<string | null>(null);
    const [filtro, setFiltro] = useState<"tutte" | "future" | "passate">("tutte");

    const fetchData = async () => {
        try {
            const meRes = await fetch("/api/coaches/me");
            if (!meRes.ok) return;
            const meData = await meRes.json();
            const coachId = meData.coach?.id;
            if (!coachId) return;

            const res = await fetch(`/api/coaches/${coachId}/prenotazioni`);
            if (res.ok) {
                const data = await res.json();
                setPrenotazioni(data ?? []);
            }
        } finally {
            setLoadingData(false);
        }
    };

    useEffect(() => {
        if (!user) return;
        fetchData();
    }, [user]);

    if (loading) return null;

    const now = new Date();
    const filtrate = prenotazioni.filter(p => {
        const d = new Date(p.dataora);
        if (filtro === "future") return d > now;
        if (filtro === "passate") return d <= now;
        return true;
    });

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                    <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.25rem" }}>
                        📋 Piani Allenamento
                    </h1>
                    <p style={{ fontSize: "0.875rem", color: "hsl(var(--tf-text-muted))" }}>
                        Le sessioni prenotate con i tuoi atleti
                    </p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                    {(["tutte", "future", "passate"] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFiltro(f)}
                            style={{
                                padding: "0.4rem 0.9rem",
                                borderRadius: "999px",
                                border: "1px solid hsl(var(--tf-border))",
                                background: filtro === f ? "hsl(var(--tf-primary))" : "hsl(var(--tf-surface))",
                                color: filtro === f ? "#fff" : "hsl(var(--tf-text))",
                                cursor: "pointer",
                                fontSize: "0.8rem",
                                fontWeight: filtro === f ? 700 : 400,
                            }}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {loadingData ? (
                <div style={{ textAlign: "center", padding: "3rem", color: "hsl(var(--tf-text-muted))" }}>
                    <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⏳</div>
                    <p>Caricamento sessioni…</p>
                </div>
            ) : filtrate.length === 0 ? (
                <div style={{
                    textAlign: "center", padding: "3rem",
                    border: "2px dashed hsl(var(--tf-border))",
                    borderRadius: "var(--tf-radius)",
                    color: "hsl(var(--tf-text-muted))",
                }}>
                    <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📅</div>
                    <p style={{ fontWeight: 600 }}>Nessuna sessione {filtro !== "tutte" ? filtro : ""}</p>
                    <p style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>
                        Le sessioni prenotate dagli atleti appariranno qui
                    </p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {filtrate.map(p => (
                        <SessioneCard
                            key={p.id}
                            prenotazione={p}
                            onModifica={(id) => setModaleOpen(id)}
                        />
                    ))}
                </div>
            )}

            {modaleOpen && (
                <ModificaModal
                    sessioneId={modaleOpen}
                    onClose={() => setModaleOpen(null)}
                    onSuccess={() => {
                        setModaleOpen(null);
                        setLoadingData(true);
                        fetchData();
                    }}
                />
            )}
        </div>
    );
}
