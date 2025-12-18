"use client";

import { useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@frontend/lib/supabase-browser";
import { Input } from "@frontend/components/ui/Input";
import { Button } from "@frontend/components/ui/Button";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        const { error } = await supabaseBrowser.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/update-password`,
        });
        setLoading(false);
        if (error) { setError(error.message); return; }
        setSent(true);
    };

    return (
        <div>
            <div style={{ marginBottom: "2rem" }}>
                <h2 style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "0.5rem" }}>
                    Recupera password
                </h2>
                <p style={{ color: "hsl(var(--tf-text-muted))", fontSize: "0.9rem" }}>
                    Ti invieremo un link per reimpostare la tua password.
                </p>
            </div>

            {sent ? (
                <div style={{ textAlign: "center", padding: "2rem 0" }}>
                    <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📬</div>
                    <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Email inviata!</h3>
                    <p style={{ color: "hsl(var(--tf-text-muted))", fontSize: "0.875rem" }}>
                        Controlla la tua casella e segui il link per reimpostare la password.
                    </p>
                    <Link href="/login" style={{ display: "inline-block", marginTop: "1.5rem", color: "hsl(var(--tf-primary))", fontWeight: 600 }}>
                        ← Torna al login
                    </Link>
                </div>
            ) : (
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <Input
                        id="recovery-email"
                        label="Email"
                        type="email"
                        placeholder="tuaemail@esempio.it"
                        icon="✉️"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    {error && (
                        <p style={{ padding: "0.75rem", borderRadius: "var(--tf-radius-sm)", background: "hsl(var(--tf-danger)/.15)", color: "hsl(var(--tf-danger))", fontSize: "0.8rem" }}>
                            ⚠️ {error}
                        </p>
                    )}
                    <Button type="submit" isLoading={loading} style={{ width: "100%", height: "46px" }}>
                        Invia link di recupero
                    </Button>
                </form>
            )}

            <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.875rem", color: "hsl(var(--tf-text-muted))" }}>
                Ricordi la password?{" "}
                <Link href="/login" style={{ color: "hsl(var(--tf-primary))", fontWeight: 600 }}>
                    Accedi
                </Link>
            </p>
        </div>
    );
}
