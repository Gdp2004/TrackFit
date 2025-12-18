"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@frontend/components/ui/Input";
import { Button } from "@frontend/components/ui/Button";

const RUOLI = [
    { value: "UTENTE", label: "🏃 Atleta" },
    { value: "COACH", label: "🎯 Coach" },
    { value: "GESTORE", label: "🏋️ Gestore Palestra" },
];

export default function RegisterPage() {
    const router = useRouter();
    const [form, setForm] = useState({ nome: "", cognome: "", email: "", password: "", ruolo: "UTENTE" });
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm((f) => ({ ...f, [field]: e.target.value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const res = await fetch("/api/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error ?? "Errore di registrazione"); setLoading(false); return; }
            router.push("/login?registered=1");
        } catch {
            setError("Errore di rete"); setLoading(false);
        }
    };

    return (
        <div>
            <div style={{ marginBottom: "2rem" }}>
                <h2 style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "0.5rem" }}>
                    Crea il tuo account
                </h2>
                <p style={{ color: "hsl(var(--tf-text-muted))", fontSize: "0.9rem" }}>
                    Inizia il tuo percorso fitness con TrackFit
                </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    <Input id="nome" label="Nome" placeholder="Mario" icon="👤" value={form.nome} onChange={set("nome")} required />
                    <Input id="cognome" label="Cognome" placeholder="Rossi" icon="👤" value={form.cognome} onChange={set("cognome")} required />
                </div>
                <Input id="email" label="Email" type="email" placeholder="mario@esempio.it" icon="✉️" value={form.email} onChange={set("email")} required />
                <Input id="password" label="Password" type="password" placeholder="min. 8 caratteri" icon="🔒" value={form.password} onChange={set("password")} required minLength={8} />

                {/* Ruolo selector */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                    <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "hsl(var(--tf-text-muted))" }}>
                        Ruolo
                    </label>
                    <select
                        value={form.ruolo}
                        onChange={set("ruolo")}
                        className="tf-input"
                        style={{ cursor: "pointer" }}
                    >
                        {RUOLI.map((r) => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                    </select>
                </div>

                {error && (
                    <p style={{ padding: "0.75rem", borderRadius: "var(--tf-radius-sm)", background: "hsl(var(--tf-danger)/.15)", color: "hsl(var(--tf-danger))", fontSize: "0.8rem" }}>
                        ⚠️ {error}
                    </p>
                )}

                <Button type="submit" isLoading={loading} style={{ width: "100%", height: "46px", marginTop: "0.5rem" }}>
                    Registrati
                </Button>
            </form>

            <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.875rem", color: "hsl(var(--tf-text-muted))" }}>
                Hai già un account?{" "}
                <Link href="/login" style={{ color: "hsl(var(--tf-primary))", fontWeight: 600 }}>
                    Accedi
                </Link>
            </p>
        </div>
    );
}
