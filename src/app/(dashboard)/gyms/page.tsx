"use client";

import { useState } from "react";
import { Badge } from "@frontend/components/ui/Badge";
import { Button } from "@frontend/components/ui/Button";
import { Card } from "@frontend/components/ui/Card";
import { CourseCard } from "@frontend/components/gym/CourseCard";
import type { Struttura, Corso } from "@backend/domain/model/types";

const MOCK_GYMS: { struttura: Struttura; corsi: Corso[] }[] = [
    {
        struttura: { id: "g1", piva: "12345678901", cun: "CUN001", denominazione: "FitZone Napoli", indirizzo: "Via Toledo 120, 80134 Napoli", stato: "Attiva", gestoreid: "ge1" },
        corsi: [
            { id: "co1", strutturaid: "g1", nome: "Spinning avanzato", dataora: new Date(Date.now() + 86400000).toISOString(), capacitamassima: 15, postioccupati: 10, durata: 60 },
            { id: "co2", strutturaid: "g1", nome: "Yoga mattutino", dataora: new Date(Date.now() + 172800000).toISOString(), capacitamassima: 20, postioccupati: 20, durata: 60 },
        ],
    },
    {
        struttura: { id: "g2", piva: "98765432109", cun: "CUN002", denominazione: "PowerGym Salerno", indirizzo: "Corso Vittorio Emanuele 45, 84100 Salerno", stato: "Attiva", gestoreid: "ge2" },
        corsi: [
            { id: "co3", strutturaid: "g2", nome: "Crossfit Bootcamp", dataora: new Date(Date.now() + 259200000).toISOString(), capacitamassima: 12, postioccupati: 5, durata: 45 },
            { id: "co4", strutturaid: "g2", nome: "Pilates", dataora: new Date(Date.now() + 345600000).toISOString(), capacitamassima: 10, postioccupati: 8, durata: 55 },
        ],
    },
];

export default function GymsPage() {
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [booking, setBooking] = useState<string | null>(null);
    const [notify, setNotify] = useState<string | null>(null);

    const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

    const handleBook = async (corsoid: string) => {
        setBooking(corsoid);
        await new Promise((r) => setTimeout(r, 900));
        setBooking(null);
        setNotify(corsoid);
        setTimeout(() => setNotify(null), 3000);
    };

    return (
        <div style={{ maxWidth: 900, margin: "0 auto" }} className="animate-fadeIn">
            <div style={{ marginBottom: "1.5rem" }}>
                <h1 style={{ fontSize: "1.6rem", fontWeight: 800 }}>Palestre</h1>
                <p style={{ color: "hsl(var(--tf-text-muted))", fontSize: "0.875rem", marginTop: 2 }}>
                    Esplora le strutture e prenota i tuoi corsi
                </p>
            </div>

            {notify && (
                <div className="animate-fadeIn" style={{
                    background: "hsl(var(--tf-accent)/.15)", border: "1px solid hsl(var(--tf-accent)/.4)",
                    borderRadius: "var(--tf-radius-sm)", padding: "0.75rem 1rem",
                    color: "hsl(var(--tf-accent))", marginBottom: "1rem", fontSize: "0.875rem", fontWeight: 600,
                }}>
                    ✅ Prenotazione confermata!
                </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {MOCK_GYMS.map(({ struttura, corsi }) => (
                    <Card key={struttura.id}>
                        {/* Gym header */}
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.25rem" }}>
                                    <h2 style={{ fontSize: "1.05rem", fontWeight: 800 }}>{struttura.denominazione}</h2>
                                    <Badge color={struttura.stato === "Attiva" ? "green" : "gray"}>{struttura.stato}</Badge>
                                </div>
                                <p style={{ fontSize: "0.8rem", color: "hsl(var(--tf-text-muted))" }}>📍 {struttura.indirizzo}</p>
                                <p style={{ fontSize: "0.75rem", color: "hsl(var(--tf-text-muted))", marginTop: 2 }}>
                                    {corsi.length} corsi disponibili
                                </p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => toggle(struttura.id)}>
                                {expanded[struttura.id] ? "▲ Chiudi" : "▼ Corsi"}
                            </Button>
                        </div>

                        {/* Corsi expandable */}
                        {expanded[struttura.id] && (
                            <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }} className="animate-fadeIn">
                                {corsi.map((c) => (
                                    <CourseCard key={c.id} corso={c} onBook={handleBook} loading={booking === c.id} />
                                ))}
                            </div>
                        )}
                    </Card>
                ))}
            </div>
        </div>
    );
}
