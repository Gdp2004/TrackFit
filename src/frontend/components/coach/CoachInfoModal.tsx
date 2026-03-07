"use client";

import { Modal } from "@frontend/components/ui/Modal";
import { Badge } from "@frontend/components/ui/Badge";
import type { User, SlotDisponibilita } from "@backend/domain/model/types";

interface CoachInfoModalProps {
    coach: User & { specializzazione?: string; rating?: number; bio?: string; telefono?: string; disponibilita?: SlotDisponibilita[] };
    open: boolean;
    onClose: () => void;
}

const BG_COLORS = [
    "linear-gradient(135deg,hsl(25 95% 53%),hsl(20 90% 38%))",
    "linear-gradient(135deg,hsl(38 100% 55%),hsl(25 95% 45%))",
    "linear-gradient(135deg,hsl(20 85% 45%),hsl(10 80% 35%))",
];

export function CoachInfoModal({ coach, open, onClose }: CoachInfoModalProps) {
    const idx = coach.id.charCodeAt(0) % BG_COLORS.length;
    const initials = `${coach.nome[0]}${coach.cognome[0]}`.toUpperCase();

    return (
        <Modal open={open} onClose={onClose} title="Informazioni Coach">
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {/* Header with Avatar and Basic Info */}
                <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                    <div style={{
                        width: 80, height: 80, borderRadius: "50%", flexShrink: 0,
                        background: BG_COLORS[idx],
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 800, fontSize: "1.8rem", color: "#fff",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                    }}>
                        {initials}
                    </div>
                    <div>
                        <h3 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: "0.25rem" }}>
                            {coach.nome} {coach.cognome}
                        </h3>
                        {coach.specializzazione && (
                            <Badge color="blue">{coach.specializzazione}</Badge>
                        )}
                        <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                            <span style={{ color: "#f59e0b" }}>★</span>
                            <span style={{ fontWeight: 600 }}>{coach.rating?.toFixed(1) || "N/A"}</span>
                        </div>
                    </div>
                </div>

                {/* Bio Section */}
                <div style={{ padding: "0 0.5rem" }}>
                    <h4 style={{ fontSize: "0.8rem", fontWeight: 700, color: "hsl(var(--tf-text-muted))", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>
                        Biografia
                    </h4>
                    <p style={{ lineHeight: 1.7, color: "rgba(255,255,255,0.85)", fontSize: "0.95rem", fontStyle: "italic" }}>
                        {coach.bio || "Nessuna biografia disponibile."}
                    </p>
                </div>

                {/* Contact Info */}
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                    padding: "1.25rem",
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.05)",
                    borderRadius: "var(--tf-radius-sm)",
                    marginTop: "0.5rem"
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>
                            📧
                        </div>
                        <span style={{ fontSize: "0.9rem", fontWeight: 500, color: "hsl(var(--tf-text))" }}>{coach.email}</span>
                    </div>
                    {coach.telefono && (
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>
                                📞
                            </div>
                            <span style={{ fontSize: "0.9rem", fontWeight: 500, color: "hsl(var(--tf-text))" }}>{coach.telefono}</span>
                        </div>
                    )}
                </div>

                {/* Working Hours Section */}
                {coach.disponibilita && coach.disponibilita.length > 0 && (
                    <div style={{ padding: "0 0.5rem" }}>
                        <h4 style={{ fontSize: "0.8rem", fontWeight: 700, color: "hsl(var(--tf-text-muted))", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>
                            Orari di Lavoro
                        </h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            {coach.disponibilita.sort((a, b) => a.giornoSettimana - b.giornoSettimana).map((slot, i) => {
                                const days = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];
                                return (
                                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", color: "hsl(var(--tf-text))", padding: "0.5rem 0.75rem", background: "rgba(255,255,255,0.02)", borderRadius: "var(--tf-radius-sm)" }}>
                                        <span style={{ fontWeight: 600 }}>{days[slot.giornoSettimana]}</span>
                                        <span style={{ opacity: 0.8 }}>{slot.oraInizio} - {slot.oraFine}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}
