"use client";

import { Badge } from "@frontend/components/ui/Badge";
import type { Workout } from "@backend/domain/model/types";

interface WorkoutDetailProps { workout: Workout; }

const SPORT_ICON: Record<string, string> = {
    CORSA: "🏃", CICLISMO: "🚴", NUOTO: "🏊", PALESTRA: "🏋️", YOGA: "🧘", CAMMINO: "🚶", ALTRO: "⚡",
};
type BadgeColor = "green" | "yellow" | "blue" | "red" | "purple" | "gray";
const STATO_BADGE: Record<string, { color: BadgeColor; label: string }> = {
    PIANIFICATA: { color: "yellow", label: "Pianificata" },
    IN_CORSO: { color: "green", label: "In corso" },
    IN_PAUSA: { color: "purple", label: "In pausa" },
    INTERROTTA: { color: "red", label: "Interrotta" },
    COMPLETATA_LOCALMENTE: { color: "blue", label: "Locale" },
    IN_ATTESA_DI_RETE: { color: "gray", label: "In attesa" },
    IN_SINCRONIZZAZIONE: { color: "blue", label: "Sync…" },
    CONSOLIDATA: { color: "green", label: "Consolidata" },
};

function MetricBox({ icon, label, value, unit }: { icon: string; label: string; value?: string | number; unit?: string }) {
    return (
        <div style={{
            background: "hsl(var(--tf-surface-2))",
            borderRadius: "var(--tf-radius-sm)",
            padding: "1rem",
            display: "flex", flexDirection: "column", gap: "0.25rem",
        }}>
            <p style={{ fontSize: "0.75rem", color: "hsl(var(--tf-text-muted))", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <span>{icon}</span> {label}
            </p>
            <p style={{ fontSize: "1.5rem", fontWeight: 800, lineHeight: 1 }}>
                {value ?? "—"} {value !== undefined && unit && <span style={{ fontSize: "0.8rem", fontWeight: 400, color: "hsl(var(--tf-text-muted))" }}>{unit}</span>}
            </p>
        </div>
    );
}

function RpeGauge({ rpe }: { rpe?: number }) {
    if (!rpe) return null;
    const pct = (rpe / 10) * 100;
    const color = rpe <= 4 ? "hsl(var(--tf-accent))" : rpe <= 7 ? "hsl(38 92% 50%)" : "hsl(var(--tf-danger))";
    return (
        <div style={{ marginTop: "1.25rem" }}>
            <p style={{ fontSize: "0.78rem", color: "hsl(var(--tf-text-muted))", marginBottom: "0.375rem" }}>
                Percezione sforzo (RPE)
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ flex: 1, height: 8, borderRadius: 4, background: "hsl(var(--tf-surface-2))" }}>
                    <div style={{ width: `${pct}%`, height: "100%", borderRadius: 4, background: color, transition: "width 0.4s ease" }} />
                </div>
                <span style={{ fontWeight: 800, fontSize: "1.1rem", color }}>{rpe}/10</span>
            </div>
        </div>
    );
}

export function WorkoutDetail({ workout }: WorkoutDetailProps) {
    const badge = STATO_BADGE[workout.stato] ?? { color: "gray" as BadgeColor, label: workout.stato };
    const icon = SPORT_ICON[workout.tipo] ?? "⚡";

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{
                    width: 56, height: 56, borderRadius: 14,
                    background: "hsl(var(--tf-primary)/.15)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.75rem",
                }}>
                    {icon}
                </div>
                <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: "1.4rem", fontWeight: 800 }}>
                        {workout.tipo.charAt(0) + workout.tipo.slice(1).toLowerCase()}
                    </h1>
                    <p style={{ fontSize: "0.83rem", color: "hsl(var(--tf-text-muted))", marginTop: 2 }}>
                        {new Date(workout.dataOra).toLocaleString("it-IT", {
                            weekday: "long", day: "numeric", month: "long", year: "numeric",
                            hour: "2-digit", minute: "2-digit",
                        })}
                    </p>
                </div>
                <Badge color={badge.color}>{badge.label}</Badge>
            </div>

            {/* Metrics grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem" }}>
                <MetricBox icon="⏱️" label="Durata" value={workout.durata} unit="min" />
                <MetricBox icon="📍" label="Distanza" value={workout.distanza?.toFixed(2)} unit="km" />
                <MetricBox icon="🔥" label="Calorie" value={workout.calorie} unit="kcal" />
                <MetricBox icon="❤️" label="FC media" value={workout.frequenzaCardiacaMedia} unit="bpm" />
            </div>

            <RpeGauge rpe={workout.percezionesSforzo} />

            {/* Obiettivo / Note */}
            {workout.obiettivo && (
                <div style={{ background: "hsl(var(--tf-surface-2))", borderRadius: "var(--tf-radius-sm)", padding: "1rem" }}>
                    <p style={{ fontSize: "0.75rem", color: "hsl(var(--tf-text-muted))", marginBottom: "0.375rem" }}>🎯 Obiettivo</p>
                    <p style={{ fontSize: "0.875rem" }}>{workout.obiettivo}</p>
                </div>
            )}
            {workout.note && (
                <div style={{ background: "hsl(var(--tf-surface-2))", borderRadius: "var(--tf-radius-sm)", padding: "1rem" }}>
                    <p style={{ fontSize: "0.75rem", color: "hsl(var(--tf-text-muted))", marginBottom: "0.375rem" }}>📝 Note</p>
                    <p style={{ fontSize: "0.875rem" }}>{workout.note}</p>
                </div>
            )}

            {/* GPX trace */}
            {workout.gpxTrace && (
                <a
                    href={workout.gpxTrace}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        display: "inline-flex", alignItems: "center", gap: "0.5rem",
                        color: "hsl(var(--tf-primary))", fontSize: "0.85rem", fontWeight: 600,
                    }}
                >
                    🗺️ Scarica traccia GPX
                </a>
            )}
        </div>
    );
}
