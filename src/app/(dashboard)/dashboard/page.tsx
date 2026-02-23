"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@frontend/contexts/AuthContext";
import { Card } from "@frontend/components/ui/Card";
import { Button } from "@frontend/components/ui/Button";
import { Badge } from "@frontend/components/ui/Badge";
import { WorkoutCard } from "@frontend/components/workout/WorkoutCard";
import type { Workout } from "@backend/domain/model/types";
import { WorkoutStatoEnum } from "@backend/domain/model/enums";

const SPORT_ICON: Record<string, string> = {
  CORSA: "🏃", CICLISMO: "🚴", NUOTO: "🏊", PALESTRA: "🏋️", YOGA: "🧘", CAMMINO: "🚶", ALTRO: "⚡",
};

// Mock data per demo visuale
const MOCK_WORKOUTS: Workout[] = [
  { id: "1", userid: "u1", tipo: "CORSA", dataora: new Date(Date.now() - 86400000).toISOString(), durata: 45, stato: WorkoutStatoEnum.CONSOLIDATA, distanza: 8.3, calorie: 420, sorgente: "TRACKING" },
  { id: "2", userid: "u1", tipo: "PALESTRA", dataora: new Date(Date.now() - 172800000).toISOString(), durata: 60, stato: WorkoutStatoEnum.CONSOLIDATA, calorie: 280, sorgente: "TRACKING" },
  { id: "3", userid: "u1", tipo: "CICLISMO", dataora: new Date(Date.now() + 86400000).toISOString(), durata: 90, stato: WorkoutStatoEnum.PIANIFICATA, distanza: 25, sorgente: "TRACKING" },
];

interface StatCardProps { icon: string; label: string; value: string; sub?: string; accent?: string; }
function StatCard({ icon, label, value, sub, accent = "hsl(var(--tf-primary))" }: StatCardProps) {
  return (
    <Card style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span style={{
          width: 36, height: 36, borderRadius: 10,
          background: `${accent}1a`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem",
        }}>{icon}</span>
        <span style={{ fontSize: "0.78rem", color: "hsl(var(--tf-text-muted))", fontWeight: 500 }}>{label}</span>
      </div>
      <p style={{ fontSize: "2rem", fontWeight: 800, lineHeight: 1, color: "hsl(var(--tf-text))" }}>{value}</p>
      {sub && <p style={{ fontSize: "0.75rem", color: "hsl(var(--tf-text-muted))" }}>{sub}</p>}
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loadingW, setLoadingW] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/workouts?userid=${user.id}`)
      .then((r) => r.json())
      .then((data: Workout[]) => setWorkouts(Array.isArray(data) ? data : MOCK_WORKOUTS))
      .catch(() => setWorkouts(MOCK_WORKOUTS))
      .finally(() => setLoadingW(false));
  }, [user]);

  const displayWorkouts = workouts.length > 0 ? workouts : MOCK_WORKOUTS;
  const recent = displayWorkouts.filter((w) => w.stato === WorkoutStatoEnum.CONSOLIDATA).slice(0, 3);
  const upcoming = displayWorkouts.filter((w) => w.stato === WorkoutStatoEnum.PIANIFICATA).slice(0, 2);
  const totalKm = displayWorkouts.reduce((s, w) => s + (w.distanza ?? 0), 0);
  const totalMin = displayWorkouts.reduce((s, w) => s + w.durata, 0);
  const sessioni = displayWorkouts.filter((w) => w.stato === WorkoutStatoEnum.CONSOLIDATA).length;

  const nome = user?.user_metadata?.nome ?? "Atleta";

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }} className="animate-fadeIn">
      {/* Greeting */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.25rem" }}>
          Ciao, {nome}! 👋
        </h1>
        <p style={{ color: "hsl(var(--tf-text-muted))", fontSize: "0.9rem" }}>
          {new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2rem" }} className="grid-cols-1 sm:grid-cols-3">
        <StatCard icon="📍" label="Km percorsi (mese)" value={`${totalKm.toFixed(1)}`} sub="km totali" accent="hsl(var(--tf-primary))" />
        <StatCard icon="⏱️" label="Minuti allenati" value={`${totalMin}`} sub="minuti totali" accent="hsl(158 64% 52%)" />
        <StatCard icon="✅" label="Sessioni completate" value={`${sessioni}`} sub="questo mese" accent="hsl(38 92% 50%)" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.5rem", alignItems: "start" }}>
        {/* Recent workouts */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <h2 style={{ fontWeight: 700, fontSize: "1rem" }}>Allenamenti recenti</h2>
            <Link href="/workouts" style={{ fontSize: "0.8rem", color: "hsl(var(--tf-primary))" }}>Vedi tutti →</Link>
          </div>
          {loadingW ? (
            <p style={{ color: "hsl(var(--tf-text-muted))", fontSize: "0.875rem" }} className="animate-pulse">Caricamento…</p>
          ) : recent.length === 0 ? (
            <Card style={{ textAlign: "center", padding: "2.5rem" }}>
              <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🏁</p>
              <p style={{ color: "hsl(var(--tf-text-muted))", fontSize: "0.9rem" }}>Nessun allenamento completato</p>
              <Link href="/workouts/new">
                <Button style={{ marginTop: "1rem" }}>Inizia ora</Button>
              </Link>
            </Card>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {recent.map((w) => <WorkoutCard key={w.id} workout={w} />)}
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Quick actions */}
          <Card title="Azioni rapide">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <Link href="/workouts/new">
                <Button style={{ width: "100%", justifyContent: "flex-start", gap: "0.75rem" }}>
                  🏃 Nuova sessione
                </Button>
              </Link>
              <Link href="/reports">
                <Button variant="secondary" style={{ width: "100%", justifyContent: "flex-start", gap: "0.75rem" }}>
                  📊 Vedi report
                </Button>
              </Link>
              <Link href="/coaches">
                <Button variant="secondary" style={{ width: "100%", justifyContent: "flex-start", gap: "0.75rem" }}>
                  🎯 Prenota coach
                </Button>
              </Link>
            </div>
          </Card>

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <Card title="Prossimi allenamenti">
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {upcoming.map((w) => (
                  <div key={w.id} style={{
                    display: "flex", alignItems: "center", gap: "0.75rem",
                    padding: "0.625rem 0.75rem",
                    borderRadius: "var(--tf-radius-sm)",
                    background: "hsl(var(--tf-surface-2))",
                  }}>
                    <span style={{ fontSize: "1.25rem" }}>{SPORT_ICON[w.tipo] ?? "⚡"}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: "0.85rem" }}>{w.tipo}</p>
                      <p style={{ fontSize: "0.75rem", color: "hsl(var(--tf-text-muted))" }}>
                        {new Date(w.dataora).toLocaleDateString("it-IT")} · {w.durata} min
                      </p>
                    </div>
                    <Badge color="yellow">Pianificata</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
