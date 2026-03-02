// ============================================================
// /gyms/corsi – Lista corsi per struttura + download CSV
// ============================================================
"use client";

import { useEffect, useState } from "react";
import { useRoleRedirect } from "@frontend/hooks/useRoleRedirect";
import { RuoloEnum } from "@backend/domain/model/enums";

interface CorsoRow {
    id: string;
    nome: string;
    coach: string;
    dataora: string;
    durata: number;
    maxPartecipanti: number;
    prenotati: number;
    prezzo: number;
}

function exportCSV(rows: CorsoRow[], strutturaNome: string) {
    const header = ["ID", "Nome Corso", "Coach", "Data/Ora", "Durata (min)", "Max Partecipanti", "Prenotati", "Posti Liberi", "Prezzo (€)"];
    const lines = rows.map(r => [
        r.id, `"${r.nome}"`, `"${r.coach}"`,
        new Date(r.dataora).toLocaleString("it-IT"),
        r.durata, r.maxPartecipanti, r.prenotati,
        r.maxPartecipanti - r.prenotati,
        r.prezzo.toFixed(2),
    ].join(","));
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `corsi-${strutturaNome}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

export default function CorsiPage() {
    const { loading } = useRoleRedirect(RuoloEnum.GESTORE);
    const [corsi, setCorsi] = useState<CorsoRow[]>([]);
    const [strutturaNome, setStrutturaNome] = useState("struttura");
    const [strutturaid, setStrutturaid] = useState<string | null>(null);
    const [loadingData, setLoadingData] = useState(true);
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [newCorso, setNewCorso] = useState({ nome: "", dataora: "", durata: 60, maxPartecipanti: 20, prezzo: 0 });
    const [creating, setCreating] = useState(false);

    const fetchCorsi = async (sid: string) => {
        const res = await fetch(`/api/gyms/${sid}/corsi`);
        if (!res.ok) return;
        const data = await res.json();
        const list = data?.data ?? data ?? [];
        setCorsi(list.map((c: Record<string, unknown>) => ({
            id: c.id as string,
            nome: c.nome as string ?? "—",
            coach: ((c.coach as Record<string, unknown>)?.nome ?? "—") as string,
            dataora: c.dataora as string ?? "",
            durata: Number(c.durata ?? 60),
            maxPartecipanti: Number(c.maxpartecipanti ?? 0),
            prenotati: Number(c.prenotati ?? 0),
            prezzo: Number(c.prezzo ?? 0),
        })));
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
                await fetchCorsi(s.id);
            } finally { setLoadingData(false); }
        };
        init();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!strutturaid) return;
        setCreating(true);
        try {
            const res = await fetch("/api/gyms?action=corso", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ strutturaid, ...newCorso }),
            });
            if (res.ok) {
                await fetchCorsi(strutturaid);
                setShowModal(false);
                setNewCorso({ nome: "", dataora: "", durata: 60, maxPartecipanti: 20, prezzo: 0 });
            }
        } finally { setCreating(false); }
    };

    const handleDelete = async (corsoid: string) => {
        if (!strutturaid) return;
        setDeleting(corsoid);
        try {
            await fetch(`/api/gyms?corsoid=${corsoid}`, { method: "DELETE" });
            setCorsi(prev => prev.filter(c => c.id !== corsoid));
        } finally { setDeleting(null); }
    };

    if (loading || loadingData) return (
        <div style={{ textAlign: "center", padding: "4rem" }}><div style={{ fontSize: "2rem" }}>⏳</div><p>Caricamento...</p></div>
    );

    const inputSt = { width: "100%", padding: "0.6rem 0.85rem", borderRadius: "var(--tf-radius-sm)", border: "1px solid hsl(var(--tf-border))", background: "hsl(var(--tf-bg))", color: "hsl(var(--tf-text))", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" as const };
    const labelSt = { fontSize: "0.8rem", fontWeight: 600 as const, color: "hsl(var(--tf-text-muted))", display: "block" as const, marginBottom: "0.3rem" };

    const filtered = corsi.filter(c => !search || c.nome.toLowerCase().includes(search.toLowerCase()) || c.coach.toLowerCase().includes(search.toLowerCase()));
    const futuri = filtered.filter(c => new Date(c.dataora) > new Date()).length;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                    <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.25rem" }}>📆 Corsi</h1>
                    <p style={{ fontSize: "0.875rem", color: "hsl(var(--tf-text-muted))" }}>
                        Tutti i corsi di <strong>{strutturaNome}</strong>
                    </p>
                </div>
                <div style={{ display: "flex", gap: "0.6rem" }}>
                    <button onClick={() => exportCSV(filtered, strutturaNome)} style={{ padding: "0.6rem 1.1rem", borderRadius: "var(--tf-radius-sm)", border: "1px solid hsl(var(--tf-border))", background: "hsl(var(--tf-surface))", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600, color: "hsl(var(--tf-text))", display: "flex", gap: "0.4rem", alignItems: "center" }}>
                        📥 CSV
                    </button>
                    <button onClick={() => setShowModal(true)} style={{ padding: "0.6rem 1.1rem", borderRadius: "var(--tf-radius-sm)", border: "none", background: "linear-gradient(135deg, hsl(var(--tf-primary)), hsl(var(--tf-accent)))", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: "0.875rem" }}>
                        + Nuovo Corso
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem" }}>
                {[
                    { label: "Totale corsi", val: filtered.length, icon: "📆" },
                    { label: "Futuri", val: futuri, icon: "🔜" },
                    { label: "Partecipanti tot.", val: filtered.reduce((s, c) => s + c.prenotati, 0), icon: "👥" },
                    { label: "Posti liberi", val: filtered.reduce((s, c) => s + (c.maxPartecipanti - c.prenotati), 0), icon: "🆓" },
                ].map(s => (
                    <div key={s.label} style={{ padding: "1rem 1.25rem", borderRadius: "var(--tf-radius-sm)", background: "hsl(var(--tf-surface))", border: "1px solid hsl(var(--tf-border))" }}>
                        <p style={{ fontSize: "1.2rem" }}>{s.icon}</p>
                        <p style={{ fontSize: "1.5rem", fontWeight: 800 }}>{s.val}</p>
                        <p style={{ fontSize: "0.72rem", color: "hsl(var(--tf-text-muted))" }}>{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Search */}
            <input placeholder="🔍 Cerca corso o coach..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ ...inputSt, maxWidth: 320 }} />

            {/* Tabella */}
            {filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem", color: "hsl(var(--tf-text-muted))" }}>
                    <div style={{ fontSize: "2rem" }}>📭</div><p>Nessun corso trovato</p>
                </div>
            ) : (
                <div style={{ borderRadius: "var(--tf-radius)", border: "1px solid hsl(var(--tf-border))", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                        <thead>
                            <tr style={{ background: "hsl(var(--tf-surface))", borderBottom: "1px solid hsl(var(--tf-border))" }}>
                                {["Corso", "Coach", "Data/Ora", "Durata", "Occupazione", "Prezzo", ""].map(h => (
                                    <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 700, fontSize: "0.8rem", color: "hsl(var(--tf-text-muted))", whiteSpace: "nowrap" }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((c, i) => {
                                const pct = c.maxPartecipanti > 0 ? Math.round((c.prenotati / c.maxPartecipanti) * 100) : 0;
                                const isFuture = new Date(c.dataora) > new Date();
                                return (
                                    <tr key={c.id} style={{ borderBottom: "1px solid hsl(var(--tf-border))", background: i % 2 === 0 ? "transparent" : "hsl(var(--tf-surface)/.4)" }}>
                                        <td style={{ padding: "0.75rem 1rem" }}>
                                            <p style={{ fontWeight: 600 }}>{c.nome}</p>
                                            <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.5rem", borderRadius: "999px", background: isFuture ? "hsl(var(--tf-accent)/.15)" : "hsl(var(--tf-border))", color: isFuture ? "hsl(var(--tf-accent))" : "hsl(var(--tf-text-muted))" }}>
                                                {isFuture ? "Prossimo" : "Passato"}
                                            </span>
                                        </td>
                                        <td style={{ padding: "0.75rem 1rem", color: "hsl(var(--tf-text-muted))" }}>{c.coach}</td>
                                        <td style={{ padding: "0.75rem 1rem", color: "hsl(var(--tf-text-muted))", whiteSpace: "nowrap" }}>{c.dataora ? new Date(c.dataora).toLocaleString("it-IT", { dateStyle: "short", timeStyle: "short" }) : "—"}</td>
                                        <td style={{ padding: "0.75rem 1rem" }}>{c.durata} min</td>
                                        <td style={{ padding: "0.75rem 1rem", minWidth: 140 }}>
                                            <div style={{ fontSize: "0.75rem", marginBottom: "0.3rem", color: "hsl(var(--tf-text-muted))" }}>{c.prenotati}/{c.maxPartecipanti} ({pct}%)</div>
                                            <div style={{ height: 6, borderRadius: 3, background: "hsl(var(--tf-border))", overflow: "hidden" }}>
                                                <div style={{ height: "100%", borderRadius: 3, width: `${pct}%`, background: pct >= 90 ? "hsl(var(--tf-danger))" : pct >= 70 ? "hsl(40 90% 55%)" : "hsl(145 60% 45%)", transition: "width 0.3s" }} />
                                            </div>
                                        </td>
                                        <td style={{ padding: "0.75rem 1rem", fontWeight: 700 }}>€ {c.prezzo.toFixed(2)}</td>
                                        <td style={{ padding: "0.75rem 1rem" }}>
                                            <button onClick={() => handleDelete(c.id)} disabled={deleting === c.id} style={{ padding: "0.3rem 0.7rem", borderRadius: "var(--tf-radius-sm)", border: "1px solid hsl(var(--tf-danger)/.4)", background: "transparent", color: "hsl(var(--tf-danger))", cursor: "pointer", fontSize: "0.75rem" }}>
                                                {deleting === c.id ? "…" : "🗑️"}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal Crea Corso */}
            {showModal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ background: "hsl(var(--tf-surface))", borderRadius: "var(--tf-radius)", padding: "2rem", width: "100%", maxWidth: 480, border: "1px solid hsl(var(--tf-border))" }}>
                        <h2 style={{ fontWeight: 800, marginBottom: "1.5rem" }}>+ Nuovo Corso</h2>
                        <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            <div><label style={labelSt}>Nome Corso *</label><input style={inputSt} required value={newCorso.nome} onChange={e => setNewCorso(p => ({ ...p, nome: e.target.value }))} /></div>
                            <div><label style={labelSt}>Data e Ora *</label><input style={inputSt} type="datetime-local" required value={newCorso.dataora} onChange={e => setNewCorso(p => ({ ...p, dataora: e.target.value }))} /></div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                                <div><label style={labelSt}>Durata (min)</label><input style={inputSt} type="number" min={15} value={newCorso.durata} onChange={e => setNewCorso(p => ({ ...p, durata: +e.target.value }))} /></div>
                                <div><label style={labelSt}>Max partecipanti</label><input style={inputSt} type="number" min={1} value={newCorso.maxPartecipanti} onChange={e => setNewCorso(p => ({ ...p, maxPartecipanti: +e.target.value }))} /></div>
                                <div><label style={labelSt}>Prezzo (€)</label><input style={inputSt} type="number" min={0} step="0.01" value={newCorso.prezzo} onChange={e => setNewCorso(p => ({ ...p, prezzo: +e.target.value }))} /></div>
                            </div>
                            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ padding: "0.6rem 1.2rem", borderRadius: "var(--tf-radius-sm)", border: "1px solid hsl(var(--tf-border))", background: "transparent", cursor: "pointer", color: "hsl(var(--tf-text-muted))" }}>Annulla</button>
                                <button type="submit" disabled={creating} style={{ padding: "0.6rem 1.5rem", borderRadius: "var(--tf-radius-sm)", border: "none", background: "linear-gradient(135deg, hsl(var(--tf-primary)), hsl(var(--tf-accent)))", color: "#fff", cursor: "pointer", fontWeight: 700 }}>{creating ? "Creazione…" : "Crea Corso"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
