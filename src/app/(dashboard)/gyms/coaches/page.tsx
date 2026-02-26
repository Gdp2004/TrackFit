// ============================================================
// /gyms/coaches – Lista Coach della struttura + Onboarding
// Visibile solo ai GESTORE
// ============================================================
"use client";

import { useEffect, useState } from "react";
import { useRoleRedirect } from "@frontend/hooks/useRoleRedirect";
import { RuoloEnum } from "@backend/domain/model/enums";
import type { Coach } from "@backend/domain/model/types";

function StarRating({ rating }: { rating?: number }) {
    if (!rating) return null;
    return (
        <div style={{ display: "flex", gap: 2 }}>
            {[1, 2, 3, 4, 5].map((s) => (
                <span key={s} style={{ fontSize: "0.72rem", color: s <= Math.round(rating) ? "#f59e0b" : "hsl(var(--tf-border))" }}>★</span>
            ))}
            <span style={{ fontSize: "0.72rem", color: "hsl(var(--tf-text-muted))", marginLeft: 4 }}>{rating.toFixed(1)}</span>
        </div>
    );
}

function CoachCard({ coach }: { coach: Coach }) {
    return (
        <div style={{
            padding: "1.25rem",
            borderRadius: "var(--tf-radius)",
            background: "hsl(var(--tf-surface))",
            border: "1px solid hsl(var(--tf-border))",
            display: "flex", flexDirection: "column", gap: "0.75rem",
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{
                    width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                    background: "linear-gradient(135deg, hsl(145 60% 45%), hsl(var(--tf-primary)))",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 800, fontSize: "0.9rem", color: "#fff",
                }}>
                    💪
                </div>
                <div>
                    <p style={{ fontWeight: 700, fontSize: "0.925rem" }}>{coach.specializzazione ?? "Coach"}</p>
                    <p style={{ fontSize: "0.75rem", color: "hsl(var(--tf-text-muted))", fontFamily: "monospace" }}>
                        ID: {coach.id.slice(0, 8)}…
                    </p>
                </div>
            </div>
            <StarRating rating={coach.rating} />
            {coach.bio && (
                <p style={{ fontSize: "0.78rem", color: "hsl(var(--tf-text-muted))", lineHeight: 1.5 }}>{coach.bio}</p>
            )}
        </div>
    );
}

function OnboardModal({ strutturaid, onClose, onSuccess }: {
    strutturaid: string;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const res = await fetch("/api/gyms?action=onboard-coach", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ strutturaid, emailCoach: email }),
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
                padding: "2rem", width: "100%", maxWidth: 400,
            }}>
                <h2 style={{ fontWeight: 800, fontSize: "1.2rem", marginBottom: "1.25rem" }}>
                    + Aggiungi Coach
                </h2>
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div>
                        <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "hsl(var(--tf-text-muted))", display: "block", marginBottom: "0.4rem" }}>
                            Email del nuovo Coach
                        </label>
                        <input
                            type="email" required value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="coach@email.it"
                            style={{
                                width: "100%", padding: "0.65rem 0.85rem",
                                borderRadius: "var(--tf-radius-sm)",
                                border: "1px solid hsl(var(--tf-border))",
                                background: "hsl(var(--tf-bg))",
                                color: "hsl(var(--tf-text))", fontSize: "0.875rem",
                            }}
                        />
                    </div>
                    <p style={{ fontSize: "0.76rem", color: "hsl(var(--tf-text-muted))" }}>
                        ℹ️ Verrà creato un account e inviata una email con le credenziali temporanee.
                    </p>
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
                            background: "linear-gradient(135deg, hsl(145 60% 45%), hsl(var(--tf-primary)))",
                            color: "#fff", cursor: loading ? "not-allowed" : "pointer",
                            fontSize: "0.875rem", fontWeight: 700, opacity: loading ? 0.7 : 1,
                        }}>
                            {loading ? "Invio…" : "Invita Coach"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function GymCoachesPage() {
    const { loading } = useRoleRedirect(RuoloEnum.GESTORE);
    const [coaches, setCoaches] = useState<Coach[]>([]);
    const [strutturaid, setStrutturaid] = useState<string | null>(null);
    const [loadingData, setLoadingData] = useState(true);
    const [onboardOpen, setOnboardOpen] = useState(false);

    const fetchData = async () => {
        try {
            const meRes = await fetch("/api/gyms/me");
            if (!meRes.ok) return;
            const meData = await meRes.json();
            const sid = meData.struttura?.id;
            if (!sid) return;
            setStrutturaid(sid);

            const res = await fetch(`/api/gyms/${sid}/coaches`);
            if (res.ok) {
                const data = await res.json();
                setCoaches(data ?? []);
            }
        } finally {
            setLoadingData(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) return null;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                    <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.25rem" }}>
                        💪 I miei Coach
                    </h1>
                    <p style={{ fontSize: "0.875rem", color: "hsl(var(--tf-text-muted))" }}>
                        {loadingData ? "Caricamento…" : `${coaches.length} coach nella struttura`}
                    </p>
                </div>
                {strutturaid && (
                    <button
                        onClick={() => setOnboardOpen(true)}
                        style={{
                            padding: "0.65rem 1.5rem",
                            borderRadius: "var(--tf-radius-sm)",
                            border: "none",
                            background: "linear-gradient(135deg, hsl(145 60% 45%), hsl(var(--tf-primary)))",
                            color: "#fff", cursor: "pointer",
                            fontSize: "0.875rem", fontWeight: 700,
                        }}
                    >
                        + Aggiungi Coach
                    </button>
                )}
            </div>

            {loadingData ? (
                <div style={{ textAlign: "center", padding: "3rem", color: "hsl(var(--tf-text-muted))" }}>
                    <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⏳</div>
                    <p>Caricamento coach…</p>
                </div>
            ) : coaches.length === 0 ? (
                <div style={{
                    textAlign: "center", padding: "3rem",
                    border: "2px dashed hsl(var(--tf-border))",
                    borderRadius: "var(--tf-radius)",
                    color: "hsl(var(--tf-text-muted))",
                }}>
                    <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>💪</div>
                    <p style={{ fontWeight: 600 }}>Nessun coach ancora</p>
                    <p style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>
                        Usa il pulsante "Aggiungi Coach" per invitare un coach nella struttura
                    </p>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
                    {coaches.map(coach => (
                        <CoachCard key={coach.id} coach={coach} />
                    ))}
                </div>
            )}

            {onboardOpen && strutturaid && (
                <OnboardModal
                    strutturaid={strutturaid}
                    onClose={() => setOnboardOpen(false)}
                    onSuccess={() => {
                        setOnboardOpen(false);
                        setLoadingData(true);
                        fetchData();
                    }}
                />
            )}
        </div>
    );
}
