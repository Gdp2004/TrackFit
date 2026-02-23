"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@frontend/contexts/AuthContext";
import { Card } from "@frontend/components/ui/Card";
import { Button } from "@frontend/components/ui/Button";
import { WorkoutDetail } from "@frontend/components/workout/WorkoutDetail";
import type { Workout } from "@backend/domain/model/types";
import { WorkoutStatoEnum } from "@backend/domain/model/enums";

// Mock fallbacks
const MOCK_MAP: Record<string, Workout> = {
    "1": { id: "1", userid: "u1", tipo: "CORSA", dataora: new Date(Date.now() - 86400000).toISOString(), durata: 45, stato: WorkoutStatoEnum.CONSOLIDATA, distanza: 8.3, calorie: 420, percezionessforzo: 6, obiettivo: "Zona 2 lenta", sorgente: "TRACKING" },
    "2": { id: "2", userid: "u1", tipo: "PALESTRA", dataora: new Date(Date.now() - 172800000).toISOString(), durata: 60, stato: WorkoutStatoEnum.CONSOLIDATA, calorie: 280, percezionessforzo: 8, note: "Nuovo massimale squat 100kg", sorgente: "TRACKING" },
};

export default function WorkoutDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [workout, setWorkout] = useState<Workout | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user || !id) return;
        // Try fetching – fallback to mock
        fetch(`/api/workouts?userid=${user.id}`)
            .then((r) => r.json())
            .then((list: Workout[]) => {
                const found = Array.isArray(list) ? list.find((w) => w.id === id) : null;
                setWorkout(found ?? MOCK_MAP[id] ?? null);
            })
            .catch(() => setWorkout(MOCK_MAP[id] ?? null))
            .finally(() => setLoading(false));
    }, [user, id]);

    return (
        <div style={{ maxWidth: 700, margin: "0 auto" }} className="animate-fadeIn">
            <div style={{ marginBottom: "1.25rem" }}>
                <Link href="/workouts" style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", color: "hsl(var(--tf-text-muted))", fontSize: "0.85rem", textDecoration: "none" }}>
                    ← Torna agli allenamenti
                </Link>
            </div>

            {loading ? (
                <div className="tf-card animate-pulse" style={{ height: 320 }} />
            ) : error || !workout ? (
                <Card style={{ textAlign: "center", padding: "3rem" }}>
                    <p style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>❓</p>
                    <p style={{ color: "hsl(var(--tf-text-muted))" }}>Allenamento non trovato</p>
                    <Link href="/workouts"><Button style={{ marginTop: "1rem" }}>Torna alla lista</Button></Link>
                </Card>
            ) : (
                <Card variant="elevated">
                    <WorkoutDetail workout={workout} />
                </Card>
            )}
        </div>
    );
}
