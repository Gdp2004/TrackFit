"use client";

import { useEffect, useState } from "react";
import { useRoleRedirect } from "@frontend/hooks/useRoleRedirect";
import { RuoloEnum } from "@backend/domain/model/enums";
import { Badge } from "@frontend/components/ui/Badge";
import { Button } from "@frontend/components/ui/Button";
import { Input } from "@frontend/components/ui/Input";

interface Review {
    id: string;
    voto: number;
    commento: string | null;
    createdat: string;
    risposta: string | null;
    rispostadat: string | null;
    users: {
        id: string;
        nome: string;
        cognome: string;
    } | null;
}

export default function CoachReviewsPage() {
    const { user, loading: authLoading } = useRoleRedirect(RuoloEnum.COACH);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Reply state
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState("");
    const [submittingReply, setSubmittingReply] = useState(false);

    useEffect(() => {
        if (!user) return;

        const fetchReviews = async () => {
            try {
                const res = await fetch("/api/coaches/recensioni");
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Errore nel caricamento delle recensioni");
                setReviews(data.data || []);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchReviews();
    }, [user]);

    const handleReplySubmit = async (reviewId: string) => {
        if (!replyText.trim()) return;
        setSubmittingReply(true);

        try {
            const res = await fetch(`/api/coaches/recensioni/${reviewId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ risposta: replyText.trim() }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Errore durante l'invio della risposta");
            }

            // Aggiorna la recensione localmente
            setReviews(prev => prev.map(r =>
                r.id === reviewId
                    ? { ...r, risposta: replyText.trim(), rispostadat: new Date().toISOString() }
                    : r
            ));

            setReplyingTo(null);
            setReplyText("");
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSubmittingReply(false);
        }
    };

    if (authLoading || loading) {
        return <div style={{ padding: "2rem", textAlign: "center", color: "hsl(var(--tf-text-muted))" }}>Caricamento recensioni in corso...</div>;
    }

    if (error) {
        return (
            <div style={{ maxWidth: 800, margin: "0 auto", padding: "1rem", color: "hsl(var(--tf-danger))", background: "hsl(var(--tf-danger)/0.1)", borderRadius: "var(--tf-radius)" }}>
                {error}
            </div>
        );
    }

    const averageRating = reviews.length > 0
        ? (reviews.reduce((acc, curr) => acc + curr.voto, 0) / reviews.length).toFixed(1)
        : 0;

    return (
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", flexDirection: "column", gap: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                    <h1 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "0.25rem" }}>Recensioni</h1>
                    <p style={{ color: "hsl(var(--tf-text-muted))", fontSize: "0.875rem" }}>
                        Consulta i feedback dei tuoi atleti e rispondi direttamente
                    </p>
                </div>
                {reviews.length > 0 && (
                    <div style={{
                        display: "flex", flexDirection: "column", alignItems: "flex-end",
                        background: "hsl(var(--tf-surface))", padding: "0.75rem 1.25rem",
                        borderRadius: "var(--tf-radius)", border: "1px solid hsl(var(--tf-border))"
                    }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "hsl(var(--tf-text-muted))", textTransform: "uppercase" }}>Rating Globale</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span style={{ fontSize: "1.5rem", color: "#fbbf24" }}>★</span>
                            <span style={{ fontSize: "1.5rem", fontWeight: 900 }}>{averageRating}</span>
                            <span style={{ fontSize: "0.9rem", color: "hsl(var(--tf-text-muted))" }}>/ 5.0</span>
                        </div>
                    </div>
                )}
            </div>

            {reviews.length === 0 ? (
                <div style={{
                    padding: "4rem 2rem", textAlign: "center",
                    background: "hsl(var(--tf-surface))", borderRadius: "var(--tf-radius)",
                    border: "1px dashed hsl(var(--tf-border))",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem"
                }}>
                    <span style={{ fontSize: "3rem", opacity: 0.5 }}>📝</span>
                    <p style={{ color: "hsl(var(--tf-text-muted))", fontWeight: 500 }}>Non hai ancora ricevuto recensioni.</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    {reviews.map((review) => (
                        <div key={review.id} style={{
                            background: "hsl(var(--tf-surface))",
                            border: "1px solid hsl(var(--tf-border))",
                            borderRadius: "var(--tf-radius)",
                            padding: "1.5rem",
                            display: "flex", flexDirection: "column", gap: "1.25rem",
                            boxShadow: "0 2px 10px rgba(0,0,0,0.02)"
                        }}>
                            {/* Review Header */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                    <div style={{
                                        width: 48, height: 48, borderRadius: "50%",
                                        background: "linear-gradient(135deg, hsl(var(--tf-primary)), hsl(var(--tf-accent)))",
                                        color: "white", display: "flex", alignItems: "center", justifyContent: "center",
                                        fontWeight: 800, fontSize: "1.2rem"
                                    }}>
                                        {review.users?.nome?.substring(0, 1).toUpperCase() || "A"}
                                    </div>
                                    <div>
                                        <p style={{ fontWeight: 700, fontSize: "1rem", color: "hsl(var(--tf-text))" }}>
                                            {review.users ? `${review.users.nome} ${review.users.cognome}` : "Utente Anonimo"}
                                        </p>
                                        <p style={{ fontSize: "0.75rem", color: "hsl(var(--tf-text-muted))" }}>
                                            {new Date(review.createdat).toLocaleDateString('it-IT', {
                                                day: 'numeric', month: 'long', year: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>
                                <div style={{ display: "flex", gap: "0.15rem" }}>
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <span key={s} style={{ fontSize: "1.25rem", color: s <= review.voto ? "#f59e0b" : "hsl(var(--tf-surface-2))" }}>
                                            ★
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Review Text */}
                            {review.commento ? (
                                <p style={{ fontSize: "0.95rem", color: "hsl(var(--tf-text))", lineHeight: 1.6, paddingLeft: "4rem" }}>
                                    "{review.commento}"
                                </p>
                            ) : (
                                <p style={{ fontSize: "0.95rem", color: "hsl(var(--tf-text-muted))", fontStyle: "italic", paddingLeft: "4rem" }}>
                                    Nessun commento testuale.
                                </p>
                            )}

                            {/* Coach Reply Section */}
                            <div style={{ paddingLeft: "4rem", paddingTop: "0.5rem" }}>
                                {review.risposta ? (
                                    <div style={{
                                        background: "hsl(var(--tf-bg))",
                                        padding: "1rem 1.25rem",
                                        borderRadius: "0 1rem 1rem 1rem",
                                        borderLeft: "4px solid hsl(var(--tf-primary))"
                                    }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                                            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "hsl(var(--tf-primary))", textTransform: "uppercase" }}>
                                                La tua risposta
                                            </span>
                                            <span style={{ fontSize: "0.75rem", color: "hsl(var(--tf-text-muted))" }}>
                                                · {new Date(review.rispostadat || "").toLocaleDateString('it-IT')}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: "0.9rem", color: "hsl(var(--tf-text))", lineHeight: 1.5 }}>
                                            {review.risposta}
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        {replyingTo === review.id ? (
                                            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", animation: "fadeIn 0.2s" }}>
                                                <textarea
                                                    value={replyText}
                                                    onChange={e => setReplyText(e.target.value)}
                                                    placeholder="Scrivi una risposta ringraziando o approfondendo..."
                                                    style={{
                                                        width: "100%", height: "100px", padding: "0.75rem",
                                                        borderRadius: "var(--tf-radius)",
                                                        border: "1px solid hsl(var(--tf-border))",
                                                        background: "hsl(var(--tf-bg))",
                                                        color: "hsl(var(--tf-text))",
                                                        fontSize: "0.9rem", resize: "none", outline: "none"
                                                    }}
                                                    autoFocus
                                                />
                                                <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                                                    <Button variant="secondary" size="sm" onClick={() => {
                                                        setReplyingTo(null);
                                                        setReplyText("");
                                                    }}>Annulla</Button>
                                                    <Button size="sm" isLoading={submittingReply} onClick={() => handleReplySubmit(review.id)}>
                                                        Pubblica Risposta
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <Button variant="secondary" size="sm" onClick={() => {
                                                setReplyingTo(review.id);
                                                setReplyText("");
                                            }}>
                                                💬 Rispondi
                                            </Button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
