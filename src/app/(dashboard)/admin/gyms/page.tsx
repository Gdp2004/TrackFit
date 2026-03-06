"use client";

import { useEffect, useState } from "react";
import { Card } from "@frontend/components/ui/Card";
import { Badge } from "@frontend/components/ui/Badge";
import { Button } from "@frontend/components/ui/Button";

interface Struttura {
    id: string;
    denominazione: string;
    indirizzo: string;
    telefono: string;
    email: string;
    stato: string;
    piva: string;
    createdat: string;
}

export default function AdminGymsPage() {
    const [gyms, setGyms] = useState<Struttura[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const fetchGyms = async (targetPage: number) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/gyms?page=${targetPage}`);
            if (res.ok) {
                const json = await res.json();
                setGyms(json.data);
                setTotalPages(json.meta.totalPages);
                setTotalItems(json.meta.total);
            }
        } catch (error) {
            console.error("Errore recupero palestre:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGyms(page);
    }, [page]);

    return (
        <div className="animate-fadeIn max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-4 border-b border-[hsl(var(--tf-border))]">
                <div>
                    <h1 className="text-3xl font-extrabold mb-1">
                        Gestione Palestre <span className="text-[hsl(var(--tf-primary))]">🏋️</span>
                    </h1>
                    <p className="text-sm text-[hsl(var(--tf-text-muted))]">
                        Visualizza la lista di tutte le palestre registrate (Totale: {totalItems})
                    </p>
                </div>
            </div>

            <Card style={{ padding: 0, overflow: "hidden" }}>
                {loading ? (
                    <div className="p-8 text-center text-[hsl(var(--tf-text-muted))] animate-pulse">
                        Caricamento palestre in corso...
                    </div>
                ) : gyms.length === 0 ? (
                    <div className="p-8 text-center text-[hsl(var(--tf-text-muted))]">
                        Nessuna palestra trovata.
                    </div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                            <thead>
                                <tr style={{ background: "hsl(var(--tf-surface-2))", borderBottom: "1px solid hsl(var(--tf-border))" }}>
                                    <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600 }}>ID Struttura</th>
                                    <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600 }}>Struttura</th>
                                    <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600 }}>Contatti</th>
                                    <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600 }}>Stato / P.IVA</th>
                                </tr>
                            </thead>
                            <tbody>
                                {gyms.map((g, i) => (
                                    <tr key={g.id} style={{ borderBottom: "1px solid hsl(var(--tf-border))", background: i % 2 === 0 ? "transparent" : "hsl(var(--tf-surface-2)/.4)" }}>
                                        <td style={{ padding: "1rem" }}>
                                            <div style={{ fontSize: "0.75rem", color: "hsl(var(--tf-text-muted))", fontFamily: "monospace" }}>{g.id.split("-")[0]}</div>
                                        </td>
                                        <td style={{ padding: "1rem" }}>
                                            <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{g.denominazione}</div>
                                            <div style={{ fontSize: "0.8rem", color: "hsl(var(--tf-text-muted))", marginTop: 2 }}>{g.indirizzo}</div>
                                        </td>
                                        <td style={{ padding: "1rem" }}>
                                            <div>{g.email}</div>
                                            <div style={{ color: "hsl(var(--tf-text-muted))" }}>{g.telefono || "-"}</div>
                                        </td>
                                        <td style={{ padding: "1rem" }}>
                                            <Badge color={g.stato === "Attiva" ? "green" : "gray"}>{g.stato}</Badge>
                                            <div style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "hsl(var(--tf-text-muted))", marginTop: 6 }}>PIVA: {g.piva}</div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination Controls */}
                {!loading && gyms.length > 0 && (
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
