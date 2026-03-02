// ============================================================
// /gyms/struttura  – Gestione Struttura Palestra
// Tab 1: La mia struttura (crea se non esiste, altrimenti modifica)
// Tab 2: Cerca struttura (ricerca tra tutte le palestre)
// ============================================================
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRoleRedirect } from "@frontend/hooks/useRoleRedirect";
import { RuoloEnum } from "@backend/domain/model/enums";
import type { Struttura } from "@backend/domain/model/types";

type Tab = "mia" | "cerca" | "crea";

interface GymResult {
    id: string;
    denominazione: string;
    indirizzo: string;
    telefono?: string;
    email?: string;
    sito?: string;
    stato: string;
    piva: string;
}

export default function StrutturaPage() {
    const { loading } = useRoleRedirect(RuoloEnum.GESTORE);
    const [tab, setTab] = useState<Tab>("mia");

    // ── Stato la mia struttura ──────────────────────────────────────
    const [struttura, setStruttura] = useState<Struttura | null>(null);
    const [loadingData, setLoadingData] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState<"view" | "edit" | "create">("view");

    const emptyForm = {
        denominazione: "", indirizzo: "", telefono: "",
        email: "", sito: "", descrizione: "",
        stato: "Attiva" as "Attiva" | "Sospesa",
        piva: "", cun: "",
    };
    const [form, setForm] = useState(emptyForm);

    // ── Stato cerca ─────────────────────────────────────────────────
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<GymResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [searched, setSearched] = useState(false);

    const f = (field: string) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
            setForm(prev => ({ ...prev, [field]: e.target.value }));

    // Carica la struttura del gestore
    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch("/api/gyms/me");
                if (!res.ok) return;
                const data = await res.json();
                const s = data?.struttura ?? data?.data?.struttura ?? null;
                if (s) {
                    setStruttura(s);
                    setForm({
                        denominazione: s.denominazione ?? "",
                        indirizzo: s.indirizzo ?? "",
                        telefono: s.telefono ?? "",
                        email: s.email ?? "",
                        sito: s.sito ?? "",
                        descrizione: s.descrizione ?? "",
                        stato: s.stato ?? "Attiva",
                        piva: s.piva ?? "",
                        cun: s.cun ?? "",
                    });
                }
            } finally { setLoadingData(false); }
        };
        load();
    }, []);

    // Ricerca strutture
    const handleSearch = useCallback(async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!searchQuery.trim()) return;
        setSearching(true); setSearched(false);
        try {
            const res = await fetch(`/api/gyms?search=${encodeURIComponent(searchQuery)}`);
            if (!res.ok) { setSearchResults([]); return; }
            const data = await res.json();
            setSearchResults(data?.data ?? data ?? []);
        } finally { setSearching(false); setSearched(true); }
    }, [searchQuery]);

    // Salva modifiche struttura (PUT) o crea nuova (POST)
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null); setSaving(true);
        try {
            if (struttura) {
                // UPDATE
                const res = await fetch("/api/gyms/me", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        denominazione: form.denominazione,
                        indirizzo: form.indirizzo,
                        telefono: form.telefono,
                        email: form.email,
                        sito: form.sito,
                        descrizione: form.descrizione,
                        stato: form.stato,
                    }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error ?? "Errore nel salvataggio");
                setStruttura(data?.data ?? data);
                setMode("view");
            } else {
                // CREATE
                const res = await fetch("/api/gyms", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        piva: form.piva,
                        cun: form.cun,
                        denominazione: form.denominazione,
                        indirizzo: form.indirizzo,
                        telefono: form.telefono,
                        email: form.email,
                        sito: form.sito,
                        descrizione: form.descrizione,
                    }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error ?? "Errore nella creazione");
                setStruttura(data?.data ?? data);
                setMode("view");
            }
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally { setSaving(false); }
    };

    if (loading || loadingData) return (
        <div style={{ textAlign: "center", padding: "4rem", color: "hsl(var(--tf-text-muted))" }}>
            <div style={{ fontSize: "2rem" }}>⏳</div><p>Caricamento...</p>
        </div>
    );

    const inputStyle = {
        width: "100%", padding: "0.65rem 0.85rem",
        borderRadius: "var(--tf-radius-sm)",
        border: "1px solid hsl(var(--tf-border))",
        background: "hsl(var(--tf-bg))", color: "hsl(var(--tf-text))",
        fontSize: "0.875rem", outline: "none", boxSizing: "border-box" as const,
    };
    const labelStyle: React.CSSProperties = {
        fontSize: "0.8rem", fontWeight: 600,
        color: "hsl(var(--tf-text-muted))", display: "block", marginBottom: "0.4rem",
    };

    // ── Tab buttons ──────────────────────────────────────────────────
    const TabBtn = ({ id, label, icon }: { id: Tab; label: string; icon: string }) => (
        <button
            onClick={() => setTab(id)}
            style={{
                padding: "0.65rem 1.5rem", border: "none", cursor: "pointer",
                borderBottom: `2px solid ${tab === id ? "hsl(var(--tf-primary))" : "transparent"}`,
                background: "transparent",
                color: tab === id ? "hsl(var(--tf-primary))" : "hsl(var(--tf-text-muted))",
                fontWeight: tab === id ? 700 : 500, fontSize: "0.9rem",
                transition: "all 0.15s",
                display: "flex", alignItems: "center", gap: "0.4rem",
            }}
        >{icon} {label}</button>
    );

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Header */}
            <div>
                <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.25rem" }}>🏋️ Struttura</h1>
                <p style={{ fontSize: "0.875rem", color: "hsl(var(--tf-text-muted))" }}>
                    Gestisci la tua palestra o cerca altre strutture
                </p>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid hsl(var(--tf-border))", gap: "0" }}>
                <TabBtn id="mia" label="La mia struttura" icon="🏠" />
                <TabBtn id="cerca" label="Cerca struttura" icon="🔍" />
                <TabBtn id="crea" label="Crea struttura" icon="🏗️" />
            </div>

            {/* ───────────── TAB: LA MIA STRUTTURA ───────────── */}
            {tab === "mia" && (
                <>
                    {/* Nessuna struttura → CTA crea */}
                    {!struttura && mode === "view" && (
                        <div style={{ padding: "2.5rem", textAlign: "center", borderRadius: "var(--tf-radius)", border: "2px dashed hsl(var(--tf-border))" }}>
                            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🏗️</div>
                            <p style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: "0.5rem" }}>
                                Registra la tua palestra
                            </p>
                            <p style={{ fontSize: "0.875rem", color: "hsl(var(--tf-text-muted))", marginBottom: "1.5rem" }}>
                                Compila i dati per creare la tua struttura nel sistema TrackFit.
                            </p>
                            <button onClick={() => setMode("create")} style={{
                                padding: "0.75rem 2rem", borderRadius: "var(--tf-radius-sm)", border: "none",
                                cursor: "pointer", fontWeight: 700, fontSize: "0.9rem", color: "#fff",
                                background: "linear-gradient(135deg, hsl(145 60% 45%), hsl(var(--tf-primary)))",
                            }}>+ Crea Struttura</button>
                        </div>
                    )}

                    {/* Struttura esistente in modalità VIEW */}
                    {struttura && mode === "view" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            {/* Card info principale */}
                            <div style={{
                                padding: "1.5rem", borderRadius: "var(--tf-radius)",
                                background: "hsl(var(--tf-surface))", border: "1px solid hsl(var(--tf-border))",
                                display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem",
                            }}>
                                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                                    <div style={{
                                        width: 56, height: 56, borderRadius: "var(--tf-radius-sm)", flexShrink: 0,
                                        background: "linear-gradient(135deg, hsl(145 60% 45%), hsl(var(--tf-primary)))",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: "1.75rem",
                                    }}>🏋️</div>
                                    <div>
                                        <h2 style={{ fontWeight: 800, fontSize: "1.15rem" }}>{struttura.denominazione}</h2>
                                        <p style={{ fontSize: "0.85rem", color: "hsl(var(--tf-text-muted))", marginTop: 2 }}>📍 {struttura.indirizzo}</p>
                                        {struttura.telefono && <p style={{ fontSize: "0.82rem", color: "hsl(var(--tf-text-muted))" }}>📞 {struttura.telefono}</p>}
                                        {struttura.email && <p style={{ fontSize: "0.82rem", color: "hsl(var(--tf-text-muted))" }}>✉️ {struttura.email}</p>}
                                    </div>
                                </div>
                                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexShrink: 0 }}>
                                    <span style={{
                                        padding: "0.3rem 0.75rem", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700,
                                        background: struttura.stato === "Attiva" ? "hsl(145 60% 45%/.15)" : "hsl(var(--tf-danger)/.1)",
                                        color: struttura.stato === "Attiva" ? "hsl(145 60% 45%)" : "hsl(var(--tf-danger))",
                                    }}>{struttura.stato ?? "Attiva"}</span>
                                    <button onClick={() => setMode("edit")} style={{
                                        padding: "0.5rem 1.1rem", borderRadius: "var(--tf-radius-sm)",
                                        border: "1px solid hsl(var(--tf-border))",
                                        background: "hsl(var(--tf-bg))", cursor: "pointer",
                                        fontSize: "0.875rem", fontWeight: 600, color: "hsl(var(--tf-text))",
                                    }}>✏️ Modifica</button>
                                </div>
                            </div>

                            {/* Dettagli aggiuntivi */}
                            <div style={{
                                display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem",
                                padding: "1.25rem", borderRadius: "var(--tf-radius)",
                                background: "hsl(var(--tf-surface))", border: "1px solid hsl(var(--tf-border))",
                            }}>
                                {[
                                    { label: "P.IVA", val: struttura.piva },
                                    { label: "CUN", val: struttura.cun },
                                    { label: "Sito web", val: struttura.sito || "—" },
                                    { label: "Descrizione", val: struttura.descrizione || "—" },
                                ].map(item => (
                                    <div key={item.label}>
                                        <p style={{ ...labelStyle }}>{item.label}</p>
                                        <p style={{ fontSize: "0.875rem", fontFamily: item.label === "P.IVA" || item.label === "CUN" ? "monospace" : undefined }}>
                                            {item.val}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Form creazione / modifica */}
                    {(mode === "create" || mode === "edit") && (
                        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <p style={{ fontWeight: 700, fontSize: "1rem" }}>
                                    {mode === "create" ? "🏗️ Nuova struttura" : "✏️ Modifica struttura"}
                                </p>
                                <button type="button" onClick={() => { setMode("view"); setError(null); }} style={{
                                    padding: "0.4rem 0.9rem", borderRadius: "var(--tf-radius-sm)",
                                    border: "1px solid hsl(var(--tf-border))", background: "transparent",
                                    cursor: "pointer", fontSize: "0.8rem", color: "hsl(var(--tf-text-muted))",
                                }}>✕ Annulla</button>
                            </div>

                            {/* P.IVA / CUN solo in creazione */}
                            {mode === "create" && (
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                    <div>
                                        <label style={labelStyle}>P.IVA * (11 cifre)</label>
                                        <input style={inputStyle} required maxLength={11} minLength={11} placeholder="12345678901" value={form.piva} onChange={f("piva")} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>CUN *</label>
                                        <input style={inputStyle} required placeholder="ABC1234" value={form.cun} onChange={f("cun")} />
                                    </div>
                                </div>
                            )}
                            {mode === "edit" && struttura && (
                                <div style={{ padding: "0.875rem 1rem", borderRadius: "var(--tf-radius-sm)", background: "hsl(var(--tf-surface))", border: "1px solid hsl(var(--tf-border))", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                                    <div><p style={labelStyle}>P.IVA (non modificabile)</p><p style={{ fontFamily: "monospace", fontSize: "0.875rem", color: "hsl(var(--tf-text-muted))" }}>{struttura.piva}</p></div>
                                    <div><p style={labelStyle}>CUN (non modificabile)</p><p style={{ fontFamily: "monospace", fontSize: "0.875rem", color: "hsl(var(--tf-text-muted))" }}>{struttura.cun}</p></div>
                                </div>
                            )}

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                <div><label style={labelStyle}>Nome Struttura *</label><input style={inputStyle} required value={form.denominazione} onChange={f("denominazione")} /></div>
                                <div>
                                    <label style={labelStyle}>Stato</label>
                                    <select style={inputStyle} value={form.stato} onChange={f("stato")}>
                                        <option value="Attiva">Attiva</option>
                                        <option value="Sospesa">Sospesa</option>
                                    </select>
                                </div>
                            </div>

                            <div><label style={labelStyle}>Indirizzo *</label><input style={inputStyle} required placeholder="Via Roma 1, Milano" value={form.indirizzo} onChange={f("indirizzo")} /></div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                <div><label style={labelStyle}>Telefono</label><input style={inputStyle} type="tel" placeholder="+39 02 1234567" value={form.telefono} onChange={f("telefono")} /></div>
                                <div><label style={labelStyle}>Email</label><input style={inputStyle} type="email" placeholder="info@palestra.it" value={form.email} onChange={f("email")} /></div>
                            </div>

                            <div><label style={labelStyle}>Sito Web</label><input style={inputStyle} type="url" placeholder="https://www.palestra.it" value={form.sito} onChange={f("sito")} /></div>

                            <div>
                                <label style={labelStyle}>Descrizione</label>
                                <textarea rows={4} value={form.descrizione} onChange={f("descrizione")}
                                    placeholder="Descrivi la tua palestra, i servizi offerti, gli orari..."
                                    style={{ ...inputStyle, resize: "vertical" }} />
                            </div>

                            {error && <p style={{ padding: "0.75rem", borderRadius: "var(--tf-radius-sm)", background: "hsl(var(--tf-danger)/.1)", color: "hsl(var(--tf-danger))", fontSize: "0.8rem" }}>⚠️ {error}</p>}
                            {saved && <p style={{ padding: "0.75rem", borderRadius: "var(--tf-radius-sm)", background: "hsl(145 60% 45%/.12)", color: "hsl(145 60% 45%)", fontSize: "0.8rem", fontWeight: 600 }}>✅ Salvato con successo!</p>}

                            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                <button type="submit" disabled={saving} style={{
                                    padding: "0.7rem 2rem", borderRadius: "var(--tf-radius-sm)", border: "none",
                                    background: "linear-gradient(135deg, hsl(145 60% 45%), hsl(var(--tf-primary)))",
                                    color: "#fff", cursor: saving ? "not-allowed" : "pointer",
                                    fontSize: "0.9rem", fontWeight: 700, opacity: saving ? 0.7 : 1,
                                }}>
                                    {saving ? "Salvataggio…" : mode === "create" ? "🏗️ Crea Struttura" : "💾 Salva Modifiche"}
                                </button>
                            </div>
                        </form>
                    )}
                </>
            )}

            {/* ───────────── TAB: CERCA STRUTTURA ───────────── */}
            {tab === "cerca" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.75rem" }}>
                        <input
                            type="search"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Cerca per nome, città o indirizzo..."
                            style={{
                                flex: 1, padding: "0.7rem 1rem",
                                borderRadius: "var(--tf-radius-sm)",
                                border: "1px solid hsl(var(--tf-border))",
                                background: "hsl(var(--tf-bg))", color: "hsl(var(--tf-text))",
                                fontSize: "0.9rem", outline: "none",
                            }}
                        />
                        <button type="submit" disabled={searching} style={{
                            padding: "0.7rem 1.5rem", borderRadius: "var(--tf-radius-sm)", border: "none",
                            background: "linear-gradient(135deg, hsl(var(--tf-primary)), hsl(var(--tf-accent)))",
                            color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: "0.9rem",
                            opacity: searching ? 0.7 : 1, whiteSpace: "nowrap",
                        }}>
                            {searching ? "Ricerca…" : "🔍 Cerca"}
                        </button>
                    </form>

                    {searching && (
                        <div style={{ textAlign: "center", padding: "2rem", color: "hsl(var(--tf-text-muted))" }}>
                            <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>🔍</div>
                            <p>Ricerca in corso...</p>
                        </div>
                    )}

                    {searched && !searching && searchResults.length === 0 && (
                        <div style={{ textAlign: "center", padding: "2rem", color: "hsl(var(--tf-text-muted))" }}>
                            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📭</div>
                            <p>Nessuna struttura trovata per &ldquo;{searchQuery}&rdquo;</p>
                        </div>
                    )}

                    {searchResults.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            <p style={{ fontSize: "0.8rem", color: "hsl(var(--tf-text-muted))" }}>
                                {searchResults.length} risultat{searchResults.length === 1 ? "o" : "i"} per &ldquo;{searchQuery}&rdquo;
                            </p>
                            {searchResults.map(gym => (
                                <div key={gym.id} style={{
                                    padding: "1.25rem", borderRadius: "var(--tf-radius)",
                                    background: "hsl(var(--tf-surface))", border: "1px solid hsl(var(--tf-border))",
                                    display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem",
                                }}>
                                    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                                        <div style={{
                                            width: 44, height: 44, borderRadius: "var(--tf-radius-sm)", flexShrink: 0,
                                            background: "hsl(var(--tf-primary)/.12)",
                                            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem",
                                        }}>🏋️</div>
                                        <div>
                                            <p style={{ fontWeight: 700, fontSize: "0.95rem" }}>{gym.denominazione}</p>
                                            <p style={{ fontSize: "0.8rem", color: "hsl(var(--tf-text-muted))", marginTop: 2 }}>
                                                📍 {gym.indirizzo}
                                            </p>
                                            <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.3rem" }}>
                                                {gym.telefono && <span style={{ fontSize: "0.76rem", color: "hsl(var(--tf-text-muted))" }}>📞 {gym.telefono}</span>}
                                                {gym.email && <span style={{ fontSize: "0.76rem", color: "hsl(var(--tf-text-muted))" }}>✉️ {gym.email}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.4rem", flexShrink: 0 }}>
                                        <span style={{
                                            padding: "0.25rem 0.6rem", borderRadius: "999px", fontSize: "0.72rem", fontWeight: 700,
                                            background: gym.stato === "Attiva" ? "hsl(145 60% 45%/.15)" : "hsl(var(--tf-danger)/.1)",
                                            color: gym.stato === "Attiva" ? "hsl(145 60% 45%)" : "hsl(var(--tf-danger))",
                                        }}>{gym.stato}</span>
                                        <span style={{ fontSize: "0.72rem", fontFamily: "monospace", color: "hsl(var(--tf-text-muted))" }}>
                                            {gym.piva}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!searched && !searching && (
                        <div style={{ textAlign: "center", padding: "3rem", color: "hsl(var(--tf-text-muted))" }}>
                            <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🔎</div>
                            <p style={{ fontWeight: 600 }}>Cerca qualsiasi palestra nel sistema</p>
                            <p style={{ fontSize: "0.875rem", marginTop: "0.3rem" }}>
                                Inserisci il nome, la città o l&apos;indirizzo per trovare strutture registrate
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* ───────────── TAB: CREA STRUTTURA ───────────── */}
            {tab === "crea" && (
                <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <p style={{ fontSize: "0.875rem", color: "hsl(var(--tf-text-muted))" }}>
                        Compila i campi per registrare una nuova struttura nel sistema.
                    </p>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        <div>
                            <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "hsl(var(--tf-text-muted))", display: "block", marginBottom: "0.4rem" }}>P.IVA * (11 cifre)</label>
                            <input style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "var(--tf-radius-sm)", border: "1px solid hsl(var(--tf-border))", background: "hsl(var(--tf-bg))", color: "hsl(var(--tf-text))", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" as const }}
                                required maxLength={11} minLength={11} placeholder="12345678901" pattern="\d{11}" title="11 cifre numeriche"
                                value={form.piva} onChange={f("piva")} />
                        </div>
                        <div>
                            <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "hsl(var(--tf-text-muted))", display: "block", marginBottom: "0.4rem" }}>CUN *</label>
                            <input style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "var(--tf-radius-sm)", border: "1px solid hsl(var(--tf-border))", background: "hsl(var(--tf-bg))", color: "hsl(var(--tf-text))", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" as const }}
                                required placeholder="ABC1234" value={form.cun} onChange={f("cun")} />
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        <div>
                            <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "hsl(var(--tf-text-muted))", display: "block", marginBottom: "0.4rem" }}>Nome Struttura *</label>
                            <input style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "var(--tf-radius-sm)", border: "1px solid hsl(var(--tf-border))", background: "hsl(var(--tf-bg))", color: "hsl(var(--tf-text))", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" as const }}
                                required placeholder="Es. Palestra Olimpo" value={form.denominazione} onChange={f("denominazione")} />
                        </div>
                        <div>
                            <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "hsl(var(--tf-text-muted))", display: "block", marginBottom: "0.4rem" }}>Stato</label>
                            <select style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "var(--tf-radius-sm)", border: "1px solid hsl(var(--tf-border))", background: "hsl(var(--tf-bg))", color: "hsl(var(--tf-text))", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" as const }}
                                value={form.stato} onChange={f("stato")}>
                                <option value="Attiva">Attiva</option>
                                <option value="Sospesa">Sospesa</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "hsl(var(--tf-text-muted))", display: "block", marginBottom: "0.4rem" }}>Indirizzo *</label>
                        <input style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "var(--tf-radius-sm)", border: "1px solid hsl(var(--tf-border))", background: "hsl(var(--tf-bg))", color: "hsl(var(--tf-text))", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" as const }}
                            required placeholder="Via Roma 1, Milano" value={form.indirizzo} onChange={f("indirizzo")} />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        <div>
                            <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "hsl(var(--tf-text-muted))", display: "block", marginBottom: "0.4rem" }}>Telefono</label>
                            <input style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "var(--tf-radius-sm)", border: "1px solid hsl(var(--tf-border))", background: "hsl(var(--tf-bg))", color: "hsl(var(--tf-text))", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" as const }}
                                type="tel" placeholder="+39 02 1234567" value={form.telefono} onChange={f("telefono")} />
                        </div>
                        <div>
                            <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "hsl(var(--tf-text-muted))", display: "block", marginBottom: "0.4rem" }}>Email</label>
                            <input style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "var(--tf-radius-sm)", border: "1px solid hsl(var(--tf-border))", background: "hsl(var(--tf-bg))", color: "hsl(var(--tf-text))", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" as const }}
                                type="email" placeholder="info@palestra.it" value={form.email} onChange={f("email")} />
                        </div>
                    </div>

                    <div>
                        <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "hsl(var(--tf-text-muted))", display: "block", marginBottom: "0.4rem" }}>Sito Web</label>
                        <input style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "var(--tf-radius-sm)", border: "1px solid hsl(var(--tf-border))", background: "hsl(var(--tf-bg))", color: "hsl(var(--tf-text))", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" as const }}
                            type="url" placeholder="https://www.palestra.it" value={form.sito} onChange={f("sito")} />
                    </div>

                    <div>
                        <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "hsl(var(--tf-text-muted))", display: "block", marginBottom: "0.4rem" }}>Descrizione</label>
                        <textarea rows={4} placeholder="Servizi, orari, attrezzature..." value={form.descrizione} onChange={f("descrizione")}
                            style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "var(--tf-radius-sm)", border: "1px solid hsl(var(--tf-border))", background: "hsl(var(--tf-bg))", color: "hsl(var(--tf-text))", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" as const, resize: "vertical" }} />
                    </div>

                    {error && <p style={{ padding: "0.75rem", borderRadius: "var(--tf-radius-sm)", background: "hsl(var(--tf-danger)/.1)", color: "hsl(var(--tf-danger))", fontSize: "0.8rem" }}>⚠️ {error}</p>}
                    {saved && <p style={{ padding: "0.75rem", borderRadius: "var(--tf-radius-sm)", background: "hsl(145 60% 45%/.12)", color: "hsl(145 60% 45%)", fontSize: "0.8rem", fontWeight: 600 }}>✅ Struttura creata con successo!</p>}

                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <button type="submit" disabled={saving} style={{
                            padding: "0.75rem 2.5rem", borderRadius: "var(--tf-radius-sm)", border: "none",
                            background: "linear-gradient(135deg, hsl(145 60% 45%), hsl(var(--tf-primary)))",
                            color: "#fff", cursor: saving ? "not-allowed" : "pointer",
                            fontSize: "0.9rem", fontWeight: 700, opacity: saving ? 0.7 : 1,
                        }}>
                            {saving ? "Creazione…" : "🏗️ Crea Struttura"}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
