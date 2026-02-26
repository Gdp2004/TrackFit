// ============================================================
// /gyms/abbonamenti – Gestione Tipi Abbonamento della struttura
// Visibile solo ai GESTORE
// ============================================================
"use client";

import { useEffect, useState } from "react";
import { useRoleRedirect } from "@frontend/hooks/useRoleRedirect";
import { RuoloEnum } from "@backend/domain/model/enums";
import type { TipoAbbonamento } from "@backend/domain/model/types";

function TipoForm({
    strutturaid,
    onClose,
    onSuccess,
}: {
    strutturaid: string;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [form, setForm] = useState({
        nome: "",
        duratamesi: 1,
        prezzo: 0,
        rinnovabile: true,
        descrizione: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const res = await fetch("/api/gyms/tipi-abbonamento", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...form, strutturaid, prezzo: Number(form.prezzo), duratamesi: Number(form.duratamesi) }),
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
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
            <div style={{ background: "hsl(var(--tf-surface))", border: "1px solid hsl(var(--tf-border))", borderRadius: "var(--tf-radius)", padding: "2rem", width: "100%", maxWidth: 460 }}>
                <h2 style={{ fontWeight: 800, fontSize: "1.2rem", marginBottom: "1.25rem" }}>+ Nuovo Piano Abbonamento</h2>
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div>
                        <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "hsl(var(--tf-text-muted))", display: "block", marginBottom: "0.4rem" }}>Nome Piano *</label>
                        <input style={inputStyle} type="text" required placeholder="es. Piano Mensile, Annuale..." value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        <div>
                            <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "hsl(var(--tf-text-muted))", display: "block", marginBottom: "0.4rem" }}>Durata (mesi) *</label>
                            <input style={inputStyle} type="number" min={1} required value={form.duratamesi} onChange={e => setForm(f => ({ ...f, duratamesi: parseInt(e.target.value) }))} />
                        </div>
                        <div>
                            <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "hsl(var(--tf-text-muted))", display: "block", marginBottom: "0.4rem" }}>Prezzo (€) *</label>
                            <input style={inputStyle} type="number" min={0} step={0.01} required value={form.prezzo} onChange={e => setForm(f => ({ ...f, prezzo: parseFloat(e.target.value) }))} />
                        </div>
                    </div>
                    <div>
                        <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "hsl(var(--tf-text-muted))", display: "block", marginBottom: "0.4rem" }}>Descrizione</label>
                        <textarea style={{ ...inputStyle, resize: "vertical" as const }} rows={2} value={form.descrizione} onChange={e => setForm(f => ({ ...f, descrizione: e.target.value }))} />
                    </div>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.875rem" }}>
                        <input type="checkbox" checked={form.rinnovabile} onChange={e => setForm(f => ({ ...f, rinnovabile: e.target.checked }))} />
                        Rinnovo automatico disponibile
                    </label>
                    {error && <p style={{ padding: "0.6rem", borderRadius: "6px", background: "hsl(var(--tf-danger)/.1)", color: "hsl(var(--tf-danger))", fontSize: "0.8rem" }}>⚠️ {error}</p>}
                    <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                        <button type="button" onClick={onClose} style={{ padding: "0.6rem 1.25rem", borderRadius: "var(--tf-radius-sm)", border: "1px solid hsl(var(--tf-border))", background: "transparent", color: "hsl(var(--tf-text))", cursor: "pointer", fontSize: "0.875rem" }}>Annulla</button>
                        <button type="submit" disabled={loading} style={{ padding: "0.6rem 1.5rem", borderRadius: "var(--tf-radius-sm)", border: "none", background: "linear-gradient(135deg, hsl(145 60% 45%), hsl(var(--tf-primary)))", color: "#fff", cursor: loading ? "not-allowed" : "pointer", fontSize: "0.875rem", fontWeight: 700, opacity: loading ? 0.7 : 1 }}>
                            {loading ? "Salvataggio…" : "Crea Piano"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function AbbonamentiPage() {
    const { loading } = useRoleRedirect(RuoloEnum.GESTORE);
    const [tipi, setTipi] = useState<TipoAbbonamento[]>([]);
    const [strutturaid, setStrutturaid] = useState<string | null>(null);
    const [loadingData, setLoadingData] = useState(true);
    const [formOpen, setFormOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            const meRes = await fetch("/api/gyms/me");
            if (!meRes.ok) return;
            const { struttura } = await meRes.json();
            if (!struttura?.id) return;
            setStrutturaid(struttura.id);
            const res = await fetch(`/api/gyms/tipi-abbonamento?strutturaid=${struttura.id}`);
            if (res.ok) setTipi(await res.json() ?? []);
        } finally {
            setLoadingData(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Eliminare questo piano abbonamento?")) return;
        setDeletingId(id);
        try {
            await fetch(`/api/gyms/tipi-abbonamento?id=${id}`, { method: "DELETE" });
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
                    <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.25rem" }}>💳 Piani Abbonamento</h1>
                    <p style={{ fontSize: "0.875rem", color: "hsl(var(--tf-text-muted))" }}>
                        {loadingData ? "Caricamento…" : `${tipi.length} piani configurati`}
                    </p>
                </div>
                {strutturaid && (
                    <button onClick={() => setFormOpen(true)} style={{ padding: "0.65rem 1.5rem", borderRadius: "var(--tf-radius-sm)", border: "none", background: "linear-gradient(135deg, hsl(145 60% 45%), hsl(var(--tf-primary)))", color: "#fff", cursor: "pointer", fontSize: "0.875rem", fontWeight: 700 }}>
                        + Nuovo Piano
                    </button>
                )}
            </div>

            {loadingData ? (
                <div style={{ textAlign: "center", padding: "3rem", color: "hsl(var(--tf-text-muted))" }}><div style={{ fontSize: "2rem" }}>⏳</div><p>Caricamento…</p></div>
            ) : tipi.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem", border: "2px dashed hsl(var(--tf-border))", borderRadius: "var(--tf-radius)", color: "hsl(var(--tf-text-muted))" }}>
                    <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>💳</div>
                    <p style={{ fontWeight: 600 }}>Nessun piano abbonamento</p>
                    <p style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>Crea il primo piano per iniziare ad accettare iscrizioni</p>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
                    {tipi.map(tipo => (
                        <div key={tipo.id} style={{ padding: "1.5rem", borderRadius: "var(--tf-radius)", background: "hsl(var(--tf-surface))", border: "1px solid hsl(var(--tf-border))", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <div>
                                    <p style={{ fontWeight: 800, fontSize: "1rem" }}>{tipo.nome}</p>
                                    <p style={{ fontSize: "0.75rem", color: "hsl(var(--tf-text-muted))" }}>
                                        {tipo.duratamesi} {tipo.duratamesi === 1 ? "mese" : "mesi"}
                                        {tipo.rinnovabile ? " · 🔄 Rinnovabile" : ""}
                                    </p>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <p style={{ fontWeight: 800, fontSize: "1.5rem", color: "hsl(var(--tf-primary))" }}>€{tipo.prezzo}</p>
                                    {tipo.duratamesi > 1 && (
                                        <p style={{ fontSize: "0.7rem", color: "hsl(var(--tf-text-muted))" }}>
                                            €{(tipo.prezzo / tipo.duratamesi).toFixed(2)}/mese
                                        </p>
                                    )}
                                </div>
                            </div>
                            {tipo.descrizione && <p style={{ fontSize: "0.78rem", color: "hsl(var(--tf-text-muted))", lineHeight: 1.5 }}>{tipo.descrizione}</p>}
                            <button onClick={() => handleDelete(tipo.id)} disabled={deletingId === tipo.id} style={{ padding: "0.4rem", borderRadius: "var(--tf-radius-sm)", border: "1px solid hsl(var(--tf-danger)/.3)", background: "hsl(var(--tf-danger)/.08)", color: "hsl(var(--tf-danger))", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, opacity: deletingId === tipo.id ? 0.5 : 1 }}>
                                🗑️ Elimina Piano
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {formOpen && strutturaid && (
                <TipoForm strutturaid={strutturaid} onClose={() => setFormOpen(false)} onSuccess={() => { setFormOpen(false); setLoadingData(true); fetchData(); }} />
            )}
        </div>
    );
}
