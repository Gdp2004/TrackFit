"use client";

import { useState } from "react";
import { Button } from "@frontend/components/ui/Button";
import type { Workout } from "@backend/domain/model/types";

interface QuickActionModalProps {
    workout: Workout;
    onClose: () => void;
    onRefresh: () => void;
}

export function QuickActionModal({ workout, onClose, onRefresh }: QuickActionModalProps) {
    const [newDate, setNewDate] = useState(workout.dataora.slice(0, 16));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isCourse = workout.sorgente === "IMPORT" && workout.obiettivo === "Prenotazione";

    const handleUpdate = async () => {
        if (isCourse) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/workouts", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    workoutId: workout.id,
                    action: "update_time",
                    dataora: new Date(newDate).toISOString(),
                }),
            });
            if (!res.ok) {
                const d = await res.json();
                throw new Error(d.error || "Errore durante l'aggiornamento");
            }
            onRefresh();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        setLoading(true);
        setError(null);
        try {
            let res;
            if (isCourse) {
                res = await fetch("/api/gyms/corsi/prenotazioni", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prenotazioneId: workout.id }),
                });
            } else {
                res = await fetch("/api/workouts", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ workoutId: workout.id }),
                });
            }

            if (!res.ok) {
                const d = await res.json();
                throw new Error(d.error || "Errore durante la cancellazione");
            }
            onRefresh();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center",
                zIndex: 1000, backdropFilter: "blur(4px)"
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: "hsl(var(--tf-surface))", padding: "1.5rem", borderRadius: "1rem",
                    maxWidth: "400px", width: "90%", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
                    border: "1px solid hsl(var(--tf-surface-2))"
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <h3 style={{ marginBottom: "0.5rem", fontWeight: 700 }}>Gestisci {isCourse ? "Prenotazione" : "Allenamento"}</h3>
                <p style={{ fontSize: "0.875rem", color: "hsl(var(--tf-text-muted))", marginBottom: "1rem" }}>
                    {workout.tipo}
                </p>

                {error && (
                    <div style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", padding: "0.5rem", borderRadius: "0.5rem", fontSize: "0.75rem", marginBottom: "1rem" }}>
                        {error}
                    </div>
                )}

                {!isCourse && (
                    <div style={{ marginBottom: "1.5rem" }}>
                        <label style={{ fontSize: "0.75rem", fontWeight: 600, display: "block", marginBottom: "0.4rem" }}>Cambia Data e Ora</label>
                        <input
                            type="datetime-local"
                            value={newDate}
                            onChange={(e) => setNewDate(e.target.value)}
                            className="tf-input"
                            style={{ width: "100%", marginBottom: "0.5rem" }}
                        />
                        <Button
                            variant="secondary"
                            style={{ width: "100%" }}
                            onClick={handleUpdate}
                            isLoading={loading && !isCourse}
                        >
                            Aggiorna Orario
                        </Button>
                    </div>
                )}

                {isCourse && (
                    <p style={{ fontSize: "0.75rem", color: "hsl(var(--tf-text-muted))", marginBottom: "1.5rem", background: "hsl(var(--tf-surface-2))", padding: "0.75rem", borderRadius: "0.5rem" }}>
                        I corsi hanno orari fissi definiti dalla palestra. Per cambiare orario, cancella questa prenotazione e prenota un altro slot.
                    </p>
                )}

                <div style={{ display: "flex", gap: "0.75rem" }}>
                    <Button
                        style={{ flex: 1 }}
                        variant="danger"
                        onClick={handleCancel}
                        isLoading={loading}
                    >
                        {isCourse ? "Annulla Prenotazione" : "Elimina Sessione"}
                    </Button>
                    <Button variant="ghost" onClick={onClose} disabled={loading}>
                        Chiudi
                    </Button>
                </div>
            </div>
        </div>
    );
}
