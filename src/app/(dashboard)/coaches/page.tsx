"use client";

import { useEffect, useState } from "react";
import { Input } from "@frontend/components/ui/Input";
import { CoachCard } from "@frontend/components/coach/CoachCard";
import type { User } from "@backend/domain/model/types";
import { RuoloEnum } from "@backend/domain/model/enums";

const MOCK_COACHES: (User & { specializzazione: string; rating: number })[] = [
    { id: "c1", nome: "Marco", cognome: "Ferrari", email: "mferrari@trackfit.it", ruolo: RuoloEnum.COACH, createdat: "", specializzazione: "Running", rating: 4.8 },
    { id: "c2", nome: "Giulia", cognome: "Bianchi", email: "gbianchi@trackfit.it", ruolo: RuoloEnum.COACH, createdat: "", specializzazione: "Crossfit", rating: 4.6 },
    { id: "c3", nome: "Luca", cognome: "Esposito", email: "lesposito@trackfit.it", ruolo: RuoloEnum.COACH, createdat: "", specializzazione: "Yoga", rating: 4.9 },
    { id: "c4", nome: "Sara", cognome: "Romano", email: "sromano@trackfit.it", ruolo: RuoloEnum.COACH, createdat: "", specializzazione: "Nuoto", rating: 4.5 },
    { id: "c5", nome: "Andrea", cognome: "Conti", email: "aconti@trackfit.it", ruolo: RuoloEnum.COACH, createdat: "", specializzazione: "Ciclismo", rating: 4.7 },
    { id: "c6", nome: "Elena", cognome: "Greco", email: "egrecomailtrackfit.it", ruolo: RuoloEnum.COACH, createdat: "", specializzazione: "Pilates", rating: 4.4 },
];

export default function CoachesPage() {
    const [coaches, setCoaches] = useState(MOCK_COACHES);
    const [search, setSearch] = useState("");

    const filtered = coaches.filter((c) =>
        `${c.nome} ${c.cognome} ${c.specializzazione}`.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={{ maxWidth: 1000, margin: "0 auto" }} className="animate-fadeIn">
            <div style={{ marginBottom: "1.5rem" }}>
                <h1 style={{ fontSize: "1.6rem", fontWeight: 800 }}>Coach</h1>
                <p style={{ color: "hsl(var(--tf-text-muted))", fontSize: "0.875rem", marginTop: 2 }}>
                    Scegli il tuo allenatore e prenota una sessione
                </p>
            </div>

            {/* Search */}
            <div style={{ maxWidth: 400, marginBottom: "1.5rem" }}>
                <Input
                    id="search-coach"
                    placeholder="Cerca per nome o specializzazione…"
                    icon="🔍"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {filtered.length === 0 ? (
                <p style={{ color: "hsl(var(--tf-text-muted))" }}>Nessun coach trovato</p>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
                    {filtered.map((c) => <CoachCard key={c.id} coach={c} />)}
                </div>
            )}
        </div>
    );
}
