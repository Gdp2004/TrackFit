"use client";

import { Badge } from "@frontend/components/ui/Badge";
import { Button } from "@frontend/components/ui/Button";
import type { Corso } from "@backend/domain/model/types";

interface CourseCardProps { corso: Corso; onBook: (corsoid: string) => void; loading?: boolean; }

export function CourseCard({ corso, onBook, loading }: CourseCardProps) {
    const posti = corso.capacitamassima - corso.postioccupati;
    const pieno = posti <= 0;

    return (
        <div style={{
            background: "hsl(var(--tf-surface-2))",
            borderRadius: "var(--tf-radius-sm)",
            padding: "1rem 1.25rem",
            display: "flex", alignItems: "center", gap: "1rem",
            border: "1px solid hsl(var(--tf-border))",
        }}>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                    <p style={{ fontWeight: 700, fontSize: "0.9rem" }}>{corso.nome}</p>
                    {pieno
                        ? <Badge color="red">Pieno</Badge>
                        : <Badge color="green">{posti} posti lib.</Badge>
                    }
                </div>
                <p style={{ fontSize: "0.78rem", color: "hsl(var(--tf-text-muted))" }}>
                    📅 {new Date(corso.dataora).toLocaleString("it-IT", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    {" · "}⏱️ {corso.durata} min
                </p>
            </div>
            <Button
                size="sm"
                variant={pieno ? "ghost" : "primary"}
                onClick={() => onBook(corso.id)}
                isLoading={loading}
            >
                {pieno ? "Lista attesa" : "Prenota"}
            </Button>
        </div>
    );
}
