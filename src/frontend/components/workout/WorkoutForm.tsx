"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@frontend/contexts/AuthContext";
import { Input } from "@frontend/components/ui/Input";
import { Button } from "@frontend/components/ui/Button";
import { TipoWorkoutEnum } from "@backend/domain/model/enums";

const TIPI = Object.values(TipoWorkoutEnum);
const SPORT_ICON: Record<string, string> = {
    CORSA: "🏃", CICLISMO: "🚴", NUOTO: "🏊", PALESTRA: "🏋️", YOGA: "🧘", CAMMINO: "🚶", ALTRO: "⚡",
};

export function WorkoutForm() {
    const { user } = useAuth();
    const router = useRouter();
    const [form, setForm] = useState({
        tipo: TipoWorkoutEnum.CORSA,
        dataOra: new Date(Date.now() + 3600000).toISOString().slice(0, 16), // +1h
        durata: 45,
        obiettivo: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const set = (field: string) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
            setForm((f) => ({ ...f, [field]: e.target.value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) { setError("Devi essere autenticato"); return; }
        setError(null);
        setLoading(true);
        try {
            const res = await fetch("/api/workouts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.id,
                    tipo: form.tipo,
                    dataOra: new Date(form.dataOra).toISOString(),
                    durata: Number(form.durata),
                    obiettivo: form.obiettivo || undefined,
                }),
            });
            if (!res.ok) {
                const d = await res.json();
                setError(d.error ?? "Errore del server");
                setLoading(false);
                return;
            }
            router.push("/workouts");
        } catch {
            setError("Errore di rete");
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Tipo selector */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "hsl(var(--tf-text-muted))" }}>Tipo di allenamento</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
                    {TIPI.map((t) => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => setForm((f) => ({ ...f, tipo: t }))}
                            style={{
                                padding: "0.625rem 0.5rem",
                                borderRadius: "var(--tf-radius-sm)",
                                border: `2px solid ${form.tipo === t ? "hsl(var(--tf-primary))" : "hsl(var(--tf-border))"}`,
                                background: form.tipo === t ? "hsl(var(--tf-primary)/.15)" : "hsl(var(--tf-surface-2))",
                                color: form.tipo === t ? "hsl(var(--tf-primary))" : "hsl(var(--tf-text-muted))",
                                cursor: "pointer",
                                fontWeight: 600,
                                fontSize: "0.72rem",
                                display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem",
                                transition: "all var(--tf-transition)",
                            }}
                        >
                            <span style={{ fontSize: "1.25rem" }}>{SPORT_ICON[t]}</span>
                            {t.charAt(0) + t.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>
            </div>

            <Input
                id="dataOra"
                label="Data e ora"
                type="datetime-local"
                value={form.dataOra}
                onChange={set("dataOra")}
                required
            />

            {/* Durata slider */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "hsl(var(--tf-text-muted))" }}>
                    Durata: <strong style={{ color: "hsl(var(--tf-text))" }}>{form.durata} min</strong>
                </label>
                <input
                    type="range" min={5} max={240} step={5}
                    value={form.durata}
                    onChange={set("durata")}
                    style={{ accentColor: "hsl(var(--tf-primary))", width: "100%" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "hsl(var(--tf-text-muted))" }}>
                    <span>5 min</span><span>240 min</span>
                </div>
            </div>

            {/* Obiettivo */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "hsl(var(--tf-text-muted))" }}>
                    Obiettivo (opzionale)
                </label>
                <textarea
                    placeholder="Es. Corsa lenta in Zona 2, 8 km"
                    value={form.obiettivo}
                    onChange={set("obiettivo")}
                    rows={3}
                    className="tf-input"
                    style={{ resize: "vertical" }}
                />
            </div>

            {error && (
                <p style={{ padding: "0.75rem", borderRadius: "var(--tf-radius-sm)", background: "hsl(var(--tf-danger)/.15)", color: "hsl(var(--tf-danger))", fontSize: "0.8rem" }}>
                    ⚠️ {error}
                </p>
            )}

            <div style={{ display: "flex", gap: "0.75rem" }}>
                <Button type="button" variant="ghost" onClick={() => router.back()} style={{ flex: 1 }}>
                    Annulla
                </Button>
                <Button type="submit" isLoading={loading} style={{ flex: 2 }}>
                    🗓️ Pianifica sessione
                </Button>
            </div>
        </form>
    );
}
