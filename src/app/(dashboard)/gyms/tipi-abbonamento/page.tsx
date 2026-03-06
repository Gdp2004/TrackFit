"use client";

import { useEffect, useState } from "react";
import { useRoleRedirect } from "@frontend/hooks/useRoleRedirect";
import { RuoloEnum } from "@backend/domain/model/enums";

interface TipoAbbonamento {
    id: string;
    nome: string;
    duratamesi: number;
    prezzo: number;
    strutturaid: string;
}

export default function TipiAbbonamentoPage() {
    const { loading } = useRoleRedirect(RuoloEnum.GESTORE);
    const [tipi, setTipi] = useState<TipoAbbonamento[]>([]);
    const [strutturaid, setStrutturaid] = useState<string | null>(null);
    const [loadingData, setLoadingData] = useState(true);

    // Form predefinito
    const [form, setForm] = useState({ nome: "", duratamesi: 1, prezzo: 50 });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const init = async () => {
            try {
                // 1. Get la struttura del gestore
                const meRes = await fetch("/api/gyms/me");
                if (!meRes.ok) return;
                const meData = await meRes.json();
                const s = meData?.struttura ?? meData?.data?.struttura;
                if (!s) return;
                setStrutturaid(s.id);

                // 2. Fetch tipi abbonamento
                const tipiRes = await fetch(`/api/gyms/tipi-abbonamento?strutturaid=${s.id}`);
                if (tipiRes.ok) {
                    const tipiData = await tipiRes.json();
                    setTipi(tipiData?.data ?? tipiData ?? []);
                }
            } finally {
                setLoadingData(false);
            }
        };
        init();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: name === "nome" ? value : Number(value) }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!strutturaid) return;
        setSaving(true);
        try {
            const res = await fetch("/api/gyms/tipi-abbonamento", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...form, strutturaid })
            });
            if (res.ok) {
                const data = await res.json();
                setTipi([...tipi, data?.data ?? data]);
                setForm({ nome: "", duratamesi: 1, prezzo: 50 }); // Reset
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Sei sicuro di voler eliminare questo piano?")) return;
        try {
            const res = await fetch(`/api/gyms/tipi-abbonamento?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                setTipi(tipi.filter(t => t.id !== id));
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading || loadingData) return <div style={{ padding: "4rem", textAlign: "center" }}>⏳ Caricamento...</div>;

    if (!strutturaid) return (
        <div style={{ padding: "3rem", textAlign: "center", color: "hsl(var(--tf-danger))" }}>
            <p>Non possiedi alcuna struttura. Crea prima una struttura in &quot;Struttura&quot;.</p>
        </div>
    );

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {/* Header */}
            <div>
                <h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>📋 Piani di Abbonamento</h1>
                <p style={{ color: "hsl(var(--tf-text-muted))", fontSize: "0.875rem" }}>
                    Crea i piani tariffari che i tuoi utenti potranno acquistare.
                </p>
            </div>

            {/* Form Creazione */}
            <div style={{ padding: "1.5rem", borderRadius: "var(--tf-radius)", background: "hsl(var(--tf-surface))", border: "1px solid hsl(var(--tf-border))" }}>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem" }}>Crea Nuovo Piano</h2>
                <form onSubmit={handleSubmit} style={{ display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}>
                    <div style={{ flex: "1 1 200px" }}>
                        <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.3rem", color: "hsl(var(--tf-text-muted))" }}>Nome Piano</label>
                        <input name="nome" required value={form.nome} onChange={handleChange} placeholder="Es. Mensile Base"
                            style={{ width: "100%", padding: "0.6rem", borderRadius: "var(--tf-radius-sm)", border: "1px solid hsl(var(--tf-border))", background: "hsl(var(--tf-bg))", color: "hsl(var(--tf-text))" }} />
                    </div>
                    <div style={{ width: 120 }}>
                        <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.3rem", color: "hsl(var(--tf-text-muted))" }}>Durata (Mesi)</label>
                        <input name="duratamesi" type="number" min="1" required value={form.duratamesi} onChange={handleChange}
                            style={{ width: "100%", padding: "0.6rem", borderRadius: "var(--tf-radius-sm)", border: "1px solid hsl(var(--tf-border))", background: "hsl(var(--tf-bg))", color: "hsl(var(--tf-text))" }} />
                    </div>
                    <div style={{ width: 120 }}>
                        <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.3rem", color: "hsl(var(--tf-text-muted))" }}>Prezzo (€)</label>
                        <input name="prezzo" type="number" min="1" step="0.01" required value={form.prezzo} onChange={handleChange}
                            style={{ width: "100%", padding: "0.6rem", borderRadius: "var(--tf-radius-sm)", border: "1px solid hsl(var(--tf-border))", background: "hsl(var(--tf-bg))", color: "hsl(var(--tf-text))" }} />
                    </div>
                    <button type="submit" disabled={saving} style={{
                        padding: "0.6rem 1.5rem", borderRadius: "var(--tf-radius-sm)", border: "none", cursor: saving ? "not-allowed" : "pointer",
                        background: "hsl(145 60% 45%)", color: "#fff", fontWeight: 700, height: "42px"
                    }}>
                        {saving ? "Salv..." : "+ Aggiungi"}
                    </button>
                </form>
            </div>

            {/* List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {tipi.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "2rem", color: "hsl(var(--tf-text-muted))", background: "hsl(var(--tf-surface))", borderRadius: "var(--tf-radius)" }}>
                        Nessun piano creato. Creane uno per permettere agli utenti di abbonarsi!
                    </div>
                ) : (
                    tipi.map(t => (
                        <div key={t.id} style={{
                            padding: "1rem 1.5rem", borderRadius: "var(--tf-radius)", background: "hsl(var(--tf-surface))", border: "1px solid hsl(var(--tf-border))",
                            display: "flex", justifyContent: "space-between", alignItems: "center"
                        }}>
                            <div>
                                <h3 style={{ fontSize: "1rem", fontWeight: 800 }}>{t.nome}</h3>
                                <p style={{ fontSize: "0.85rem", color: "hsl(var(--tf-text-muted))" }}>Durata: {t.duratamesi} mes{t.duratamesi > 1 ? "i" : "e"} • Costo: €{t.prezzo.toFixed(2)}</p>
                            </div>
                            <button onClick={() => handleDelete(t.id)} style={{
                                padding: "0.4rem 0.8rem", borderRadius: "var(--tf-radius-sm)", border: "1px solid hsl(var(--tf-danger))",
                                background: "hsl(var(--tf-danger)/.1)", color: "hsl(var(--tf-danger))", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600
                            }}>
                                Elimina
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
