// ============================================================
// /coaches/disponibilita – Editor Slot Disponibilità Coach
// Visibile solo ai COACH
// ============================================================
"use client";

import { useState, useEffect } from "react";
import { useRoleRedirect } from "@frontend/hooks/useRoleRedirect";
import { RuoloEnum } from "@backend/domain/model/enums";
import type { SlotDisponibilita } from "@backend/domain/model/types";

const GIORNI = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
const GIORNI_FULL = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];

const ORE_DEFAULT: SlotDisponibilita[] = [
    { giornoSettimana: 1, oraInizio: "09:00", oraFine: "12:00" },
    { giornoSettimana: 1, oraInizio: "15:00", oraFine: "18:00" },
    { giornoSettimana: 3, oraInizio: "09:00", oraFine: "12:00" },
    { giornoSettimana: 3, oraInizio: "15:00", oraFine: "18:00" },
    { giornoSettimana: 5, oraInizio: "09:00", oraFine: "13:00" },
];

function SlotRow({ slot, onRemove, onChange }: {
    slot: SlotDisponibilita;
    onRemove: () => void;
    onChange: (updated: SlotDisponibilita) => void;
}) {
    return (
        <div style={{
            display: "flex", alignItems: "center", gap: "0.75rem",
            padding: "0.75rem",
            borderRadius: "var(--tf-radius-sm)",
            background: "hsl(var(--tf-surface))",
            border: "1px solid hsl(var(--tf-border))",
        }}>
            <select
                value={slot.giornoSettimana}
                onChange={e => onChange({ ...slot, giornoSettimana: parseInt(e.target.value) })}
                style={{
                    padding: "0.4rem 0.5rem", borderRadius: "6px",
                    background: "hsl(var(--tf-bg))", border: "1px solid hsl(var(--tf-border))",
                    color: "hsl(var(--tf-text))", fontSize: "0.85rem", cursor: "pointer",
                }}
            >
                {GIORNI_FULL.map((g, i) => <option key={i} value={i}>{g}</option>)}
            </select>

            <span style={{ color: "hsl(var(--tf-text-muted))", fontSize: "0.8rem" }}>dalle</span>
            <input
                type="time"
                value={slot.oraInizio}
                onChange={e => onChange({ ...slot, oraInizio: e.target.value })}
                style={{
                    padding: "0.4rem", borderRadius: "6px",
                    background: "hsl(var(--tf-bg))", border: "1px solid hsl(var(--tf-border))",
                    color: "hsl(var(--tf-text))", fontSize: "0.85rem",
                }}
            />
            <span style={{ color: "hsl(var(--tf-text-muted))", fontSize: "0.8rem" }}>alle</span>
            <input
                type="time"
                value={slot.oraFine}
                onChange={e => onChange({ ...slot, oraFine: e.target.value })}
                style={{
                    padding: "0.4rem", borderRadius: "6px",
                    background: "hsl(var(--tf-bg))", border: "1px solid hsl(var(--tf-border))",
                    color: "hsl(var(--tf-text))", fontSize: "0.85rem",
                }}
            />

            <button
                onClick={onRemove}
                style={{
                    marginLeft: "auto", padding: "0.3rem 0.6rem",
                    borderRadius: "6px", border: "1px solid hsl(var(--tf-danger)/.3)",
                    background: "hsl(var(--tf-danger)/.1)", color: "hsl(var(--tf-danger))",
                    cursor: "pointer", fontSize: "0.8rem",
                }}
            >
                ✕
            </button>
        </div>
    );
}

export default function DisponibilitaPage() {
    const { loading: roleLoading } = useRoleRedirect(RuoloEnum.COACH);
    const [slots, setSlots] = useState<SlotDisponibilita[]>([]);
    const [fetching, setFetching] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const fetchCurrentDisponibilita = async () => {
            try {
                const res = await fetch("/api/coaches/me");
                if (res.ok) {
                    const data = await res.json();
                    if (data.coach?.disponibilita) {
                        setSlots(data.coach.disponibilita);
                    }
                }
            } catch (err) {
                console.error("Errore fetch disponibilita:", err);
            } finally {
                setFetching(false);
            }
        };

        if (!roleLoading) {
            fetchCurrentDisponibilita();
        }
    }, [roleLoading]);

    if (roleLoading || fetching) return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "200px", color: "hsl(var(--tf-text-muted))" }}>
            Caricamento disponibilità in corso...
        </div>
    );

    const addSlot = () => {
        setSlots(prev => [...prev, { giornoSettimana: 1, oraInizio: "09:00", oraFine: "17:00" }]);
    };

    const removeSlot = (idx: number) => {
        setSlots(prev => prev.filter((_, i) => i !== idx));
    };

    const updateSlot = (idx: number, updated: SlotDisponibilita) => {
        setSlots(prev => prev.map((s, i) => i === idx ? updated : s));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/coaches/me", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ disponibilita: slots }),
            });
            if (res.ok) {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            }
        } finally {
            setSaving(false);
        }
    };

    // Raggruppa per giorno
    const slotsByDay = GIORNI.map((_, idx) => ({
        giorno: idx,
        slots: slots.filter(s => s.giornoSettimana === idx),
    })).filter(d => d.slots.length > 0);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                    <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.25rem" }}>
                        🗓️ Disponibilità Settimanale
                    </h1>
                    <p style={{ fontSize: "0.875rem", color: "hsl(var(--tf-text-muted))" }}>
                        Configura gli slot orari in cui sei disponibile per sessioni con gli atleti
                    </p>
                </div>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                    <button
                        onClick={addSlot}
                        style={{
                            padding: "0.6rem 1.25rem", borderRadius: "var(--tf-radius-sm)",
                            border: "1px solid hsl(var(--tf-border))",
                            background: "hsl(var(--tf-surface))", color: "hsl(var(--tf-text))",
                            cursor: "pointer", fontSize: "0.875rem", fontWeight: 600,
                        }}
                    >
                        + Aggiungi Slot
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        style={{
                            padding: "0.6rem 1.5rem", borderRadius: "var(--tf-radius-sm)",
                            border: "none",
                            background: saved
                                ? "hsl(145 60% 45%)"
                                : "linear-gradient(135deg, hsl(var(--tf-primary)), hsl(var(--tf-accent)))",
                            color: "#fff", cursor: saving ? "not-allowed" : "pointer",
                            fontSize: "0.875rem", fontWeight: 700, opacity: saving ? 0.7 : 1,
                        }}
                    >
                        {saving ? "Salvataggio…" : saved ? "✓ Salvato!" : "Salva Disponibilità"}
                    </button>
                </div>
            </div>

            {/* Vista calendario */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: "0.5rem",
                padding: "1rem",
                borderRadius: "var(--tf-radius)",
                background: "hsl(var(--tf-surface))",
                border: "1px solid hsl(var(--tf-border))",
            }}>
                {GIORNI.map((g, idx) => {
                    const hasSlots = slots.some(s => s.giornoSettimana === idx);
                    return (
                        <div key={idx} style={{ textAlign: "center" }}>
                            <div style={{
                                fontSize: "0.75rem", fontWeight: 700,
                                color: hasSlots ? "hsl(var(--tf-primary))" : "hsl(var(--tf-text-muted))",
                                marginBottom: "0.5rem",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                            }}>
                                {g}
                            </div>
                            <div style={{
                                height: 60, borderRadius: "8px",
                                background: hasSlots
                                    ? "linear-gradient(135deg, hsl(var(--tf-primary)/.2), hsl(var(--tf-accent)/.1))"
                                    : "hsl(var(--tf-bg))",
                                border: `2px solid ${hasSlots ? "hsl(var(--tf-primary)/.4)" : "hsl(var(--tf-border))"}`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                                {hasSlots ? (
                                    <span style={{ fontSize: "1.2rem" }}>✓</span>
                                ) : (
                                    <span style={{ fontSize: "0.7rem", color: "hsl(var(--tf-text-muted))" }}>—</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Slot editor */}
            <div>
                <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem" }}>
                    Slot configurati ({slots.length})
                </h2>
                {slots.length === 0 ? (
                    <div style={{
                        textAlign: "center", padding: "2rem",
                        border: "2px dashed hsl(var(--tf-border))",
                        borderRadius: "var(--tf-radius)",
                        color: "hsl(var(--tf-text-muted))",
                    }}>
                        <p>Nessuno slot configurato.</p>
                        <p style={{ fontSize: "0.8rem" }}>Clicca su "Aggiungi Slot" per iniziare.</p>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {slots.map((slot, idx) => (
                            <SlotRow
                                key={idx}
                                slot={slot}
                                onRemove={() => removeSlot(idx)}
                                onChange={(updated) => updateSlot(idx, updated)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Info */}
            <div style={{
                padding: "1rem",
                borderRadius: "var(--tf-radius-sm)",
                background: "hsl(var(--tf-primary)/.08)",
                border: "1px solid hsl(var(--tf-primary)/.2)",
                fontSize: "0.8rem",
                color: "hsl(var(--tf-text-muted))",
            }}>
                ℹ️ Gli atleti potranno prenotare sessioni solo negli slot che hai configurato. Le modifiche non influenzano le prenotazioni già confermate.
            </div>
        </div>
    );
}
