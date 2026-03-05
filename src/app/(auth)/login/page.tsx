"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@frontend/lib/supabase-browser";
import { Input } from "@frontend/components/ui/Input";
import { Button } from "@frontend/components/ui/Button";
import { RuoloEnum } from "@backend/domain/model/enums";

/** Mappa ruolo → dashboard di destinazione */
const ROLE_DASHBOARD: Record<string, string> = {
    [RuoloEnum.COACH]: "/coach/dashboard",
    [RuoloEnum.GESTORE]: "/gym/dashboard",
    [RuoloEnum.UTENTE]: "/dashboard",
    [RuoloEnum.ADMIN]: "/dashboard",
};

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [fadeOut, setFadeOut] = useState(false);

    useEffect(() => {
        if (searchParams.get("registered") === "1") {
            setShowSuccess(true);
            // Dopo 3.5 s avvia la dissolvenza, poi nasconde completamente a 4 s
            const fadeTimer = setTimeout(() => setFadeOut(true), 3500);
            const hideTimer = setTimeout(() => setShowSuccess(false), 4200);
            return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer); };
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        const { data, error } = await supabaseBrowser.auth.signInWithPassword({ email, password });
        setLoading(false);
        if (error) { setError(error.message); return; }

        // Redirect basato sul ruolo dell'utente
        const ruolo = data.user?.user_metadata?.ruolo as string | undefined;
        const destination = ruolo ? (ROLE_DASHBOARD[ruolo] ?? "/dashboard") : "/dashboard";
        router.push(destination);
    };

    return (
        <div>
            {/* Banner registrazione avvenuta con successo */}
            {showSuccess && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.6rem",
                        marginBottom: "1.5rem",
                        padding: "0.85rem 1rem",
                        borderRadius: "var(--tf-radius-sm)",
                        background: "hsl(142 70% 45% / 0.15)",
                        border: "1px solid hsl(142 70% 45% / 0.4)",
                        color: "hsl(142 60% 38%)",
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        opacity: fadeOut ? 0 : 1,
                        transition: "opacity 0.7s ease",
                    }}
                >
                    <span style={{ fontSize: "1.1rem" }}>✅</span>
                    <span>Registrazione avvenuta con successo! Accedi al tuo account.</span>
                </div>
            )}

            {/* Header */}
            <div style={{ marginBottom: "2rem" }}>
                <h2 style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "0.5rem" }}>
                    Bentornato 👋
                </h2>
                <p style={{ color: "hsl(var(--tf-text-muted))", fontSize: "0.9rem" }}>
                    Accedi al tuo account TrackFit
                </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <Input
                    id="email"
                    label="Email"
                    type="email"
                    autoComplete="email"
                    placeholder="tuaemail@esempio.it"
                    icon="✉️"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <Input
                    id="password"
                    label="Password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    icon="🔒"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                {error && (
                    <p style={{
                        padding: "0.75rem", borderRadius: "var(--tf-radius-sm)",
                        background: "hsl(var(--tf-danger)/.15)",
                        color: "hsl(var(--tf-danger))",
                        fontSize: "0.8rem",
                    }}>
                        ⚠️ {error}
                    </p>
                )}

                <div style={{ textAlign: "right" }}>
                    <Link href="/forgot-password" style={{ fontSize: "0.8rem", color: "hsl(var(--tf-primary))" }}>
                        Password dimenticata?
                    </Link>
                </div>

                <Button type="submit" isLoading={loading} style={{ width: "100%", height: "46px", marginTop: "0.5rem" }}>
                    Accedi
                </Button>
            </form>

            <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.875rem", color: "hsl(var(--tf-text-muted))" }}>
                Non hai un account?{" "}
                <Link href="/register" style={{ color: "hsl(var(--tf-primary))", fontWeight: 600 }}>
                    Registrati
                </Link>
            </p>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense>
            <LoginForm />
        </Suspense>
    );
}
