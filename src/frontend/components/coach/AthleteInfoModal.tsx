"use client";

import { Modal } from "@frontend/components/ui/Modal";
import type { User } from "@backend/domain/model/types";

interface AthleteInfoModalProps {
    atleta: User | null;
    open: boolean;
    onClose: () => void;
    onRemove: (id: string) => void;
}

export function AthleteInfoModal({ atleta, open, onClose, onRemove }: AthleteInfoModalProps) {
    if (!atleta) return null;

    const initials = `${atleta.nome[0]}${atleta.cognome[0]}`.toUpperCase();
    const colors = ["hsl(var(--tf-primary))", "hsl(var(--tf-accent))", "hsl(200 80% 55%)"];
    const color = colors[atleta.id.charCodeAt(0) % colors.length];

    const handleRemove = () => {
        if (confirm(`Sei sicuro di voler rimuovere ${atleta.nome} ${atleta.cognome} dal tuo roster?`)) {
            onRemove(atleta.id);
            onClose();
        }
    };

    return (
        <Modal open={open} onClose={onClose} title="Informazioni Atleta">
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                {/* Profile Header */}
                <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", paddingBottom: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{
                        width: 80, height: 80, borderRadius: "50%",
                        background: color, display: "flex",
                        alignItems: "center", justifyContent: "center",
                        fontWeight: 800, fontSize: "2rem", color: "#fff",
                        boxShadow: `0 8px 24px ${color}44`,
                        flexShrink: 0
                    }}>
                        {initials}
                    </div>
                    <div>
                        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.25rem", color: "hsl(var(--tf-text))" }}>
                            {atleta.nome} {atleta.cognome}
                        </h2>
                        <span style={{
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            color: "hsl(var(--tf-primary))",
                            background: "hsl(var(--tf-primary)/.1)",
                            padding: "0.25rem 0.75rem",
                            borderRadius: "100px"
                        }}>
                            Atleta
                        </span>
                    </div>
                </div>

                {/* Details Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                    <DetailItem label="Email" value={atleta.email} icon="✉️" fullWidth />
                    <DetailItem label="Data di Nascita" value={atleta.datanascita ? new Date(atleta.datanascita).toLocaleDateString('it-IT') : "N/D"} icon="📅" />
                    <DetailItem label="Membro dal" value={new Date(atleta.createdat).toLocaleDateString('it-IT')} icon="⏱️" />
                    <DetailItem label="Peso" value={atleta.peso ? `${atleta.peso} kg` : "N/D"} icon="⚖️" />
                    <DetailItem label="Altezza" value={atleta.altezza ? `${atleta.altezza} cm` : "N/D"} icon="📏" />
                </div>

                {/* Footer Action */}
                <div style={{ paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "flex-end" }}>
                    <button
                        onClick={handleRemove}
                        style={{
                            padding: "0.6rem 1.25rem",
                            borderRadius: "10px",
                            fontSize: "0.85rem",
                            fontWeight: 700,
                            background: "rgba(239, 68, 68, 0.1)",
                            color: "rgb(248, 113, 113)",
                            border: "1px solid rgba(239, 68, 68, 0.2)",
                            cursor: "pointer",
                            transition: "all 0.2s"
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
                            e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.3)";
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                            e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.2)";
                        }}
                    >
                        Rimuovi Atleta dal Roster
                    </button>
                </div>
            </div>
        </Modal>
    );
}

function DetailItem({ label, value, icon, fullWidth }: { label: string, value: string, icon: string, fullWidth?: boolean }) {
    return (
        <div style={{
            gridColumn: fullWidth ? "span 2" : "span 1",
            padding: "1rem",
            background: "rgba(255,255,255,0.02)",
            borderRadius: "1rem",
            border: "1px solid rgba(255,255,255,0.05)",
            display: "flex",
            flexDirection: "column",
            gap: "0.25rem"
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                <span style={{ fontSize: "0.9rem" }}>{icon}</span>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "hsl(var(--tf-text-muted))", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
            </div>
            <span style={{ fontSize: "0.95rem", fontWeight: 600, color: "hsl(var(--tf-text))" }}>{value}</span>
        </div>
    );
}
