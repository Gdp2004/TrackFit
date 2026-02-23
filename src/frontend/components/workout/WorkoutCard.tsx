"use client";

import Link from "next/link";
import { Badge } from "@frontend/components/ui/Badge";
import type { Workout } from "@backend/domain/model/types";

interface WorkoutCardProps { workout: Workout; }

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

export function WorkoutCard({ workout }: WorkoutCardProps) {
  const badge = STATO_BADGE[workout.stato] ?? { color: "gray" as BadgeColor, label: workout.stato };
  const icon = SPORT_ICON[workout.tipo] ?? "⚡";

  return (
    <Link href={`/workouts/${workout.id}`} style={{ textDecoration: "none" }}>
      <div
        className="tf-card"
        style={{
          display: "flex", alignItems: "center", gap: "1rem",
          padding: "1rem 1.25rem",
          cursor: "pointer",
        }}
      >
        {/* Sport icon */}
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: "hsl(var(--tf-surface-2))",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem",
        }}>
          {icon}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "hsl(var(--tf-text))" }}>
            {workout.tipo.charAt(0) + workout.tipo.slice(1).toLowerCase()}
          </p>
          <p style={{ fontSize: "0.78rem", color: "hsl(var(--tf-text-muted))", marginTop: 2 }}>
            {new Date(workout.dataora).toLocaleString("it-IT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>

        {/* Metrics */}
        <div style={{ display: "flex", gap: "1rem", textAlign: "right", flexShrink: 0 }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: "1rem", color: "hsl(var(--tf-text))" }}>{workout.durata}<span style={{ fontSize: "0.7rem", fontWeight: 400, marginLeft: 2 }}>min</span></p>
            {workout.distanza && <p style={{ fontSize: "0.72rem", color: "hsl(var(--tf-text-muted))" }}>{workout.distanza.toFixed(1)} km</p>}
          </div>
          <Badge color={badge.color}>{badge.label}</Badge>
        </div>
      </div>
    </Link>
  );
}