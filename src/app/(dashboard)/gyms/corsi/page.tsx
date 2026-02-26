// ============================================================
// /gyms/corsi – Gestione Corsi della struttura
// Visibile solo ai GESTORE
// ============================================================
"use client";

import { useEffect, useState } from "react";
import { useRoleRedirect } from "@frontend/hooks/useRoleRedirect";
import { RuoloEnum } from "@backend/domain/model/enums";
import type { Corso } from "@backend/domain/model/types";

function CorsoForm({
    strutturaid,
    corso,
    onClose,
    onSuccess,
}: {
    strutturaid: string;
    corso?: Corso;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const isEdit = !!corso;
    const [form, setForm] = useState({
        nome: corso?.nome ?? "",
        dataora: corso ? corso.dataora.slice(0, 16) : "",
        capacitamassima: corso?.capacitamassima ?? 20,
        durata: corso?.durata ?? 60,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const body = {
                ...form,
                strutturaid,
                dataora: new Date(form.dataora).toISOString(),
                capacitamassima: Number(form.capacitamassima),
                durata: Number(form.durata),
            };

            const url = "/api/gyms?action=corso";
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
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

    const inputStyle = {
        width: "100%", padding: "0.65rem 0.85rem",
        borderRadius: "var(--tf-radius-sm)",
        border: "1px solid hsl(var(--tf-border))",
        background: "hsl(var(--tf-bg))",
        color: "hsl(var(--tf-text))", fontSize: "0.875rem",
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
                padding: "2rem", width: "100%", maxWidth: 480,
            }}>
                <h2 style={{ fontWeight: 800, fontSize: "1.2rem", marginBottom: "1.25rem" }}>
                    {isEdit ? "✏️ Modifica Corso" : "➕ Nuovo Corso"}
                </h2>
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div>
                        <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "hsl(var(--tf-text-muted))", display: "block", marginBottom: "0.4rem" }}>
                            Nome Corso *
                        </label>
                        <input style={inputStyle} type="text" required value={form.nome}
                            onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
                    </div>
                    <div>
                        <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "hsl(var(--tf-text-muted))", display: "block", marginBottom: "0.4rem" }}>
                            Data e Ora *
                        </label>
                        <input style={inputStyle} type="datetime-local" required value={form.dataora}
                            onChange={e => setForm(f => ({ ...f, dataora: e.target.value }))} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        <div>
                            <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "hsl(var(--tf-text-muted))", display: "block", marginBottom: "0.4rem" }}>
                                Posti Massimi *
                            </label>
                            <input style={inputStyle} type="number" min={1} required value={form.capacitamassima}
                                onChange={e => setForm(f => ({ ...f, capacitamassima: parseInt(e.target.value) }))} />
                        </div>
                        <div>
                            <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "hsl(var(--tf-text-muted))", display: "block", marginBottom: "0.4rem" }}>
                                Durata (minuti) *
                            </label>
                            <input style={inputStyle} type="number" min={10} required value={form.durata}
                                onChange={e => setForm(f => ({ ...f, durata: parseInt(e.target.value) }))} />
                        </div>
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
                            background: "linear-gradient(135deg, hsl(145 60% 45%), hsl(var(--tf-primary)))",
                            color: "#fff", cursor: loading ? "not-allowed" : "pointer",
                            fontSize: "0.875rem", fontWeight: 700, opacity: loading ? 0.7 : 1,
                        }}>
                            {loading ? "Salvando…" : isEdit ? "Salva" : "Crea Corso"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function GymCorsiPage() {
    const { loading } = useRoleRedirect(RuoloEnum.GESTORE);
    const [corsi, setCorsi] = useState<Corso[]>([]);
    const [strutturaid, setStrutturaid] = useState<string | null>(null);
    const [loadingData, setLoadingData] = useState(true);
    const [formOpen, setFormOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            const meRes = await fetch("/api/gyms/me");
            if (!meRes.ok) return;
            const meData = await meRes.json();
            const sid = meData.struttura?.id;
            if (!sid) return;
            setStrutturaid(sid);
            const res = await fetch(`/api/gyms?strutturaid=${sid}`);
            if (res.ok) setCorsi(await res.json() ?? []);
        } finally {
            setLoadingData(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleDelete = async (corsoid: string) => {
        if (!confirm("Eliminare questo corso? Tutti gli iscritti saranno notificati.")) return;
        setDeletingId(corsoid);
        try {
            await fetch(`/api/gyms?corsoid=${corsoid}`, { method: "DELETE" });
            fetchData();
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) return null;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                    <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.25rem" }}>📆 Gestione Corsi</h1>
                    <p style={{ fontSize: "0.875rem", color: "hsl(var(--tf-text-muted))" }}>
                        {loadingData ? "Caricamento…" : `${corsi.length} corsi programmati`}
                    </p>
                </div>
                {strutturaid && (
                    <button onClick={() => setFormOpen(true)} style={{
                        padding: "0.65rem 1.5rem", borderRadius: "var(--tf-radius-sm)",
                        border: "none",
                        background: "linear-gradient(135deg, hsl(145 60% 45%), hsl(var(--tf-primary)))",
                        color: "#fff", cursor: "pointer",
                        fontSize: "0.875rem", fontWeight: 700,
                    }}>
                        + Nuovo Corso
                    </button>
                )}
            </div>

            {loadingData ? (
                <div style={{ textAlign: "center", padding: "3rem", color: "hsl(var(--tf-text-muted))" }}>
                    <div style={{ fontSize: "2rem" }}>⏳</div><p>Caricamento…</p>
                </div>
            ) : corsi.length === 0 ? (
                <div style={{
                    textAlign: "center", padding: "3rem",
                    border: "2px dashed hsl(var(--tf-border))",
                    borderRadius: "var(--tf-radius)", color: "hsl(var(--tf-text-muted))",
                }}>
                    <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📆</div>
                    <p style={{ fontWeight: 600 }}>Nessun corso programmato</p>
                    <p style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>Crea il primo corso per la struttura</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {corsi.map(corso => {
                        const data = new Date(corso.dataora);
                        const isFuturo = data > new Date();
                        const percOccupazione = corso.capacitamassima > 0
                            ? Math.round((corso.postioccupati / corso.capacitamassima) * 100)
                            : 0;
                        return (
                            <div key={corso.id} style={{
                                padding: "1.25rem",
                                borderRadius: "var(--tf-radius)",
                                background: "hsl(var(--tf-surface))",
                                border: "1px solid hsl(var(--tf-border))",
                                display: "flex", alignItems: "center", gap: "1rem",
                            }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                                        <p style={{ fontWeight: 700 }}>{corso.nome}</p>
                                        <span style={{
                                            padding: "0.15rem 0.5rem", borderRadius: "999px", fontSize: "0.7rem",
                                            background: isFuturo ? "hsl(145 60% 45%/.15)" : "hsl(var(--tf-text-muted)/.15)",
                                            color: isFuturo ? "hsl(145 60% 45%)" : "hsl(var(--tf-text-muted))",
                                            fontWeight: 600,
                                        }}>
                                            {isFuturo ? "In programma" : "Passato"}
                                        </span>
                                    </div>
                                    <p style={{ fontSize: "0.8rem", color: "hsl(var(--tf-text-muted))" }}>
                                        📅 {data.toLocaleDateString("it-IT", { day: "2-digit", month: "long" })} · 🕐 {data.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })} · ⏱️ {corso.durata} min
                                    </p>
                                    <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                        <div style={{ flex: 1, height: 6, borderRadius: 999, background: "hsl(var(--tf-border))", overflow: "hidden" }}>
                                            <div style={{
                                                height: "100%",
                                                width: `${percOccupazione}%`,
                                                background: percOccupazione >= 90 ? "hsl(var(--tf-danger))" : percOccupazione >= 60 ? "hsl(45 90% 55%)" : "hsl(145 60% 45%)",
                                                borderRadius: 999, transition: "width 0.3s",
                                            }} />
                                        </div>
                                        <span style={{ fontSize: "0.72rem", color: "hsl(var(--tf-text-muted))", whiteSpace: "nowrap" }}>
                                            {corso.postioccupati}/{corso.capacitamassima} posti
                                        </span>
                                    </div>
                                </div>
                                {isFuturo && (
                                    <button
                                        onClick={() => handleDelete(corso.id)}
                                        disabled={deletingId === corso.id}
                                        style={{
                                            padding: "0.45rem 0.9rem",
                                            borderRadius: "var(--tf-radius-sm)",
                                            border: "1px solid hsl(var(--tf-danger)/.3)",
                                            background: "hsl(var(--tf-danger)/.1)",
                                            color: "hsl(var(--tf-danger))",
                                            cursor: "pointer", fontSize: "0.78rem", fontWeight: 600,
                                            opacity: deletingId === corso.id ? 0.5 : 1,
                                        }}
                                    >
                                        🗑️ Elimina
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {formOpen && strutturaid && (
                <CorsoForm
                    strutturaid={strutturaid}
                    onClose={() => setFormOpen(false)}
                    onSuccess={() => { setFormOpen(false); setLoadingData(true); fetchData(); }}
                />
            )}
        </div>
    );
}
