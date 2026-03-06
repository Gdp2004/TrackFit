"use client";

import { useState, useEffect } from "react";
import { Button } from "@frontend/components/ui/Button";

interface ReviewSidebarProps {
    coachId?: string;
    strutturaId?: string;
    name: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function ReviewSidebar({ coachId, strutturaId, name, isOpen, onClose, onSuccess }: ReviewSidebarProps) {
    const [voto, setVoto] = useState(5);
    const [commento, setCommento] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset form when opening
    useEffect(() => {
        if (isOpen) {
            setVoto(5);
            setCommento("");
            setError(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    coachId,
                    strutturaId,
                    voto,
                    commento
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Errore durante l'invio della recensione");

            if (onSuccess) onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                background: "rgba(0,0,0,0.4)", zIndex: 2000,
                display: "flex", justifyContent: "flex-end",
                backdropFilter: "blur(4px)"
            }}
            onClick={onClose}
        >
            <div
                style={{
                    width: "100%", maxWidth: "420px", height: "100dvh",
                    background: "hsl(var(--tf-surface))",
                    boxShadow: "-10px 0 40px rgba(0,0,0,0.15)",
                    display: "flex", flexDirection: "column",
                    animation: "slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Decorative Header */}
                <div style={{
                    padding: "2rem 1.5rem 1.5rem",
                    background: "linear-gradient(135deg, hsl(var(--tf-primary)), hsl(var(--tf-accent)))",
                    color: "white",
                    position: "relative",
                    flexShrink: 0
                }}>
                    <button onClick={onClose} style={{
                        position: "absolute", top: "1rem", right: "1rem",
                        background: "rgba(255,255,255,0.2)", border: "none",
                        width: "32px", height: "32px", borderRadius: "50%",
                        fontSize: "1.2rem", cursor: "pointer", color: "white",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "background 0.2s"
                    }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.3)"}
                        onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
                    >✕</button>

                    <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>⭐️</div>
                    <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>La tua opinione conta</h2>
                    <p style={{ fontSize: "0.9rem", opacity: 0.9, marginTop: "0.25rem", margin: 0 }}>
                        Recensisci <strong>{name}</strong>
                    </p>
                </div>

                {/* Content */}
                <div style={{ padding: "2rem 1.5rem", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "2rem", flex: 1 }}>

                        {/* Rating Selection */}
                        <div style={{ textAlign: "center", flexShrink: 0 }}>
                            <label style={{ fontSize: "0.9rem", fontWeight: 700, color: "hsl(var(--tf-text-muted))", display: "block", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                Quanto sei soddisfatto?
                            </label>
                            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setVoto(star)}
                                        style={{
                                            background: "none", border: "none", fontSize: "2.5rem",
                                            cursor: "pointer", color: star <= voto ? "#f59e0b" : "hsl(var(--tf-surface-2))",
                                            transition: "all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                                            transform: star <= voto ? "scale(1.1)" : "scale(1)",
                                            filter: star <= voto ? "drop-shadow(0 4px 6px rgba(245, 158, 11, 0.3))" : "none",
                                            padding: 0, lineHeight: 1
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.2)")}
                                        onMouseLeave={(e) => (e.currentTarget.style.transform = star <= voto ? "scale(1.1)" : "scale(1)")}
                                    >
                                        ★
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Comment */}
                        <div style={{ flexShrink: 0 }}>
                            <label style={{ fontSize: "0.9rem", fontWeight: 700, display: "block", marginBottom: "0.75rem", color: "hsl(var(--tf-text))" }}>
                                Racconta nei dettagli
                            </label>
                            <textarea
                                value={commento}
                                onChange={(e) => setCommento(e.target.value)}
                                placeholder="Cosa ti è piaciuto di più? Cosa si potrebbe migliorare?"
                                style={{
                                    width: "100%", height: "140px", padding: "1rem",
                                    borderRadius: "1rem",
                                    border: "2px solid hsl(var(--tf-border))",
                                    background: "hsl(var(--tf-bg))",
                                    color: "hsl(var(--tf-text))",
                                    fontSize: "0.95rem", resize: "none",
                                    transition: "border-color 0.2s, box-shadow 0.2s",
                                    outline: "none"
                                }}
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor = "hsl(var(--tf-primary))";
                                    e.currentTarget.style.boxShadow = "0 0 0 4px hsl(var(--tf-primary)/.1)";
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = "hsl(var(--tf-border))";
                                    e.currentTarget.style.boxShadow = "none";
                                }}
                            />
                        </div>

                        {error && (
                            <div style={{
                                padding: "1rem", borderRadius: "0.75rem",
                                background: "hsl(var(--tf-danger)/.1)", color: "hsl(var(--tf-danger))",
                                fontSize: "0.85rem", fontWeight: 600, display: "flex", gap: "0.5rem", alignItems: "center",
                                flexShrink: 0
                            }}>
                                <span>⚠️</span> {error}
                            </div>
                        )}

                        <div style={{ marginTop: "auto", paddingTop: "1rem", flexShrink: 0 }}>
                            <Button type="submit" isLoading={loading} style={{
                                width: "100%", height: "3rem", fontSize: "1rem", borderRadius: "0.75rem",
                                background: "linear-gradient(135deg, hsl(var(--tf-primary)), hsl(var(--tf-accent)))",
                                boxShadow: "0 4px 14px 0 hsl(var(--tf-primary)/.3)",
                                color: "white" // Ensure text is white
                            }}>
                                Pubblica recensione
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            <style jsx>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
