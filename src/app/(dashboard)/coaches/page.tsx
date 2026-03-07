"use client";

import { useEffect, useState } from "react";
import { Input } from "@frontend/components/ui/Input";
import { CoachCard } from "@frontend/components/coach/CoachCard";
import type { CoachWithUser } from "@backend/domain/model/types";

export default function CoachesPage() {
    const [coaches, setCoaches] = useState<CoachWithUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const fetchCoaches = async () => {
            try {
                const res = await fetch("/api/coaches");
                const result = await res.json();
                if (!res.ok) throw new Error(result.error || "Errore nel caricamento dei coach");
                setCoaches(result.data || []);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchCoaches();
    }, []);

    const filtered = coaches.filter((c) =>
        `${c.user.nome} ${c.user.cognome} ${c.specializzazione}`.toLowerCase().includes(search.toLowerCase())
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

            {loading ? (
                <div style={{ padding: "2rem", textAlign: "center", color: "hsl(var(--tf-text-muted))" }}>
                    Caricamento roster coach in corso...
                </div>
            ) : error ? (
                <div style={{ padding: "1rem", color: "hsl(var(--tf-danger))", background: "hsl(var(--tf-danger)/0.1)" }}>
                    {error}
                </div>
            ) : filtered.length === 0 ? (
                <p style={{ color: "hsl(var(--tf-text-muted))" }}>Nessun coach trovato</p>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
                    {/* We map CoachWithUser to the intersection type expected by CoachCard */}
                    {filtered.map((c) => (
                        <CoachCard
                            key={c.id}
                            coach={{
                                ...c.user,
                                specializzazione: c.specializzazione,
                                rating: c.rating,
                                bio: c.bio,
                                telefono: c.telefono,
                                disponibilita: c.disponibilita,
                                coachid: c.id
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
