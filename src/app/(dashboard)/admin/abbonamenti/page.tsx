"use client";

import { useEffect, useState } from "react";
import { Card } from "@frontend/components/ui/Card";
import { Badge } from "@frontend/components/ui/Badge";
import { Button } from "@frontend/components/ui/Button";

interface UserRef {
    id: string;
    nome: string;
    cognome: string;
    email: string;
}

interface TipoRef {
    id: string;
    nome: string;
    prezzo: number;
    strutturaid: string;
    struttura_nome: string;
}

interface AbbonamentoAdmin {
    id: string;
    datainizio: string;
    datafine: string;
    stato: string;
    rinnovoautomatico: boolean;
    user: UserRef;
    tipo: TipoRef | null;
}

const STATO_COLOR: Record<string, "green" | "red" | "yellow" | "gray"> = {
    ATTIVO: "green",
    SCADUTO: "red",
    SOSPESO: "yellow",
};

export default function AdminAbbonamentiPage() {
    const [abbonamenti, setAbbonamenti] = useState<AbbonamentoAdmin[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const fetchAbbonamenti = async (targetPage: number) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/abbonamenti?page=${targetPage}`);
            if (res.ok) {
                const json = await res.json();
                setAbbonamenti(json.data);
                setTotalPages(json.meta.totalPages);
                setTotalItems(json.meta.total);
            }
        } catch (error) {
            console.error("Errore recupero abbonamenti:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAbbonamenti(page);
    }, [page]);

    return (
        <div className="animate-fadeIn max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-4 border-b border-[hsl(var(--tf-border))]">
                <div>
                    <h1 className="text-3xl font-extrabold mb-1">
                        Tutti gli Abbonamenti <span className="text-[hsl(var(--tf-primary))]">🎫</span>
                    </h1>
                    <p className="text-sm text-[hsl(var(--tf-text-muted))]">
                        Visualizza gli abbonamenti di tutti gli utenti in tutte le palestre (Totale: {totalItems})
                    </p>
                </div>
            </div>

            <Card style={{ padding: 0, overflow: "hidden" }}>
                {loading ? (
                    <div className="p-8 text-center text-[hsl(var(--tf-text-muted))] animate-pulse">
                        Caricamento abbonamenti in corso...
                    </div>
                ) : abbonamenti.length === 0 ? (
                    <div className="p-8 text-center text-[hsl(var(--tf-text-muted))]">
                        Nessun abbonamento trovato.
                    </div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                            <thead>
                                <tr style={{ background: "hsl(var(--tf-surface-2))", borderBottom: "1px solid hsl(var(--tf-border))" }}>
                                    <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600 }}>ID / Creato il</th>
                                    <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600 }}>Utente</th>
                                    <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600 }}>Struttura e Piano</th>
                                    <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600 }}>Validità / Stato</th>
                                </tr>
                            </thead>
                            <tbody>
                                {abbonamenti.map((a, i) => (
                                    <tr key={a.id} style={{ borderBottom: "1px solid hsl(var(--tf-border))", background: i % 2 === 0 ? "transparent" : "hsl(var(--tf-surface-2)/.4)" }}>
                                        <td style={{ padding: "1rem" }}>
                                            <div style={{ fontSize: "0.75rem", color: "hsl(var(--tf-text-muted))", fontFamily: "monospace" }}>{a.id.split("-")[0]}</div>
                                            <div style={{ fontSize: "0.8rem", marginTop: 4 }}>
                                                {new Date(a.datainizio).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td style={{ padding: "1rem" }}>
                                            <div style={{ fontWeight: 600 }}>
                                                {a.user?.nome} {a.user?.cognome}
                                            </div>
                                            <div style={{ fontSize: "0.75rem", color: "hsl(var(--tf-text-muted))", marginTop: 2 }}>{a.user?.email}</div>
                                        </td>
                                        <td style={{ padding: "1rem" }}>
                                            {a.tipo ? (
                                                <>
                                                    <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{a.tipo.struttura_nome}</div>
                                                    <div style={{ fontSize: "0.8rem", color: "hsl(var(--tf-text-muted))", marginTop: 2 }}>
                                                        {a.tipo.nome} (€ {a.tipo.prezzo})
                                                    </div>
                                                </>
                                            ) : (
                                                <div style={{ color: "hsl(var(--tf-text-muted))" }}>N/A</div>
                                            )}
                                        </td>
                                        <td style={{ padding: "1rem" }}>
                                            <Badge color={STATO_COLOR[a.stato] || "gray"}>{a.stato}</Badge>
                                            <div style={{ fontSize: "0.75rem", color: "hsl(var(--tf-text-muted))", marginTop: 6 }}>
                                                Scade: {new Date(a.datafine).toLocaleDateString()}
                                            </div>
                                            {a.rinnovoautomatico && (
                                                <div style={{ fontSize: "0.7rem", color: "green", marginTop: 2, fontWeight: 600 }}>
                                                    🔄 Rinnovo automatico
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination Controls */}
                {!loading && abbonamenti.length > 0 && (
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
