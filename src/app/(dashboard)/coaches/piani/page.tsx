// ============================================================
// /coaches/piani – Piani Allenamento (Sessioni del Coach)
// Visibile solo ai COACH
// ============================================================
"use client";

import { useEffect, useCallback, useState } from "react";
import { useRoleRedirect } from "@frontend/hooks/useRoleRedirect";
import { RuoloEnum } from "@backend/domain/model/enums";
import type { PrenotazioneWithUser } from "@backend/domain/model/types";
import { supabaseBrowser } from "@frontend/lib/supabase-browser";

type StatoColor = Record<string, string>;
const STATO_COLOR: StatoColor = {
    CONFERMATA: "hsl(145 60% 45%)",
    IN_ATTESA: "hsl(45 90% 55%)",
    CANCELLATA: "hsl(var(--tf-danger))",
};
const STATO_BG: StatoColor = {
    CONFERMATA: "hsl(145 60% 45%/.12)",
    IN_ATTESA: "hsl(45 90% 55%/.12)",
    CANCELLATA: "hsl(var(--tf-danger)/.12)",
};

function AnnullaModal({ sessioneId, onClose, onSuccess }: { sessioneId: string; onClose: () => void; onSuccess: () => void }) {
    const [motivazione, setMotivazione] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const meRes = await fetch("/api/coaches/me");
            const meData = await meRes.json();
            const coachId = meData.coach?.id;
            if (!coachId) throw new Error("Coach non trovato");
            const res = await fetch(`/api/coaches/${coachId}/prenotazioni?sessioneid=${sessioneId}&motivazione=${encodeURIComponent(motivazione)}`, { method: "DELETE" });
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
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
            <div style={{ background: "hsl(var(--tf-surface))", border: "1px solid hsl(var(--tf-border))", borderRadius: "var(--tf-radius)", padding: "2rem", width: "100%", maxWidth: 440 }}>
                <h2 style={{ fontWeight: 800, fontSize: "1.25rem", marginBottom: "1.25rem", color: "hsl(var(--tf-danger))" }}>🗑️ Annulla Sessione</h2>
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div>
                        <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "hsl(var(--tf-text-muted))", display: "block", marginBottom: "0.4rem" }}>Motivazione *</label>
                        <textarea value={motivazione} onChange={e => setMotivazione(e.target.value)} required placeholder="Es. Impegno improvviso" rows={3}
                            style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "var(--tf-radius-sm)", border: "1px solid hsl(var(--tf-border))", background: "hsl(var(--tf-bg))", color: "hsl(var(--tf-text))", fontSize: "0.875rem", resize: "vertical" }} />
                    </div>
                    {error && <p style={{ padding: "0.6rem", borderRadius: "6px", background: "hsl(var(--tf-danger)/.1)", color: "hsl(var(--tf-danger))", fontSize: "0.8rem" }}>⚠️ {error}</p>}
                    <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                        <button type="button" onClick={onClose} style={{ padding: "0.6rem 1.25rem", borderRadius: "var(--tf-radius-sm)", border: "1px solid hsl(var(--tf-border))", background: "transparent", color: "hsl(var(--tf-text))", cursor: "pointer", fontSize: "0.875rem" }}>Annulla</button>
                        <button type="submit" disabled={loading} style={{ padding: "0.6rem 1.5rem", borderRadius: "var(--tf-radius-sm)", border: "none", background: "hsl(var(--tf-danger))", color: "#fff", cursor: loading ? "not-allowed" : "pointer", fontSize: "0.875rem", fontWeight: 700, opacity: loading ? 0.7 : 1 }}>
                            {loading ? "Eliminando…" : "Conferma Eliminazione"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function SessioneCard({ prenotazione, onModifica, onAnnulla, onDettagli }: { prenotazione: PrenotazioneWithUser; onModifica: (id: string) => void; onAnnulla: (id: string) => void; onDettagli: (id: string) => void }) {
    const data = new Date(prenotazione.dataora);
    const ora48h = Date.now() + 48 * 60 * 60 * 1000;
    const cancellabile = prenotazione.stato !== "CANCELLATA" && data.getTime() > ora48h;
    const modificabile = prenotazione.stato === "CONFERMATA" && data.getTime() > ora48h;
    const athleteName = `${prenotazione.user.nome} ${prenotazione.user.cognome}`;

    return (
        <div onClick={() => onDettagli(prenotazione.id)}
            style={{ padding: "1.25rem", borderRadius: "var(--tf-radius)", background: "hsl(var(--tf-surface))", border: "1px solid hsl(var(--tf-border))", cursor: "pointer", transition: "transform 0.2s, border-color 0.2s", opacity: prenotazione.stato === "CANCELLATA" ? 0.6 : 1 }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "hsl(var(--tf-primary)/.4)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "hsl(var(--tf-border))"; e.currentTarget.style.transform = "none"; }}
        >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                        <span style={{ padding: "0.2rem 0.6rem", borderRadius: "999px", fontSize: "0.72rem", fontWeight: 700, background: STATO_BG[prenotazione.stato] ?? "hsl(var(--tf-border)/.2)", color: STATO_COLOR[prenotazione.stato] ?? "hsl(var(--tf-text-muted))" }}>{prenotazione.stato}</span>
                        <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "hsl(var(--tf-primary))" }}>👤 {athleteName}</span>
                    </div>
                    <p style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.25rem" }}>📅 {data.toLocaleDateString("it-IT", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</p>
                    <p style={{ fontSize: "0.825rem", color: "hsl(var(--tf-text-muted))" }}>🕐 {data.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}{prenotazione.importototale > 0 && ` · 💶 €${prenotazione.importototale.toFixed(2)}`}</p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }} onClick={e => e.stopPropagation()}>
                    {modificabile && (
                        <button onClick={() => onModifica(prenotazione.id)} style={{ padding: "0.5rem 1rem", borderRadius: "var(--tf-radius-sm)", border: "1px solid hsl(var(--tf-primary)/.3)", background: "hsl(var(--tf-primary)/.1)", color: "hsl(var(--tf-primary))", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}>✏️ Modifica</button>
                    )}
                    {cancellabile && (
                        <button onClick={() => onAnnulla(prenotazione.id)} style={{ padding: "0.5rem 1rem", borderRadius: "var(--tf-radius-sm)", border: "1px solid hsl(var(--tf-danger)/.3)", background: "hsl(var(--tf-danger)/.1)", color: "hsl(var(--tf-danger))", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}>🗑️ Annulla</button>
                    )}
                </div>
            </div>
        </div>
    );
}

function ModificaModal({ sessioneId, onClose, onSuccess }: { sessioneId: string; onClose: () => void; onSuccess: () => void }) {
    const [nuovadataora, setNuovadataora] = useState("");
    const [motivazione, setMotivazione] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const meRes = await fetch("/api/coaches/me");
            const meData = await meRes.json();
            const coachId = meData.coach?.id;
            if (!coachId) throw new Error("Coach non trovato");
            const res = await fetch(`/api/coaches/${coachId}/prenotazioni`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessioneid: sessioneId, nuovadataora, motivazione }) });
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
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
            <div style={{ background: "hsl(var(--tf-surface))", border: "1px solid hsl(var(--tf-border))", borderRadius: "var(--tf-radius)", padding: "2rem", width: "100%", maxWidth: 440 }}>
                <h2 style={{ fontWeight: 800, fontSize: "1.25rem", marginBottom: "1.25rem" }}>✏️ Modifica Sessione</h2>
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div>
                        <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "hsl(var(--tf-text-muted))", display: "block", marginBottom: "0.4rem" }}>Nuova data e ora</label>
                        <input type="datetime-local" value={nuovadataora} onChange={e => setNuovadataora(e.target.value)} required style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "var(--tf-radius-sm)", border: "1px solid hsl(var(--tf-border))", background: "hsl(var(--tf-bg))", color: "hsl(var(--tf-text))", fontSize: "0.875rem" }} />
                    </div>
                    <div>
                        <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "hsl(var(--tf-text-muted))", display: "block", marginBottom: "0.4rem" }}>Motivazione *</label>
                        <textarea value={motivazione} onChange={e => setMotivazione(e.target.value)} required rows={3} style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "var(--tf-radius-sm)", border: "1px solid hsl(var(--tf-border))", background: "hsl(var(--tf-bg))", color: "hsl(var(--tf-text))", fontSize: "0.875rem", resize: "vertical" }} />
                    </div>
                    {error && <p style={{ padding: "0.6rem", borderRadius: "6px", background: "hsl(var(--tf-danger)/.1)", color: "hsl(var(--tf-danger))", fontSize: "0.8rem" }}>⚠️ {error}</p>}
                    <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                        <button type="button" onClick={onClose} style={{ padding: "0.6rem 1.25rem", borderRadius: "var(--tf-radius-sm)", border: "1px solid hsl(var(--tf-border))", background: "transparent", color: "hsl(var(--tf-text))", cursor: "pointer", fontSize: "0.875rem" }}>Annulla</button>
                        <button type="submit" disabled={loading} style={{ padding: "0.6rem 1.5rem", borderRadius: "var(--tf-radius-sm)", border: "none", background: "linear-gradient(135deg, hsl(var(--tf-primary)), hsl(var(--tf-accent)))", color: "#fff", cursor: loading ? "not-allowed" : "pointer", fontSize: "0.875rem", fontWeight: 700, opacity: loading ? 0.7 : 1 }}>
                            {loading ? "Salvando…" : "Salva"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function DettagliModal({ prenotazione, onClose }: { prenotazione: PrenotazioneWithUser; onClose: () => void }) {
    const dataInizio = new Date(prenotazione.dataora);
    const dataFine = new Date(dataInizio.getTime() + prenotazione.durata * 60 * 1000);
    const athlete = prenotazione.user;
    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", zIndex: 1000 }} onClick={onClose}>
            <div style={{ background: "hsl(var(--tf-surface))", border: "1px solid hsl(var(--tf-border))", borderRadius: "var(--tf-radius)", padding: "2rem", width: "100%", maxWidth: 500, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }} onClick={e => e.stopPropagation()}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                    <h2 style={{ fontWeight: 800, fontSize: "1.35rem" }}>🔍 Dettagli Sessione</h2>
                    <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "hsl(var(--tf-text-muted))" }}>×</button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    <div style={{ padding: "1.25rem", borderRadius: "12px", background: "hsl(var(--tf-primary)/.05)", border: "1px solid hsl(var(--tf-primary)/.1)" }}>
                        <h3 style={{ fontSize: "0.75rem", fontWeight: 700, color: "hsl(var(--tf-primary))", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1rem" }}>👤 Informazioni Atleta</h3>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            <div><p style={{ fontSize: "0.7rem", color: "hsl(var(--tf-text-muted))", fontWeight: 600 }}>Nome Completo</p><p style={{ fontSize: "0.9rem", fontWeight: 700 }}>{athlete.nome} {athlete.cognome}</p></div>
                            <div><p style={{ fontSize: "0.7rem", color: "hsl(var(--tf-text-muted))", fontWeight: 600 }}>Email</p><p style={{ fontSize: "0.9rem" }}>{athlete.email}</p></div>
                            {athlete.peso && <div><p style={{ fontSize: "0.7rem", color: "hsl(var(--tf-text-muted))", fontWeight: 600 }}>Peso</p><p style={{ fontSize: "0.9rem" }}>{athlete.peso} kg</p></div>}
                            {athlete.altezza && <div><p style={{ fontSize: "0.7rem", color: "hsl(var(--tf-text-muted))", fontWeight: 600 }}>Altezza</p><p style={{ fontSize: "0.9rem" }}>{athlete.altezza} cm</p></div>}
                            {athlete.datanascita && <div style={{ gridColumn: "1 / -1" }}><p style={{ fontSize: "0.7rem", color: "hsl(var(--tf-text-muted))", fontWeight: 600 }}>Data di Nascita</p><p style={{ fontSize: "0.9rem" }}>{new Date(athlete.datanascita).toLocaleDateString("it-IT")}</p></div>}
                        </div>
                    </div>
                    <div style={{ padding: "1.25rem", borderRadius: "12px", border: "1px solid hsl(var(--tf-border))" }}>
                        <h3 style={{ fontSize: "0.75rem", fontWeight: 700, color: "hsl(var(--tf-text-muted))", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1rem" }}>🗓️ Programmazione</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: "0.85rem", color: "hsl(var(--tf-text-muted))" }}>Data</span><span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{dataInizio.toLocaleDateString("it-IT", { weekday: "long", day: "2-digit", month: "long" })}</span></div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: "0.85rem", color: "hsl(var(--tf-text-muted))" }}>Orario</span><span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{dataInizio.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })} - {dataFine.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}</span></div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: "0.85rem", color: "hsl(var(--tf-text-muted))" }}>Durata</span><span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{prenotazione.durata} min</span></div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: "1px dashed hsl(var(--tf-border))" }}><span style={{ fontSize: "0.85rem", color: "hsl(var(--tf-text-muted))" }}>Importo</span><span style={{ fontSize: "0.95rem", fontWeight: 800, color: "hsl(var(--tf-primary))" }}>€{prenotazione.importototale.toFixed(2)}</span></div>
                        </div>
                    </div>
                </div>
                <div style={{ marginTop: "2rem" }}>
                    <button onClick={onClose} style={{ width: "100%", padding: "0.85rem", borderRadius: "var(--tf-radius-sm)", border: "none", background: "linear-gradient(135deg, hsl(var(--tf-primary)), hsl(var(--tf-accent)))", color: "#fff", cursor: "pointer", fontSize: "0.9rem", fontWeight: 700 }}>Chiudi</button>
                </div>
            </div>
        </div>
    );
}

export default function PianiPage() {
    const { user, loading } = useRoleRedirect(RuoloEnum.COACH);
    const [prenotazioni, setPrenotazioni] = useState<PrenotazioneWithUser[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [modaleOpen, setModaleOpen] = useState<string | null>(null);
    const [annullaOpen, setAnnullaOpen] = useState<string | null>(null);
    const [dettagliOpen, setDettagliOpen] = useState<PrenotazioneWithUser | null>(null);
    const [filtro, setFiltro] = useState<"tutte" | "future" | "passate">("tutte");
    const [refreshBanner, setRefreshBanner] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const meRes = await fetch("/api/coaches/me");
            if (!meRes.ok) return;
            const meData = await meRes.json();
            const coachId = meData.coach?.id;
            if (!coachId) return;
            const res = await fetch(`/api/coaches/${coachId}/prenotazioni`);
            if (res.ok) {
                const data = await res.json();
                setPrenotazioni(data ?? []);
            }
        } finally {
            setLoadingData(false);
        }
    }, []);

    // Caricamento iniziale
    useEffect(() => {
        if (!user) return;
        fetchData();
    }, [user, fetchData]);

    // ─── Realtime: aggiornamento automatico quando arriva una nuova prenotazione ───
    // Il backend (prenotaSlotCoach) invia un broadcast con triggerRefresh=true
    // sul canale "notifiche:{coachUserId}". Qui lo intercettiamo e ricarichiamo.
    useEffect(() => {
        if (!user?.id) return;

        const channel = supabaseBrowser
            .channel(`piani_refresh:${user.id}`)
            .on("broadcast", { event: "notifica" }, ({ payload }) => {
                // Ricarica solo se il payload indica una nuova prenotazione
                if (payload?.dati?.triggerRefresh) {
                    setRefreshBanner(true);
                    fetchData();
                    // Nascondi il banner dopo 4 secondi
                    setTimeout(() => setRefreshBanner(false), 4000);
                }
            })
            .subscribe();

        return () => { supabaseBrowser.removeChannel(channel); };
    }, [user?.id, fetchData]);

    if (loading) return null;

    const now = new Date();
    const filtrate = (prenotazioni || []).filter(p => {
        const d = new Date(p.dataora);
        if (filtro === "future") return d > now;
        if (filtro === "passate") return d <= now;
        return true;
    });

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

            {/* Banner aggiornamento automatico */}
            {refreshBanner && (
                <div style={{
                    padding: "0.75rem 1rem",
                    borderRadius: "var(--tf-radius)",
                    background: "hsl(145 60% 45%/.12)",
                    border: "1px solid hsl(145 60% 45%/.3)",
                    color: "hsl(145 60% 35%)",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    animation: "tf-toast-in 0.25s ease",
                }}>
                    ✅ Nuova prenotazione ricevuta — lista aggiornata automaticamente
                </div>
            )}

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                    <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.25rem" }}>📋 Piani Allenamento</h1>
                    <p style={{ fontSize: "0.875rem", color: "hsl(var(--tf-text-muted))" }}>Le sessioni prenotate con i tuoi atleti</p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                    {(["tutte", "future", "passate"] as const).map(f => (
                        <button key={f} onClick={() => setFiltro(f)} style={{ padding: "0.4rem 0.9rem", borderRadius: "999px", border: "1px solid hsl(var(--tf-border))", background: filtro === f ? "hsl(var(--tf-primary))" : "hsl(var(--tf-surface))", color: filtro === f ? "#fff" : "hsl(var(--tf-text))", cursor: "pointer", fontSize: "0.8rem", fontWeight: filtro === f ? 700 : 400 }}>
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {loadingData ? (
                <div style={{ textAlign: "center", padding: "3rem", color: "hsl(var(--tf-text-muted))" }}>
                    <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⏳</div>
                    <p>Caricamento sessioni…</p>
                </div>
            ) : filtrate.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem", border: "2px dashed hsl(var(--tf-border))", borderRadius: "var(--tf-radius)", color: "hsl(var(--tf-text-muted))" }}>
                    <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📅</div>
                    <p style={{ fontWeight: 600 }}>Nessuna sessione {filtro !== "tutte" ? filtro : ""}</p>
                    <p style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>Le sessioni prenotate dagli atleti appariranno qui</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {filtrate.map(p => (
                        <SessioneCard key={p.id} prenotazione={p}
                            onModifica={(id) => setModaleOpen(id)}
                            onAnnulla={(id) => setAnnullaOpen(id)}
                            onDettagli={() => setDettagliOpen(p)}
                        />
                    ))}
                </div>
            )}

            {modaleOpen && <ModificaModal sessioneId={modaleOpen} onClose={() => setModaleOpen(null)} onSuccess={() => { setModaleOpen(null); setLoadingData(true); fetchData(); }} />}
            {annullaOpen && <AnnullaModal sessioneId={annullaOpen} onClose={() => setAnnullaOpen(null)} onSuccess={() => { setAnnullaOpen(null); setLoadingData(true); fetchData(); }} />}
            {dettagliOpen && <DettagliModal prenotazione={dettagliOpen} onClose={() => setDettagliOpen(null)} />}

            <style>{`
                @keyframes tf-toast-in {
                    from { opacity: 0; transform: translateY(-6px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
