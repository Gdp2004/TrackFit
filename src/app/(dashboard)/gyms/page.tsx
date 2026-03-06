"use client";

import { useEffect, useState } from "react";
import { Badge } from "@frontend/components/ui/Badge";
import { Button } from "@frontend/components/ui/Button";
import { Card } from "@frontend/components/ui/Card";
import { CourseCard } from "@frontend/components/gym/CourseCard";
import type { Struttura, Corso } from "@backend/domain/model/types";
import { useAuth } from "@frontend/contexts/AuthContext";

interface GymWithCorsi {
    struttura: Struttura;
    corsi: Corso[];
}

export default function GymsPage() {
    const [gyms, setGyms] = useState<GymWithCorsi[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [booking, setBooking] = useState<string | null>(null);
    const [notify, setNotify] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const fetchGyms = async () => {
            try {
                // search="" → restituisce TUTTE le strutture
                const res = await fetch(`/api/gyms?search=`);
                if (!res.ok) return;
                const strutture: Struttura[] = await res.json();

                // Per ogni struttura recupera i corsi in parallelo
                const gymsWithCorsi = await Promise.all(
                    strutture.map(async (struttura) => {
                        const corsiRes = await fetch(`/api/gyms?strutturaid=${struttura.id}`);
                        const corsi: Corso[] = corsiRes.ok ? await corsiRes.json() : [];
                        return { struttura, corsi };
                    })
                );
                setGyms(gymsWithCorsi);
            } finally {
                setLoading(false);
            }
        };
        fetchGyms();
    }, []);

    const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

    const { user } = useAuth();

    const handleBook = async (corsoid: string, strutturaid: string) => {
        if (!user) {
            alert("Devi effettuare l'accesso per prenotare");
            return;
        }
        setBooking(corsoid);
        try {
            const res = await fetch("/api/gyms/corsi/prenotazioni", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    corsoid,
                    strutturaid,
                    userid: user.id
                }),
            });
            if (res.ok) {
                setNotify(corsoid);
                setTimeout(() => setNotify(null), 3000);
            } else {
                const data = await res.json();
                alert(typeof data.error === "string" ? data.error : JSON.stringify(data.error));
            }
        } finally {
            setBooking(null);
        }
    };

    const filtered = gyms.filter(
        ({ struttura }) =>
            !search ||
            struttura.denominazione?.toLowerCase().includes(search.toLowerCase()) ||
            struttura.indirizzo?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return (
        <div style={{ textAlign: "center", padding: "4rem" }}>
            <div style={{ fontSize: "2rem" }}>⏳</div>
            <p>Caricamento palestre...</p>
        </div>
    );

    return (
        <div style={{ maxWidth: 900, margin: "0 auto" }} className="animate-fadeIn">
            <div style={{ marginBottom: "1.5rem" }}>
                <h1 style={{ fontSize: "1.6rem", fontWeight: 800 }}>Palestre</h1>
                <p style={{ color: "hsl(var(--tf-text-muted))", fontSize: "0.875rem", marginTop: 2 }}>
                    Esplora le strutture e prenota i tuoi corsi
                </p>
            </div>

            {/* Search */}
            <input
                placeholder="🔍 Cerca per nome o città..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                    width: "100%", maxWidth: 360,
                    padding: "0.6rem 0.85rem",
                    borderRadius: "var(--tf-radius-sm)",
                    border: "1px solid hsl(var(--tf-border))",
                    background: "hsl(var(--tf-bg))",
                    color: "hsl(var(--tf-text))",
                    fontSize: "0.875rem",
                    outline: "none",
                    marginBottom: "1.25rem",
                }}
            />

            {notify && (
                <div className="animate-fadeIn" style={{
                    background: "hsl(var(--tf-accent)/.15)", border: "1px solid hsl(var(--tf-accent)/.4)",
                    borderRadius: "var(--tf-radius-sm)", padding: "0.75rem 1rem",
                    color: "hsl(var(--tf-accent))", marginBottom: "1rem", fontSize: "0.875rem", fontWeight: 600,
                }}>
                    ✅ Prenotazione confermata!
                </div>
            )}

            {filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem", color: "hsl(var(--tf-text-muted))" }}>
                    <div style={{ fontSize: "2rem" }}>🏋️</div>
                    <p>Nessuna palestra trovata</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {filtered.map(({ struttura, corsi }) => (
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
                                    {corsi.length === 0 ? (
                                        <p style={{ fontSize: "0.8rem", color: "hsl(var(--tf-text-muted))", padding: "0.5rem 0" }}>
                                            Nessun corso disponibile al momento.
                                        </p>
                                    ) : (
                                        corsi.map((c) => (
                                            <CourseCard key={c.id} corso={c} onBook={() => handleBook(c.id, c.strutturaid)} loading={booking === c.id} />
                                        ))
                                    )}
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
