// ============================================================
// /gyms/coupon – Gestione Coupon Promozionali
// Visibile solo ai GESTORE
// ============================================================
"use client";

import { useEffect, useState } from "react";
import { useRoleRedirect } from "@frontend/hooks/useRoleRedirect";
import { RuoloEnum } from "@backend/domain/model/enums";
import type { Coupon } from "@backend/domain/model/types";

function CouponForm({
    strutturaid,
    onClose,
    onSuccess,
}: {
    strutturaid: string;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [form, setForm] = useState({
        codice: "",
        percentualesconto: 10,
        monouso: true,
        scadenza: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generateCode = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
        setForm(f => ({ ...f, codice: code }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const res = await fetch("/api/gyms/coupon", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    strutturaid,
                    tipoabbonamentoid: "00000000-0000-0000-0000-000000000000", // placeholder
                    percentualesconto: Number(form.percentualesconto),
                    scadenza: new Date(form.scadenza).toISOString(),
                    usato: false,
                }),
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
            <div style={{ background: "hsl(var(--tf-surface))", border: "1px solid hsl(var(--tf-border))", borderRadius: "var(--tf-radius)", padding: "2rem", width: "100%", maxWidth: 440 }}>
                <h2 style={{ fontWeight: 800, fontSize: "1.2rem", marginBottom: "1.25rem" }}>🎟️ Nuovo Coupon</h2>
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div>
                        <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "hsl(var(--tf-text-muted))", display: "block", marginBottom: "0.4rem" }}>Codice Coupon *</label>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                            <input style={inputStyle} type="text" required value={form.codice} onChange={e => setForm(f => ({ ...f, codice: e.target.value.toUpperCase() }))} placeholder="es. PROMO2025" />
                            <button type="button" onClick={generateCode} style={{ padding: "0.65rem 0.9rem", borderRadius: "var(--tf-radius-sm)", border: "1px solid hsl(var(--tf-border))", background: "hsl(var(--tf-surface))", color: "hsl(var(--tf-text))", cursor: "pointer", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                                🎲 Auto
                            </button>
                        </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        <div>
                            <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "hsl(var(--tf-text-muted))", display: "block", marginBottom: "0.4rem" }}>Sconto (%) *</label>
                            <input style={inputStyle} type="number" min={1} max={100} required value={form.percentualesconto} onChange={e => setForm(f => ({ ...f, percentualesconto: parseInt(e.target.value) }))} />
                        </div>
                        <div>
                            <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "hsl(var(--tf-text-muted))", display: "block", marginBottom: "0.4rem" }}>Scadenza *</label>
                            <input style={inputStyle} type="date" required value={form.scadenza} onChange={e => setForm(f => ({ ...f, scadenza: e.target.value }))} />
                        </div>
                    </div>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.875rem" }}>
                        <input type="checkbox" checked={form.monouso} onChange={e => setForm(f => ({ ...f, monouso: e.target.checked }))} />
                        Monouso (valido una sola volta in assoluto)
                    </label>
                    {error && <p style={{ padding: "0.6rem", borderRadius: "6px", background: "hsl(var(--tf-danger)/.1)", color: "hsl(var(--tf-danger))", fontSize: "0.8rem" }}>⚠️ {error}</p>}
                    <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                        <button type="button" onClick={onClose} style={{ padding: "0.6rem 1.25rem", borderRadius: "var(--tf-radius-sm)", border: "1px solid hsl(var(--tf-border))", background: "transparent", color: "hsl(var(--tf-text))", cursor: "pointer", fontSize: "0.875rem" }}>Annulla</button>
                        <button type="submit" disabled={loading} style={{ padding: "0.6rem 1.5rem", borderRadius: "var(--tf-radius-sm)", border: "none", background: "linear-gradient(135deg, hsl(145 60% 45%), hsl(var(--tf-primary)))", color: "#fff", cursor: loading ? "not-allowed" : "pointer", fontSize: "0.875rem", fontWeight: 700, opacity: loading ? 0.7 : 1 }}>
                            {loading ? "Creando…" : "Crea Coupon"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function CouponPage() {
    const { loading } = useRoleRedirect(RuoloEnum.GESTORE);
    const [coupon, setCoupon] = useState<Coupon[]>([]);
    const [strutturaid, setStrutturaid] = useState<string | null>(null);
    const [loadingData, setLoadingData] = useState(true);
    const [formOpen, setFormOpen] = useState(false);

    const fetchData = async () => {
        try {
            const meRes = await fetch("/api/gyms/me");
            if (!meRes.ok) return;
            const { struttura } = await meRes.json();
            if (!struttura?.id) return;
            setStrutturaid(struttura.id);
            // Fetch coupon directly from supabase (no dedicated route yet, using /api/gyms/coupon)
            const res = await fetch(`/api/gyms/coupon?strutturaid=${struttura.id}`);
            if (res.ok) setCoupon(await res.json() ?? []);
        } finally {
            setLoadingData(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    if (loading) return null;

    const scaduti = (c: Coupon) => new Date(c.scadenza) < new Date();

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                    <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.25rem" }}>🎟️ Coupon Promozionali</h1>
                    <p style={{ fontSize: "0.875rem", color: "hsl(var(--tf-text-muted))" }}>
                        {loadingData ? "Caricamento…" : `${coupon.filter(c => !scaduti(c) && !c.usato).length} coupon attivi`}
                    </p>
                </div>
                {strutturaid && (
                    <button onClick={() => setFormOpen(true)} style={{ padding: "0.65rem 1.5rem", borderRadius: "var(--tf-radius-sm)", border: "none", background: "linear-gradient(135deg, hsl(145 60% 45%), hsl(var(--tf-primary)))", color: "#fff", cursor: "pointer", fontSize: "0.875rem", fontWeight: 700 }}>
                        + Nuovo Coupon
                    </button>
                )}
            </div>

            {loadingData ? (
                <div style={{ textAlign: "center", padding: "3rem", color: "hsl(var(--tf-text-muted))" }}><div style={{ fontSize: "2rem" }}>⏳</div><p>Caricamento…</p></div>
            ) : coupon.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem", border: "2px dashed hsl(var(--tf-border))", borderRadius: "var(--tf-radius)", color: "hsl(var(--tf-text-muted))" }}>
                    <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🎟️</div>
                    <p style={{ fontWeight: 600 }}>Nessun coupon ancora</p>
                    <p style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>Crea coupon promozionali per attrarre nuovi iscritti</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {coupon.map(c => {
                        const isScaduto = scaduti(c);
                        const isUsato = c.usato;
                        const isAttivo = !isScaduto && !isUsato;
                        return (
                            <div key={c.id} style={{
                                padding: "1.25rem",
                                borderRadius: "var(--tf-radius)",
                                background: "hsl(var(--tf-surface))",
                                border: `1px solid ${isAttivo ? "hsl(145 60% 45%/.3)" : "hsl(var(--tf-border))"}`,
                                display: "flex", alignItems: "center", gap: "1.25rem",
                                opacity: isAttivo ? 1 : 0.6,
                            }}>
                                <div style={{ textAlign: "center", padding: "0.75rem 1rem", borderRadius: "var(--tf-radius-sm)", background: isAttivo ? "hsl(145 60% 45%/.12)" : "hsl(var(--tf-border)/.2)", minWidth: 80 }}>
                                    <p style={{ fontWeight: 800, fontSize: "1.5rem", color: isAttivo ? "hsl(145 60% 45%)" : "hsl(var(--tf-text-muted))" }}>
                                        {c.percentualesconto}%
                                    </p>
                                    <p style={{ fontSize: "0.65rem", color: "hsl(var(--tf-text-muted))", fontWeight: 600 }}>SCONTO</p>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                                        <p style={{ fontWeight: 800, fontFamily: "monospace", fontSize: "1rem", letterSpacing: "0.1em" }}>{c.codice}</p>
                                        <span style={{
                                            padding: "0.15rem 0.5rem", borderRadius: "999px", fontSize: "0.7rem", fontWeight: 700,
                                            background: isAttivo ? "hsl(145 60% 45%/.12)" : isUsato ? "hsl(var(--tf-text-muted)/.12)" : "hsl(var(--tf-danger)/.12)",
                                            color: isAttivo ? "hsl(145 60% 45%)" : isUsato ? "hsl(var(--tf-text-muted))" : "hsl(var(--tf-danger))",
                                        }}>
                                            {isUsato ? "Usato" : isScaduto ? "Scaduto" : "Attivo"}
                                        </span>
                                        {c.monouso && <span style={{ padding: "0.15rem 0.5rem", borderRadius: "999px", fontSize: "0.7rem", background: "hsl(45 90% 55%/.12)", color: "hsl(45 90% 55%)", fontWeight: 700 }}>Monouso</span>}
                                    </div>
                                    <p style={{ fontSize: "0.78rem", color: "hsl(var(--tf-text-muted))" }}>
                                        Scadenza: {new Date(c.scadenza).toLocaleDateString("it-IT")}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {formOpen && strutturaid && (
                <CouponForm strutturaid={strutturaid} onClose={() => setFormOpen(false)} onSuccess={() => { setFormOpen(false); setLoadingData(true); fetchData(); }} />
            )}
        </div>
    );
}
