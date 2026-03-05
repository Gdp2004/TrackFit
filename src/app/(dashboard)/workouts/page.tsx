"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@frontend/contexts/AuthContext";
import { Button } from "@frontend/components/ui/Button";
import { Badge } from "@frontend/components/ui/Badge";
import { WorkoutCard } from "@frontend/components/workout/WorkoutCard";
import type { Workout } from "@backend/domain/model/types";
import { WorkoutStatoEnum, TipoWorkoutEnum } from "@backend/domain/model/enums";

const MOCK: Workout[] = [
    { id: "1", userid: "u1", athleteName: "Mario Rossi", tipo: "CORSA", dataora: new Date(Date.now() - 86400000).toISOString(), durata: 45, stato: WorkoutStatoEnum.CONSOLIDATA, distanza: 8.3, calorie: 420, sorgente: "TRACKING" },
    { id: "2", userid: "u1", athleteName: "Mario Rossi", tipo: "PALESTRA", dataora: new Date(Date.now() - 172800000).toISOString(), durata: 60, stato: WorkoutStatoEnum.CONSOLIDATA, calorie: 280, sorgente: "TRACKING" },
    { id: "3", userid: "u2", athleteName: "Luigi Bianchi", tipo: "CICLISMO", dataora: new Date(Date.now() + 86400000).toISOString(), durata: 90, stato: WorkoutStatoEnum.PIANIFICATA, distanza: 25, sorgente: "TRACKING" },
    { id: "4", userid: "u3", athleteName: "Anna Neri", tipo: "NUOTO", dataora: new Date(Date.now() - 259200000).toISOString(), durata: 40, stato: WorkoutStatoEnum.CONSOLIDATA, distanza: 1.5, calorie: 300, sorgente: "TRACKING" },
    { id: "5", userid: "u2", athleteName: "Luigi Bianchi", tipo: "YOGA", dataora: new Date(Date.now() - 345600000).toISOString(), durata: 60, stato: WorkoutStatoEnum.CONSOLIDATA, sorgente: "TRACKING" },
];

type FilterStato = "TUTTI" | WorkoutStatoEnum;
type FilterTipo = "TUTTI" | TipoWorkoutEnum;

export default function WorkoutsPage() {
    const { user, ruolo } = useAuth();
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStato, setFilterStato] = useState<FilterStato>("TUTTI");
    const [filterTipo, setFilterTipo] = useState<FilterTipo>("TUTTI");

    useEffect(() => {
        if (!user || !ruolo) return;
        const endpoint = ruolo === "COACH"
            ? `/api/workouts?coachid=${user.id}`
            : `/api/workouts?userid=${user.id}`;

        fetch(endpoint)
            .then((r) => r.json())
            .then((d: Workout[]) => setWorkouts(Array.isArray(d) && d.length > 0 ? d : MOCK))
            .catch(() => setWorkouts(MOCK))
            .finally(() => setLoading(false));
    }, [user, ruolo]);


    const STATI: FilterStato[] = ["TUTTI", WorkoutStatoEnum.PIANIFICATA, WorkoutStatoEnum.IN_CORSO, WorkoutStatoEnum.CONSOLIDATA, WorkoutStatoEnum.INTERROTTA];
    const filtered = workouts.filter((w) => {
        const okStato = filterStato === "TUTTI" || w.stato === filterStato;
        const okTipo = filterTipo === "TUTTI" || w.tipo === filterTipo;
        return okStato && okTipo;
    }).sort((a, b) => new Date(b.dataora).getTime() - new Date(a.dataora).getTime());

    const labelStato: Record<string, string> = {
        TUTTI: "Tutti", PIANIFICATA: "Pianificate", IN_CORSO: "In corso", CONSOLIDATA: "Consolidate", INTERROTTA: "Interrotte",
    };

    return (
        <div style={{ maxWidth: 860, margin: "0 auto" }} className="animate-fadeIn">
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                <div>
                    <h1 style={{ fontSize: "1.6rem", fontWeight: 800 }}>Allenamenti</h1>
                    <p style={{ color: "hsl(var(--tf-text-muted))", fontSize: "0.875rem", marginTop: 2 }}>
                        {workouts.length} sessioni totali
                    </p>
                </div>
                <Link href="/workouts/new">
                    <Button>🏃 Nuova sessione</Button>
                </Link>
            </div>

            {/* Filters row */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
                {/* Stato pills */}
                {STATI.map((s) => (
                    <button
                        key={s}
                        onClick={() => setFilterStato(s)}
                        style={{
                            padding: "0.3rem 0.875rem", borderRadius: 999,
                            fontSize: "0.78rem", fontWeight: 600, border: "none",
                            cursor: "pointer",
                            background: filterStato === s ? "hsl(var(--tf-primary))" : "hsl(var(--tf-surface-2))",
                            color: filterStato === s ? "#fff" : "hsl(var(--tf-text-muted))",
                            transition: "all var(--tf-transition)",
                        }}
                    >
                        {labelStato[s]}
                    </button>
                ))}

                {/* Tipo select */}
                <select
                    value={filterTipo}
                    onChange={(e) => setFilterTipo(e.target.value as FilterTipo)}
                    className="tf-input"
                    style={{ width: "auto", marginLeft: "auto", fontSize: "0.8rem", height: 32, padding: "0 0.75rem" }}
                >
                    <option value="TUTTI">Tutti i tipi</option>
                    {Object.values(TipoWorkoutEnum).map((t) => (
                        <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>
                    ))}
                </select>
            </div>

            {/* List */}
            {loading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="tf-card animate-pulse" style={{ height: 72, background: "hsl(var(--tf-surface))" }} />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="tf-card" style={{ textAlign: "center", padding: "3rem" }}>
                    <p style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🏁</p>
                    <p style={{ color: "hsl(var(--tf-text-muted))" }}>Nessun allenamento trovato con i filtri selezionati</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {filtered.map((w) => <WorkoutCard key={w.id} workout={w} />)}
                </div>
            )}
        </div>
    );
}
