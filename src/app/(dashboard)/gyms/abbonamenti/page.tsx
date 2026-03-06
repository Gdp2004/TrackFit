// ============================================================
// /gyms/abbonamenti – Lista abbonamenti per struttura + download CSV
// ============================================================
"use client";

import { useEffect, useState } from "react";
import { useRoleRedirect } from "@frontend/hooks/useRoleRedirect";
import { RuoloEnum } from "@backend/domain/model/enums";

interface AbbonatoRow {
    id: string;
    utente: string;
    email: string;
    piano: string;
    dataInizio: string;
    dataFine: string;
    stato: "ATTIVO" | "SCADUTO" | "SOSPESO";
    rinnovoAuto: boolean;
    prezzo: number;
}

const STATO_COLOR: Record<string, string> = {
    ATTIVO: "hsl(145 60% 45%)",
    SCADUTO: "hsl(var(--tf-danger))",
    SOSPESO: "hsl(40 90% 55%)",
};

function exportCSV(rows: AbbonatoRow[], strutturaNome: string) {
    const header = ["ID", "Utente", "Email", "Piano", "Data Inizio", "Data Fine", "Stato", "Rinnovo Auto", "Prezzo (€)"];
    const lines = rows.map(r => [
        r.id, r.utente, r.email, r.piano,
        r.dataInizio, r.dataFine, r.stato,
        r.rinnovoAuto ? "Sì" : "No",
        r.prezzo.toFixed(2),
    ].join(","));
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `abbonamenti-${strutturaNome}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

export default function AbbonamentiPage() {
    const { loading } = useRoleRedirect(RuoloEnum.GESTORE);
    const [rows, setRows] = useState<AbbonatoRow[]>([]);
    const [strutturaNome, setStrutturaNome] = useState("struttura");
    const [strutturaid, setStrutturaid] = useState<string | null>(null);
    const [loadingData, setLoadingData] = useState(true);
    const [filter, setFilter] = useState<"TUTTI" | "ATTIVO" | "SCADUTO" | "SOSPESO">("TUTTI");
    const [search, setSearch] = useState("");

    useEffect(() => {
        const init = async () => {
            try {
                // 1. Prendi struttura del gestore
                const meRes = await fetch("/api/gyms/me");
                if (!meRes.ok) return;
                const meData = await meRes.json();
                const s = meData?.data?.struttura ?? meData?.struttura;
                if (!s) return;
                setStrutturaNome(s.denominazione ?? "struttura");
                setStrutturaid(s.id);

                // 2. Fetch abbonamenti per struttura
                const abRes = await fetch(`/api/gyms/${s.id}/abbonamenti`);
                if (abRes.ok) {
                    const abData = await abRes.json();
                    const list = abData?.data ?? abData ?? [];
                    setRows(list.map((a: Record<string, unknown>) => ({
                        id: a.id as string,
                        utente: `${(a.user as Record<string, unknown>)?.nome ?? ""} ${(a.user as Record<string, unknown>)?.cognome ?? ""}`.trim() || "—",
                        email: (a.user as Record<string, unknown>)?.email as string ?? "—",
                        piano: (a.tipo as Record<string, unknown>)?.nome as string ?? "—",
                        dataInizio: a.datainizio as string ?? "",
                        dataFine: a.datafine as string ?? "",
                        stato: (a.stato as string ?? "ATTIVO").toUpperCase() as AbbonatoRow["stato"],
                        rinnovoAuto: !!(a.rinnovoautomatico),
                        prezzo: Number((a.tipo as Record<string, unknown>)?.prezzo ?? 0),
                    })));
                }
            } finally { setLoadingData(false); }
        };
        init();
    }, []);

    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = async (id: string, utenteNome: string) => {
        if (!strutturaid) return;
        if (!window.confirm(`Sei sicuro di voler eliminare l'abbonamento di ${utenteNome}?`)) return;

        setDeletingId(id);
        try {
            const res = await fetch(`/api/gyms/${strutturaid}/abbonamenti?abbonamentoid=${id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setRows(prev => prev.filter(r => r.id !== id));
            } else {
                const data = await res.json();
                alert(data.error || "Errore durante l'eliminazione");
            }
        } catch (error) {
            console.error(error);
            alert("Errore di rete");
        } finally {
            setDeletingId(null);
        }
    };

    if (loading || loadingData) return (
        <div style={{ textAlign: "center", padding: "4rem" }}>
            <div style={{ fontSize: "2rem" }}>⏳</div><p>Caricamento...</p>
        </div>
    );

    const filtered = rows
        .filter(r => filter === "TUTTI" || r.stato === filter)
        .filter(r => !search || r.utente.toLowerCase().includes(search.toLowerCase()) || r.email.toLowerCase().includes(search.toLowerCase()));

    const totale = filtered.reduce((s, r) => s + r.prezzo, 0);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                    <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.25rem" }}>💳 Abbonamenti</h1>
                    <p style={{ fontSize: "0.875rem", color: "hsl(var(--tf-text-muted))" }}>
                        Tutti gli abbonamenti attivi per <strong>{strutturaNome}</strong>
                    </p>
                </div>
                <button
                    onClick={() => exportCSV(filtered, strutturaNome)}
                    style={{
                        padding: "0.6rem 1.25rem", borderRadius: "var(--tf-radius-sm)",
                        border: "1px solid hsl(var(--tf-border))", background: "hsl(var(--tf-surface))",
                        cursor: "pointer", fontSize: "0.875rem", fontWeight: 600,
                        display: "flex", alignItems: "center", gap: "0.5rem",
                        color: "hsl(var(--tf-text))",
                    }}
                >
                    📥 Scarica CSV
                </button>
            </div>

            {/* Stats rapide */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem" }}>
                {[
                    { label: "Totale", val: rows.length, icon: "📋" },
                    { label: "Attivi", val: rows.filter(r => r.stato === "ATTIVO").length, icon: "✅" },
                    { label: "Scaduti", val: rows.filter(r => r.stato === "SCADUTO").length, icon: "⏰" },
                    { label: "Valore (€)", val: rows.filter(r => r.stato === "ATTIVO").reduce((s, r) => s + r.prezzo, 0).toFixed(0), icon: "💰" },
                ].map(s => (
                    <div key={s.label} style={{
                        padding: "1rem 1.25rem", borderRadius: "var(--tf-radius-sm)",
                        background: "hsl(var(--tf-surface))", border: "1px solid hsl(var(--tf-border))",
                    }}>
                        <p style={{ fontSize: "1.25rem" }}>{s.icon}</p>
                        <p style={{ fontSize: "1.5rem", fontWeight: 800 }}>{s.val}</p>
                        <p style={{ fontSize: "0.75rem", color: "hsl(var(--tf-text-muted))" }}>{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Filtri */}
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
                <input
                    placeholder="🔍 Cerca utente o email..."
                    value={search} onChange={e => setSearch(e.target.value)}
                    style={{
                        padding: "0.5rem 0.85rem", borderRadius: "var(--tf-radius-sm)",
                        border: "1px solid hsl(var(--tf-border))", background: "hsl(var(--tf-bg))",
                        color: "hsl(var(--tf-text))", fontSize: "0.875rem", minWidth: 240,
                    }}
                />
                {(["TUTTI", "ATTIVO", "SCADUTO", "SOSPESO"] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)} style={{
                        padding: "0.45rem 1rem", borderRadius: "999px", border: "none",
                        cursor: "pointer", fontSize: "0.8rem", fontWeight: 600,
                        background: filter === f ? "hsl(var(--tf-primary))" : "hsl(var(--tf-surface))",
                        color: filter === f ? "#fff" : "hsl(var(--tf-text-muted))",
                        transition: "all 0.15s",
                    }}>{f}</button>
                ))}
            </div>

            {/* Tabella */}
            {filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem", color: "hsl(var(--tf-text-muted))" }}>
                    <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📭</div>
                    <p>Nessun abbonamento trovato</p>
                </div>
            ) : (
                <div style={{ borderRadius: "var(--tf-radius)", border: "1px solid hsl(var(--tf-border))", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                        <thead>
                            <tr style={{ background: "hsl(var(--tf-surface))", borderBottom: "1px solid hsl(var(--tf-border))" }}>
                                {["Utente", "Piano", "Inizio", "Scadenza", "Rinnovo", "Stato", "Prezzo", ""].map((h, i) => (
                                    <th key={i} style={{ padding: "0.75rem 1rem", textAlign: h === "" ? "right" : "left", fontWeight: 700, fontSize: "0.8rem", color: "hsl(var(--tf-text-muted))", whiteSpace: "nowrap" }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((r, i) => (
                                <tr key={r.id} style={{ borderBottom: "1px solid hsl(var(--tf-border))", background: i % 2 === 0 ? "transparent" : "hsl(var(--tf-surface)/.4)" }}>
                                    <td style={{ padding: "0.75rem 1rem" }}>
                                        <p style={{ fontWeight: 600 }}>{r.utente}</p>
                                        <p style={{ fontSize: "0.75rem", color: "hsl(var(--tf-text-muted))" }}>{r.email}</p>
                                    </td>
                                    <td style={{ padding: "0.75rem 1rem" }}>{r.piano}</td>
                                    <td style={{ padding: "0.75rem 1rem", color: "hsl(var(--tf-text-muted))" }}>{r.dataInizio ? new Date(r.dataInizio).toLocaleDateString("it-IT") : "—"}</td>
                                    <td style={{ padding: "0.75rem 1rem", color: "hsl(var(--tf-text-muted))" }}>{r.dataFine ? new Date(r.dataFine).toLocaleDateString("it-IT") : "—"}</td>
                                    <td style={{ padding: "0.75rem 1rem" }}>
                                        <span style={{ fontSize: "0.75rem", color: r.rinnovoAuto ? "hsl(145 60% 45%)" : "hsl(var(--tf-text-muted))" }}>
                                            {r.rinnovoAuto ? "✅ Auto" : "—"}
                                        </span>
                                    </td>
                                    <td style={{ padding: "0.75rem 1rem" }}>
                                        <span style={{
                                            padding: "0.25rem 0.6rem", borderRadius: "999px", fontSize: "0.72rem", fontWeight: 700,
                                            background: STATO_COLOR[r.stato] + "22", color: STATO_COLOR[r.stato],
                                        }}>{r.stato}</span>
                                    </td>
                                    <td style={{ padding: "0.75rem 1rem", fontWeight: 700 }}>€ {r.prezzo.toFixed(2)}</td>
                                    <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>
                                        <button
                                            onClick={() => handleDelete(r.id, r.utente)}
                                            style={{
                                                background: "transparent", border: "none", cursor: "pointer",
                                                color: "hsl(var(--tf-danger))", padding: "0.4rem",
                                                borderRadius: "var(--tf-radius-sm)", transition: "background 0.15s",
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = "hsl(var(--tf-danger)/.1)"}
                                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                            title="Elimina abbonamento"
                                        >
                                            🗑️
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr style={{ background: "hsl(var(--tf-surface))", borderTop: "2px solid hsl(var(--tf-border))" }}>
                                <td colSpan={6} style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "hsl(var(--tf-text-muted))", fontSize: "0.8rem" }}>
                                    Totale ({filtered.length} abbonamenti)
                                </td>
                                <td colSpan={2} style={{ padding: "0.75rem 1rem", fontWeight: 800, color: "hsl(var(--tf-primary))", textAlign: "right" }}>
                                    € {totale.toFixed(2)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
        </div>
    );
}
