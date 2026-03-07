// ============================================================
// /gyms/coupon – Coupon utilizzati per struttura + download CSV
// ============================================================
"use client";

import { useEffect, useState } from "react";
import { useRoleRedirect } from "@frontend/hooks/useRoleRedirect";
import { RuoloEnum } from "@backend/domain/model/enums";

interface CouponRow {
    id: string;
    codice: string;
    descrizione: string;
    sconto: number;        // percentuale
    monouso: boolean;
    stato: "ATTIVO" | "USATO" | "SCADUTO";
    usatoDa?: string;      // nome utente
    usatoIl?: string;      // data utilizzo
    scadenzaIl?: string;
}

const STATO_COLOR: Record<string, string> = {
    ATTIVO: "hsl(145 60% 45%)",
    USATO: "hsl(var(--tf-primary))",
    SCADUTO: "hsl(var(--tf-danger))",
};

function exportCSV(rows: CouponRow[], strutturaNome: string) {
    const header = ["Codice", "Descrizione", "Sconto %", "Monouso", "Stato", "Usato da", "Usato il", "Scadenza"];
    const lines = rows.map(r => [
        r.codice, `"${r.descrizione}"`, r.sconto,
        r.monouso ? "Sì" : "No", r.stato,
        r.usatoDa ?? "—",
        r.usatoIl ? new Date(r.usatoIl).toLocaleDateString("it-IT") : "—",
        r.scadenzaIl ? new Date(r.scadenzaIl).toLocaleDateString("it-IT") : "—",
    ].join(","));
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `coupon-${strutturaNome}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

export default function CouponPage() {
    const { loading } = useRoleRedirect(RuoloEnum.GESTORE);
    const [coupon, setCoupon] = useState<CouponRow[]>([]);
    const [tipiAbbonamento, setTipiAbbonamento] = useState<{ id: string, nome: string }[]>([]);
    const [strutturaNome, setStrutturaNome] = useState("struttura");
    const [strutturaid, setStrutturaid] = useState<string | null>(null);
    const [loadingData, setLoadingData] = useState(true);
    const [filter, setFilter] = useState<"TUTTI" | "ATTIVO" | "USATO" | "SCADUTO">("TUTTI");
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newCoupon, setNewCoupon] = useState({
        codice: "",
        descrizione: "",
        sconto: 10,
        monouso: true,
        scadenzaIl: "",
        tipoabbonamentoid: ""
    });

    function genCodice() {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    }

    const fetchCoupon = async (sid: string) => {
        const res = await fetch(`/api/gyms/coupon?strutturaid=${sid}`);
        if (!res.ok) return;
        const data = await res.json();
        const list = data?.data ?? data ?? [];
        setCoupon(list.map((c: Record<string, unknown>) => ({
            id: c.id as string,
            codice: c.codice as string ?? "",
            descrizione: c.descrizione as string ?? "",
            sconto: Number(c.percentualesconto ?? c.sconto ?? 0),
            monouso: !!(c.monouso),
            stato: (c.stato as string ?? "ATTIVO").toUpperCase() as CouponRow["stato"],
            usatoDa: (c.usatoda as string) ?? undefined,
            usatoIl: (c.usatoil as string) ?? undefined,
            scadenzaIl: (c.scadenza as string ?? c.scadenzail as string) ?? undefined,
        })));
    };

    const fetchTipi = async (sid: string) => {
        const res = await fetch(`/api/gyms/tipi-abbonamento?strutturaid=${sid}`);
        if (res.ok) {
            const data = await res.json();
            setTipiAbbonamento(data?.data ?? data ?? []);
        }
    };

    useEffect(() => {
        const init = async () => {
            try {
                const meRes = await fetch("/api/gyms/me");
                if (!meRes.ok) return;
                const meData = await meRes.json();
                const s = meData?.data?.struttura ?? meData?.struttura;
                if (!s) return;
                setStrutturaNome(s.denominazione ?? "struttura");
                setStrutturaid(s.id);
                await Promise.all([
                    fetchCoupon(s.id),
                    fetchTipi(s.id)
                ]);
            } finally { setLoadingData(false); }
        };
        init();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!strutturaid || !newCoupon.tipoabbonamentoid) {
            alert("Seleziona un tipo di abbonamento");
            return;
        }
        setCreating(true);
        try {
            const payload = {
                strutturaid,
                codice: newCoupon.codice,
                descrizione: newCoupon.descrizione,
                percentualesconto: newCoupon.sconto,
                monouso: newCoupon.monouso,
                tipoabbonamentoid: newCoupon.tipoabbonamentoid === "ALL" ? null : newCoupon.tipoabbonamentoid,
                scadenza: newCoupon.scadenzaIl ? new Date(newCoupon.scadenzaIl).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            };

            const res = await fetch("/api/gyms/coupon", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                await fetchCoupon(strutturaid);
                setShowModal(false);
                setNewCoupon({ codice: "", descrizione: "", sconto: 10, monouso: true, scadenzaIl: "", tipoabbonamentoid: "" });
            } else {
                const errData = await res.json();
                alert(JSON.stringify(errData.error || "Errore nella creazione"));
            }
        } finally { setCreating(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Sei sicuro di voler eliminare questo coupon?")) return;
        try {
            const res = await fetch(`/api/gyms/coupon?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                if (strutturaid) await fetchCoupon(strutturaid);
            } else {
                const errData = await res.json();
                alert(errData.error || "Errore nell'eliminazione");
            }
        } catch (err) { alert(String(err)); }
    };

    if (loading || loadingData) return (
        <div style={{ textAlign: "center", padding: "4rem" }}><div style={{ fontSize: "2rem" }}>⏳</div><p>Caricamento...</p></div>
    );

    const inputSt = { width: "100%", padding: "0.6rem 0.85rem", borderRadius: "var(--tf-radius-sm)", border: "1px solid hsl(var(--tf-border))", background: "hsl(var(--tf-bg))", color: "hsl(var(--tf-text))", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" as const };
    const labelSt = { fontSize: "0.8rem", fontWeight: 600 as const, color: "hsl(var(--tf-text-muted))", display: "block" as const, marginBottom: "0.3rem" };

    const filtered = coupon
        .filter(c => filter === "TUTTI" || c.stato === filter)
        .filter(c => !search || c.codice.toLowerCase().includes(search.toLowerCase()) || c.descrizione.toLowerCase().includes(search.toLowerCase()) || (c.usatoDa ?? "").toLowerCase().includes(search.toLowerCase()));

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Header omitted for brevity in replace, but keeping structure */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                    <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.25rem" }}>🎟️ Coupon</h1>
                    <p style={{ fontSize: "0.875rem", color: "hsl(var(--tf-text-muted))" }}>
                        Tutti i coupon di <strong>{strutturaNome}</strong>
                    </p>
                </div>
                <div style={{ display: "flex", gap: "0.6rem" }}>
                    <button onClick={() => exportCSV(filtered, strutturaNome)} style={{ padding: "0.6rem 1.1rem", borderRadius: "var(--tf-radius-sm)", border: "1px solid hsl(var(--tf-border))", background: "hsl(var(--tf-surface))", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600, color: "hsl(var(--tf-text))", display: "flex", gap: "0.4rem", alignItems: "center" }}>
                        📥 CSV
                    </button>
                    <button onClick={() => setShowModal(true)} style={{ padding: "0.6rem 1.1rem", borderRadius: "var(--tf-radius-sm)", border: "none", background: "linear-gradient(135deg, hsl(var(--tf-primary)), hsl(var(--tf-accent)))", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: "0.875rem" }}>
                        + Nuovo Coupon
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem" }}>
                {[
                    { label: "Totale", val: coupon.length, icon: "🎟️" },
                    { label: "Attivi", val: coupon.filter(c => c.stato === "ATTIVO").length, icon: "✅" },
                    { label: "Utilizzati", val: coupon.filter(c => c.stato === "USATO").length, icon: "✔️" },
                    { label: "Scaduti", val: coupon.filter(c => c.stato === "SCADUTO").length, icon: "⏰" },
                ].map(s => (
                    <div key={s.label} style={{ padding: "1rem 1.25rem", borderRadius: "var(--tf-radius-sm)", background: "hsl(var(--tf-surface))", border: "1px solid hsl(var(--tf-border))" }}>
                        <p style={{ fontSize: "1.2rem" }}>{s.icon}</p>
                        <p style={{ fontSize: "1.5rem", fontWeight: 800 }}>{s.val}</p>
                        <p style={{ fontSize: "0.72rem", color: "hsl(var(--tf-text-muted))" }}>{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Filtri + search */}
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
                <input placeholder="🔍 Cerca codice, descrizione o utente..." value={search} onChange={e => setSearch(e.target.value)}
                    style={{ ...inputSt, maxWidth: 300 }} />
                {(["TUTTI", "ATTIVO", "USATO", "SCADUTO"] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)} style={{
                        padding: "0.4rem 1rem", borderRadius: "999px", border: "none", cursor: "pointer",
                        fontSize: "0.8rem", fontWeight: 600, transition: "all 0.15s",
                        background: filter === f ? "hsl(var(--tf-primary))" : "hsl(var(--tf-surface))",
                        color: filter === f ? "#fff" : "hsl(var(--tf-text-muted))",
                    }}>{f}</button>
                ))}
            </div>

            {/* Tabella */}
            {filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem", color: "hsl(var(--tf-text-muted))" }}>
                    <div style={{ fontSize: "2rem" }}>📭</div><p>Nessun coupon trovato</p>
                </div>
            ) : (
                <div style={{ borderRadius: "var(--tf-radius)", border: "1px solid hsl(var(--tf-border))", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                        <thead>
                            <tr style={{ background: "hsl(var(--tf-surface))", borderBottom: "1px solid hsl(var(--tf-border))" }}>
                                {["Codice", "Descrizione", "Sconto", "Tipo", "Usato da", "Usato il", "Scadenza", "Stato", ""].map(h => (
                                    <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 700, fontSize: "0.8rem", color: "hsl(var(--tf-text-muted))", whiteSpace: "nowrap" }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((c, i) => (
                                <tr key={c.id} style={{ borderBottom: "1px solid hsl(var(--tf-border))", background: i % 2 === 0 ? "transparent" : "hsl(var(--tf-surface)/.4)" }}>
                                    <td style={{ padding: "0.75rem 1rem" }}>
                                        <code style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.9rem", letterSpacing: "0.08em" }}>{c.codice}</code>
                                    </td>
                                    <td style={{ padding: "0.75rem 1rem", color: "hsl(var(--tf-text-muted))", maxWidth: 200 }}>{c.descrizione || "—"}</td>
                                    <td style={{ padding: "0.75rem 1rem", fontWeight: 800, color: "hsl(var(--tf-accent))" }}>−{c.sconto}%</td>
                                    <td style={{ padding: "0.75rem 1rem" }}>
                                        <span style={{ fontSize: "0.72rem", padding: "0.2rem 0.5rem", borderRadius: "999px", background: c.monouso ? "hsl(var(--tf-primary)/.12)" : "hsl(145 60% 45%/.12)", color: c.monouso ? "hsl(var(--tf-primary))" : "hsl(145 60% 45%)" }}>
                                            {c.monouso ? "Monouso" : "Multiplo"}
                                        </span>
                                    </td>
                                    <td style={{ padding: "0.75rem 1rem", color: "hsl(var(--tf-text-muted))" }}>{c.usatoDa ?? "—"}</td>
                                    <td style={{ padding: "0.75rem 1rem", color: "hsl(var(--tf-text-muted))" }}>{c.usatoIl ? new Date(c.usatoIl).toLocaleDateString("it-IT") : "—"}</td>
                                    <td style={{ padding: "0.75rem 1rem", color: "hsl(var(--tf-text-muted))" }}>{c.scadenzaIl ? new Date(c.scadenzaIl).toLocaleDateString("it-IT") : "∞"}</td>
                                    <td style={{ padding: "0.75rem 1rem" }}>
                                        <span style={{ padding: "0.25rem 0.6rem", borderRadius: "999px", fontSize: "0.72rem", fontWeight: 700, background: STATO_COLOR[c.stato] + "22", color: STATO_COLOR[c.stato] }}>{c.stato}</span>
                                    </td>
                                    <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>
                                        <button
                                            onClick={() => handleDelete(c.id)}
                                            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem", padding: "0.2rem", color: "#f87171", transition: "transform 0.1s" }}
                                            title="Elimina Coupon"
                                        >
                                            🗑️
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal nuovo coupon */}
            {showModal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ background: "hsl(var(--tf-surface))", borderRadius: "var(--tf-radius)", padding: "2rem", width: "100%", maxWidth: 460, border: "1px solid hsl(var(--tf-border))" }}>
                        <h2 style={{ fontWeight: 800, marginBottom: "1.5rem" }}>🎟️ Nuovo Coupon</h2>
                        <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            <div>
                                <label style={labelSt}>Codice *</label>
                                <div style={{ display: "flex", gap: "0.5rem" }}>
                                    <input style={inputSt} required value={newCoupon.codice} onChange={e => setNewCoupon(p => ({ ...p, codice: e.target.value.toUpperCase() }))} placeholder="PROMO24" />
                                    <button type="button" onClick={() => setNewCoupon(p => ({ ...p, codice: genCodice() }))} style={{ padding: "0 0.85rem", borderRadius: "var(--tf-radius-sm)", border: "1px solid hsl(var(--tf-border))", background: "hsl(var(--tf-bg))", cursor: "pointer", whiteSpace: "nowrap", fontSize: "0.8rem" }}>🎲 Random</button>
                                </div>
                            </div>
                            <div>
                                <label style={labelSt}>Tipo Abbonamento *</label>
                                <select
                                    style={inputSt}
                                    required
                                    value={newCoupon.tipoabbonamentoid}
                                    onChange={e => setNewCoupon(p => ({ ...p, tipoabbonamentoid: e.target.value }))}
                                >
                                    <option value="">Seleziona...</option>
                                    <option value="ALL">Tutti i tipi (All)</option>
                                    {tipiAbbonamento.map(t => (
                                        <option key={t.id} value={t.id}>{t.nome}</option>
                                    ))}
                                </select>
                            </div>
                            <div><label style={labelSt}>Descrizione</label><input style={inputSt} value={newCoupon.descrizione} onChange={e => setNewCoupon(p => ({ ...p, descrizione: e.target.value }))} placeholder="es. Sconto benvenuto" /></div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                                <div><label style={labelSt}>Sconto (%)</label><input style={inputSt} type="number" min={1} max={100} value={newCoupon.sconto} onChange={e => setNewCoupon(p => ({ ...p, sconto: +e.target.value }))} /></div>
                                <div><label style={labelSt}>Scadenza</label><input style={inputSt} type="date" value={newCoupon.scadenzaIl} onChange={e => setNewCoupon(p => ({ ...p, scadenzaIl: e.target.value }))} /></div>
                            </div>
                            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.875rem" }}>
                                <input type="checkbox" checked={newCoupon.monouso} onChange={e => setNewCoupon(p => ({ ...p, monouso: e.target.checked }))} />
                                Monouso (validità singola)
                            </label>
                            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ padding: "0.6rem 1.2rem", borderRadius: "var(--tf-radius-sm)", border: "1px solid hsl(var(--tf-border))", background: "transparent", cursor: "pointer", color: "hsl(var(--tf-text-muted))" }}>Annulla</button>
                                <button type="submit" disabled={creating} style={{ padding: "0.6rem 1.5rem", borderRadius: "var(--tf-radius-sm)", border: "none", background: "linear-gradient(135deg, hsl(var(--tf-primary)), hsl(var(--tf-accent)))", color: "#fff", cursor: "pointer", fontWeight: 700 }}>{creating ? "Creazione…" : "Crea Coupon"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
