// ============================================================
// /gyms/struttura – Gestione Struttura Palestra
// Visibile solo ai GESTORE
// ============================================================
"use client";

import { useEffect, useState } from "react";
import { useRoleRedirect } from "@frontend/hooks/useRoleRedirect";
import { RuoloEnum } from "@backend/domain/model/enums";
import type { Struttura } from "@backend/domain/model/types";

export default function StrutturaPage() {
    const { loading } = useRoleRedirect(RuoloEnum.GESTORE);
    const [struttura, setStruttura] = useState<Struttura | null>(null);
    const [loadingData, setLoadingData] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [form, setForm] = useState({
        denominazione: "",
        indirizzo: "",
        telefono: "",
        email: "",
        sito: "",
        descrizione: "",
        stato: "Attiva" as "Attiva" | "Sospesa",
    });

    useEffect(() => {
        const fetchStruttura = async () => {
            try {
                const res = await fetch("/api/gyms/me");
                if (res.ok) {
                    const data = await res.json();
                    if (data.struttura) {
                        setStruttura(data.struttura);
                        setForm({
                            denominazione: data.struttura.denominazione ?? "",
                            indirizzo: data.struttura.indirizzo ?? "",
                            telefono: data.struttura.telefono ?? "",
                            email: data.struttura.email ?? "",
                            sito: data.struttura.sito ?? "",
                            descrizione: data.struttura.descrizione ?? "",
                            stato: data.struttura.stato ?? "Attiva",
                        });
                    }
                }
            } finally {
                setLoadingData(false);
            }
        };
        fetchStruttura();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSaving(true);
        try {
            const res = await fetch("/api/gyms/me", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Errore nel salvataggio");
            setStruttura(data);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            setError(String(err));
        } finally {
            setSaving(false);
        }
    };

    if (loading || loadingData) {
        return (
            <div style={{ textAlign: "center", padding: "4rem", color: "hsl(var(--tf-text-muted))" }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⏳</div>
                <p>Caricamento...</p>
            </div>
        );
    }

    const inputStyle = {
        width: "100%",
        padding: "0.65rem 0.85rem",
        borderRadius: "var(--tf-radius-sm)",
        border: "1px solid hsl(var(--tf-border))",
        background: "hsl(var(--tf-bg))",
        color: "hsl(var(--tf-text))",
        fontSize: "0.875rem",
        outline: "none",
        boxSizing: "border-box" as const,
    };

    const labelStyle = {
        fontSize: "0.8rem",
        fontWeight: 600,
        color: "hsl(var(--tf-text-muted))",
        display: "block" as const,
        marginBottom: "0.4rem",
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Header */}
            <div>
                <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.25rem" }}>
                    🏋️ Dati Struttura
                </h1>
                <p style={{ fontSize: "0.875rem", color: "hsl(var(--tf-text-muted))" }}>
                    Gestisci le informazioni della tua palestra
                </p>
            </div>

            {!struttura && !loadingData ? (
                <div style={{
                    padding: "2rem", textAlign: "center",
                    borderRadius: "var(--tf-radius)",
                    border: "2px dashed hsl(var(--tf-border))",
                    color: "hsl(var(--tf-text-muted))",
                }}>
                    <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🏗️</div>
                    <p style={{ fontWeight: 600 }}>Struttura non ancora configurata</p>
                    <p style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>
                        Contatta un amministratore per registrare la tua struttura nel sistema.
                    </p>
                </div>
            ) : (
                <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    {/* Info readonly */}
                    {struttura && (
                        <div style={{
                            padding: "1rem",
                            borderRadius: "var(--tf-radius-sm)",
                            background: "hsl(var(--tf-surface))",
                            border: "1px solid hsl(var(--tf-border))",
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "0.75rem",
                        }}>
                            <div>
                                <p style={labelStyle}>P.IVA (non modificabile)</p>
                                <p style={{ fontSize: "0.875rem", fontFamily: "monospace", color: "hsl(var(--tf-text-muted))" }}>
                                    {struttura.piva}
                                </p>
                            </div>
                            <div>
                                <p style={labelStyle}>CUN (non modificabile)</p>
                                <p style={{ fontSize: "0.875rem", fontFamily: "monospace", color: "hsl(var(--tf-text-muted))" }}>
                                    {struttura.cun}
                                </p>
                            </div>
                        </div>
                    )}

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        <div>
                            <label style={labelStyle}>Nome Struttura *</label>
                            <input style={inputStyle} type="text" required value={form.denominazione}
                                onChange={e => setForm(f => ({ ...f, denominazione: e.target.value }))} />
                        </div>
                        <div>
                            <label style={labelStyle}>Stato</label>
                            <select style={inputStyle} value={form.stato}
                                onChange={e => setForm(f => ({ ...f, stato: e.target.value as "Attiva" | "Sospesa" }))}>
                                <option value="Attiva">Attiva</option>
                                <option value="Sospesa">Sospesa</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label style={labelStyle}>Indirizzo *</label>
                        <input style={inputStyle} type="text" required value={form.indirizzo}
                            onChange={e => setForm(f => ({ ...f, indirizzo: e.target.value }))} />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        <div>
                            <label style={labelStyle}>Telefono</label>
                            <input style={inputStyle} type="tel" value={form.telefono}
                                onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} />
                        </div>
                        <div>
                            <label style={labelStyle}>Email</label>
                            <input style={inputStyle} type="email" value={form.email}
                                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                        </div>
                    </div>

                    <div>
                        <label style={labelStyle}>Sito Web</label>
                        <input style={inputStyle} type="url" placeholder="https://" value={form.sito}
                            onChange={e => setForm(f => ({ ...f, sito: e.target.value }))} />
                    </div>

                    <div>
                        <label style={labelStyle}>Descrizione</label>
                        <textarea
                            rows={4} value={form.descrizione}
                            onChange={e => setForm(f => ({ ...f, descrizione: e.target.value }))}
                            placeholder="Descrivi la tua palestra, i servizi offerti, gli orari..."
                            style={{ ...inputStyle, resize: "vertical" }}
                        />
                    </div>

                    {error && (
                        <p style={{
                            padding: "0.75rem", borderRadius: "var(--tf-radius-sm)",
                            background: "hsl(var(--tf-danger)/.1)",
                            color: "hsl(var(--tf-danger))",
                            fontSize: "0.8rem",
                        }}>
                            ⚠️ {error}
                        </p>
                    )}

                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <button type="submit" disabled={saving} style={{
                            padding: "0.7rem 2rem",
                            borderRadius: "var(--tf-radius-sm)",
                            border: "none",
                            background: saved
                                ? "hsl(145 60% 45%)"
                                : "linear-gradient(135deg, hsl(145 60% 45%), hsl(var(--tf-primary)))",
                            color: "#fff",
                            cursor: saving ? "not-allowed" : "pointer",
                            fontSize: "0.9rem", fontWeight: 700,
                            opacity: saving ? 0.7 : 1,
                        }}>
                            {saving ? "Salvataggio…" : saved ? "✓ Salvato!" : "Salva Modifiche"}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
