"use client";

import { useState } from "react";
import { useAuth } from "@frontend/contexts/AuthContext";
import { Card } from "@frontend/components/ui/Card";
import { Button } from "@frontend/components/ui/Button";
import { Modal } from "@frontend/components/ui/Modal";
import { Input } from "@frontend/components/ui/Input";
import type { User } from "@backend/domain/model/types";

interface BookingModalProps {
    coach: User & { coachid?: string; specializzazione?: string; rating?: number };
    open: boolean;
    onClose: () => void;
}

export function BookingModal({ coach, open, onClose }: BookingModalProps) {
    const { user } = useAuth();
    const [data, setData] = useState("");
    const [oraInizio, setOraInizio] = useState("");
    const [oraFine, setOraFine] = useState("");

    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleBook = async () => {
        if (!user || !data || !oraInizio || !oraFine) { setError("Compila tutti i campi"); return; }

        const start = new Date(`${data}T${oraInizio}`);
        const end = new Date(`${data}T${oraFine}`);

        if (end <= start) { setError("L'ora di fine deve essere successiva all'ora di inizio"); return; }

        // Calcola durata in minuti
        const durataMinuti = (end.getTime() - start.getTime()) / (1000 * 60);
        if (durataMinuti < 15) { setError("La durata minima è di 15 minuti"); return; }

        setLoading(true); setError(null);
        try {
            const actualCoachId = coach.coachid || coach.id;
            const res = await fetch("/api/coaches", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userid: user.id,
                    coachid: actualCoachId,
                    dataora: start.toISOString(),
                    durata: durataMinuti
                }),
            });
            const d = await res.json();
            if (!res.ok) { setError(d.error ?? "Errore"); return; }
            setSuccess(true);
        } catch { setError("Errore di rete"); } finally { setLoading(false); }
    };

    const handleClose = () => {
        setSuccess(false);
        setData("");
        setOraInizio("");
        setOraFine("");
        setError(null);
        onClose();
    };

    return (
        <Modal open={open} onClose={handleClose} title={`Prenota con ${coach.nome}`}>
            {success ? (
                <div style={{ textAlign: "center", padding: "1rem 0" }}>
                    <p style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>✅</p>
                    <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Richiesta inviata!</h3>
                    <p style={{ color: "hsl(var(--tf-text-muted))", fontSize: "0.875rem", marginBottom: "1.25rem" }}>
                        Il coach riceverà la tua richiesta di sessione.
                    </p>
                    <Button onClick={handleClose} style={{ width: "100%" }}>Chiudi</Button>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    {/* Date Picker */}
                    <Input
                        id="booking-date"
                        label="Giorno della sessione"
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={data}
                        onChange={(e) => setData(e.target.value)}
                    />

                    {/* Time Range */}
                    <div style={{ display: "flex", gap: "1rem" }}>
                        <div style={{ flex: 1 }}>
                            <Input
                                id="booking-start"
                                label="Dalle ore"
                                type="time"
                                value={oraInizio}
                                onChange={(e) => setOraInizio(e.target.value)}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <Input
                                id="booking-end"
                                label="Alle ore"
                                type="time"
                                value={oraFine}
                                onChange={(e) => setOraFine(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <div style={{
                            padding: "0.75rem", borderRadius: "1rem",
                            background: "rgba(239, 68, 68, 0.1)", color: "rgb(248, 113, 113)",
                            fontSize: "0.85rem", fontWeight: 600, display: "flex", gap: "0.5rem", alignItems: "center",
                            border: "1px solid rgba(239, 68, 68, 0.1)"
                        }}>
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                        <Button variant="ghost" onClick={handleClose} style={{ flex: 1 }}>Annulla</Button>
                        <Button onClick={handleBook} isLoading={loading} style={{
                            flex: 2,
                            background: "linear-gradient(135deg, hsl(var(--tf-primary)), hsl(var(--tf-accent)))",
                            color: "white",
                            boxShadow: "0 4px 15px hsl(var(--tf-primary)/.3)"
                        }}>
                            Conferma Prenotazione
                        </Button>
                    </div>
                </div>
            )}
        </Modal>
    );
}
