"use client";

import { useEffect, useState } from "react";
import { Card } from "@frontend/components/ui/Card";
import { Badge } from "@frontend/components/ui/Badge";
import { Button } from "@frontend/components/ui/Button";
import { WorkoutStatoEnum } from "@backend/domain/model/enums";

// Sport icons mapping
const SPORT_ICON: Record<string, string> = {
    CORSA: "🏃", CICLISMO: "🚴", NUOTO: "🏊", PALESTRA: "🏋️", YOGA: "🧘", CAMMINO: "🚶", ALTRO: "⚡",
};

interface UserRef {
    id: string;
    nome: string;
    cognome: string;
    email: string;
}

interface WorkoutAdmin {
    id: string;
    tipo: string;
    dataora: string;
    durata: number;
    stato: WorkoutStatoEnum;
    distanza?: number;
    calorie?: number;
    sorgente: string;
    user: UserRef;
}

export default function AdminWorkoutsPage() {
    const [workouts, setWorkouts] = useState<WorkoutAdmin[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const fetchWorkouts = async (targetPage: number) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/workouts?page=${targetPage}`);
            if (res.ok) {
                const json = await res.json();
                setWorkouts(json.data);
                setTotalPages(json.meta.totalPages);
                setTotalItems(json.meta.total);
            }
        } catch (error) {
            console.error("Errore recupero allenamenti:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWorkouts(page);
    }, [page]);

    return (
        <div className="animate-fadeIn max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-4 border-b border-[hsl(var(--tf-border))]">
                <div>
                    <h1 className="text-3xl font-extrabold mb-1">
                        Tutti gli Allenamenti <span className="text-[hsl(var(--tf-primary))]">🏃</span>
                    </h1>
                    <p className="text-sm text-[hsl(var(--tf-text-muted))]">
                        Visualizza gli allenamenti di tutti gli atleti sulla piattaforma (Totale: {totalItems})
                    </p>
                </div>
            </div>

            <Card style={{ padding: 0, overflow: "hidden" }}>
                {loading ? (
                    <div className="p-8 text-center text-[hsl(var(--tf-text-muted))] animate-pulse">
                        Caricamento allenamenti in corso...
                    </div>
                ) : workouts.length === 0 ? (
                    <div className="p-8 text-center text-[hsl(var(--tf-text-muted))]">
                        Nessun allenamento trovato.
                    </div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                            <thead>
                                <tr style={{ background: "hsl(var(--tf-surface-2))", borderBottom: "1px solid hsl(var(--tf-border))" }}>
                                    <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600 }}>Atleta</th>
                                    <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600 }}>Tipo e Data</th>
                                    <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600 }}>Dettagli</th>
                                    <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600 }}>Stato / Fonte</th>
                                </tr>
                            </thead>
                            <tbody>
                                {workouts.map((w, i) => (
                                    <tr key={w.id} style={{ borderBottom: "1px solid hsl(var(--tf-border))", background: i % 2 === 0 ? "transparent" : "hsl(var(--tf-surface-2)/.4)" }}>
                                        <td style={{ padding: "1rem" }}>
                                            <div style={{ fontWeight: 600 }}>
                                                {w.user?.nome} {w.user?.cognome}
                                            </div>
                                            <div style={{ fontSize: "0.75rem", color: "hsl(var(--tf-text-muted))", marginTop: 2 }}>{w.user?.email}</div>
                                        </td>
                                        <td style={{ padding: "1rem" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 700 }}>
                                                <span style={{ fontSize: "1.1rem" }}>{SPORT_ICON[w.tipo] || "⚡"}</span>
                                                {w.tipo}
                                            </div>
                                            <div style={{ fontSize: "0.8rem", color: "hsl(var(--tf-text-muted))", marginTop: 4 }}>
                                                {new Date(w.dataora).toLocaleString("it-IT", {
                                                    dateStyle: "short",
                                                    timeStyle: "short"
                                                })}
                                            </div>
                                        </td>
                                        <td style={{ padding: "1rem" }}>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                                <span style={{ fontWeight: 600 }}>⏱️ {w.durata} min</span>
                                                {w.distanza !== undefined && w.distanza > 0 && (
                                                    <span style={{ color: "hsl(var(--tf-text-muted))", fontSize: "0.8rem" }}>📍 {w.distanza} km</span>
                                                )}
                                                {w.calorie !== undefined && w.calorie > 0 && (
                                                    <span style={{ color: "hsl(var(--tf-text-muted))", fontSize: "0.8rem" }}>🔥 {w.calorie} kcal</span>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ padding: "1rem" }}>
                                            <Badge color={w.stato === WorkoutStatoEnum.CONSOLIDATA ? "green" : w.stato === WorkoutStatoEnum.PIANIFICATA ? "yellow" : "gray"}>
                                                {w.stato}
                                            </Badge>
                                            <div style={{ fontSize: "0.7rem", color: "hsl(var(--tf-text-muted))", marginTop: 6, fontWeight: 600 }}>
                                                via {w.sorgente}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination Controls */}
                {!loading && workouts.length > 0 && (
                    <div style={{
                        padding: "1rem",
                        borderTop: "1px solid hsl(var(--tf-border))",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        background: "hsl(var(--tf-surface-2))"
                    }}>
                        <Button
                            variant="secondary"
                            size="sm"
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                        >
                            ← Precedente
                        </Button>
                        <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                            Pagina {page} di {totalPages}
                        </span>
                        <Button
                            variant="secondary"
                            size="sm"
                            disabled={page >= totalPages}
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        >
                            Successiva →
                        </Button>
                    </div>
                )}
            </Card>
        </div>
    );
}
