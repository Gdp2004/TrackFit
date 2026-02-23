"use client";

import { useState } from "react";
import { useAuth } from "@frontend/contexts/AuthContext";
import { Card } from "@frontend/components/ui/Card";
import { Button } from "@frontend/components/ui/Button";
import { Modal } from "@frontend/components/ui/Modal";
import { Input } from "@frontend/components/ui/Input";
import type { User } from "@backend/domain/model/types";

interface BookingModalProps {
    coach: User;
    open: boolean;
    onClose: () => void;
}

export function BookingModal({ coach, open, onClose }: BookingModalProps) {
    const { user } = useAuth();
    const [dataora, setDataOra] = useState("");
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleBook = async () => {
        if (!user || !dataora) { setError("Seleziona data e ora"); return; }
        setLoading(true); setError(null);
        try {
            const res = await fetch("/api/coaches", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userid: user.id, coachid: coach.id, dataora: new Date(dataora).toISOString() }),
            });
            if (!res.ok) { const d = await res.json(); setError(d.error ?? "Errore"); setLoading(false); return; }
            setSuccess(true);
        } catch { setError("Errore di rete"); } finally { setLoading(false); }
    };

    const handleClose = () => { setSuccess(false); setDataOra(""); setError(null); onClose(); };

    return (
        <Modal open={open} onClose={handleClose} title={`Prenota slot con ${coach.nome} ${coach.cognome}`}>
            {success ? (
                <div style={{ textAlign: "center", padding: "1rem 0" }}>
                    <p style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>✅</p>
                    <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Prenotazione inviata!</h3>
                    <p style={{ color: "hsl(var(--tf-text-muted))", fontSize: "0.875rem", marginBottom: "1.25rem" }}>
                        Riceverai una conferma via email.
                    </p>
                    <Button onClick={handleClose} style={{ width: "100%" }}>Chiudi</Button>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <Input
                        id="booking-date"
                        label="Data e ora"
                        type="datetime-local"
                        min={new Date(Date.now() + 3600000).toISOString().slice(0, 16)}
                        value={dataora}
                        onChange={(e) => setDataOra(e.target.value)}
                    />
                    {error && (
                        <p style={{ padding: "0.75rem", borderRadius: "var(--tf-radius-sm)", background: "hsl(var(--tf-danger)/.15)", color: "hsl(var(--tf-danger))", fontSize: "0.8rem" }}>
                            ⚠️ {error}
                        </p>
                    )}
                    <div style={{ display: "flex", gap: "0.75rem" }}>
                        <Button variant="ghost" onClick={handleClose} style={{ flex: 1 }}>Annulla</Button>
                        <Button onClick={handleBook} isLoading={loading} style={{ flex: 2 }}>Conferma prenotazione</Button>
                    </div>
                </div>
            )}
        </Modal>
    );
}
