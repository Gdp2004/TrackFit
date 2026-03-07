import { useState, useEffect } from "react";
import { Modal } from "@frontend/components/ui/Modal";
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
        <Modal open={isOpen} onClose={onClose} title="La tua opinione">
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                {/* Header context */}
                <div style={{
                    padding: "1.25rem",
                    background: "linear-gradient(135deg, hsl(var(--tf-primary)), hsl(var(--tf-accent)))",
                    color: "white",
                    borderRadius: "var(--tf-radius-sm)",
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem"
                }}>
                    <div style={{ fontSize: "2rem" }}>⭐️</div>
                    <div>
                        <p style={{ fontSize: "0.85rem", opacity: 0.9, marginBottom: "0.2rem" }}>Stai recensendo</p>
                        <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0 }}>{name}</h3>
                    </div>
                </div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                    {/* Rating Selection */}
                    <div style={{ textAlign: "center" }}>
                        <label style={{ fontSize: "0.75rem", fontWeight: 800, color: "hsl(var(--tf-text-muted))", display: "block", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                            Valutazione
                        </label>
                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setVoto(star)}
                                    style={{
                                        background: "none", border: "none", fontSize: "2.5rem",
                                        cursor: "pointer", color: star <= voto ? "#f59e0b" : "rgba(255,255,255,0.05)",
                                        transition: "all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                                        transform: star <= voto ? "scale(1.15)" : "scale(1)",
                                        filter: star <= voto ? "drop-shadow(0 0 10px rgba(245, 158, 11, 0.4))" : "none",
                                        padding: "0 0.1rem", lineHeight: 1
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.3)")}
                                    onMouseLeave={(e) => (e.currentTarget.style.transform = star <= voto ? "scale(1.15)" : "scale(1)")}
                                >
                                    ★
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Comment */}
                    <div>
                        <label style={{ fontSize: "0.85rem", fontWeight: 700, display: "block", marginBottom: "0.75rem", color: "hsl(var(--tf-text))" }}>
                            Raccontaci la tua esperienza
                        </label>
                        <textarea
                            value={commento}
                            onChange={(e) => setCommento(e.target.value)}
                            placeholder="Cosa ti è piaciuto di più?"
                            style={{
                                width: "100%", height: "120px", padding: "1rem",
                                borderRadius: "1rem",
                                border: "1px solid rgba(255,255,255,0.1)",
                                background: "rgba(255,255,255,0.03)",
                                color: "hsl(var(--tf-text))",
                                fontSize: "0.95rem", resize: "none",
                                transition: "all 0.2s",
                                outline: "none",
                                lineHeight: 1.6
                            }}
                            onFocus={(e) => {
                                e.currentTarget.style.borderColor = "hsl(var(--tf-primary))";
                                e.currentTarget.style.boxShadow = "0 0 15px hsl(var(--tf-primary)/.1)";
                            }}
                            onBlur={(e) => {
                                e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                                e.currentTarget.style.boxShadow = "none";
                            }}
                        />
                    </div>

                    {error && (
                        <div style={{
                            padding: "1rem", borderRadius: "0.75rem",
                            background: "rgba(239, 68, 68, 0.1)", color: "rgb(248, 113, 113)",
                            fontSize: "0.85rem", fontWeight: 600, display: "flex", gap: "0.5rem", alignItems: "center",
                            border: "1px solid rgba(239, 68, 68, 0.2)"
                        }}>
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    <div style={{ display: "flex", gap: "1rem" }}>
                        <Button variant="ghost" onClick={onClose} style={{ flex: 1 }}>Annulla</Button>
                        <Button type="submit" isLoading={loading} style={{
                            flex: 2, height: "3rem", fontSize: "1rem", fontWeight: 800,
                            borderRadius: "var(--tf-radius-sm)",
                            background: "linear-gradient(135deg, hsl(var(--tf-primary)), hsl(var(--tf-accent)))",
                            boxShadow: "0 4px 15px hsl(var(--tf-primary)/.3)",
                            color: "white"
                        }}>
                            Pubblica recensione
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}



