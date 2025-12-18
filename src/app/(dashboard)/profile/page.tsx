"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@frontend/contexts/AuthContext";
import { Card } from "@frontend/components/ui/Card";
import { Input } from "@frontend/components/ui/Input";
import { Button } from "@frontend/components/ui/Button";

export default function ProfilePage() {
    const { user, signOut } = useAuth();
    const router = useRouter();

    const [form, setForm] = useState({
        nome: user?.user_metadata?.nome ?? "",
        cognome: user?.user_metadata?.cognome ?? "",
        peso: "",
        altezza: "",
    });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [confirmDel, setConfirmDel] = useState(false);

    const set = (field: string) =>
        (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [field]: e.target.value }));

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        // In a real app: call API to update profile
        await new Promise((r) => setTimeout(r, 800));
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const handleDelete = async () => {
        setDeleting(true);
        await new Promise((r) => setTimeout(r, 1000));
        await signOut();
        router.push("/login");
    };

    return (
        <div style={{ maxWidth: 680, margin: "0 auto" }} className="animate-fadeIn">
            <div style={{ marginBottom: "1.5rem" }}>
                <h1 style={{ fontSize: "1.6rem", fontWeight: 800 }}>Profilo</h1>
                <p style={{ color: "hsl(var(--tf-text-muted))", fontSize: "0.875rem", marginTop: 2 }}>
                    Gestisci i tuoi dati personali
                </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {/* Avatar + email */}
                <Card>
                    <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                        <div style={{
                            width: 64, height: 64, borderRadius: "50%", flexShrink: 0,
                            background: "linear-gradient(135deg, hsl(var(--tf-primary)), hsl(var(--tf-accent)))",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontWeight: 800, fontSize: "1.4rem", color: "#fff",
                        }}>
                            {(form.nome[0] ?? "?").toUpperCase()}{(form.cognome[0] ?? "").toUpperCase()}
                        </div>
                        <div>
                            <p style={{ fontWeight: 700, fontSize: "1.05rem" }}>
                                {form.nome || "Nome"} {form.cognome || "Cognome"}
                            </p>
                            <p style={{ fontSize: "0.825rem", color: "hsl(var(--tf-text-muted))" }}>
                                {user?.email ?? "—"}
                            </p>
                            <p style={{ fontSize: "0.75rem", color: "hsl(var(--tf-text-muted))", marginTop: 2 }}>
                                Membro dal {user?.created_at ? new Date(user.created_at).toLocaleDateString("it-IT") : "—"}
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Edit form */}
                <Card title="Dati personali">
                    <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                            <Input id="nome" label="Nome" value={form.nome} onChange={set("nome")} required icon="👤" />
                            <Input id="cognome" label="Cognome" value={form.cognome} onChange={set("cognome")} required icon="👤" />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                            <Input id="peso" label="Peso (kg)" type="number" placeholder="70" value={form.peso} onChange={set("peso")} icon="⚖️" min="30" max="250" />
                            <Input id="altezza" label="Altezza (cm)" type="number" placeholder="175" value={form.altezza} onChange={set("altezza")} icon="📏" min="100" max="250" />
                        </div>

                        {saved && (
                            <p style={{ padding: "0.75rem", borderRadius: "var(--tf-radius-sm)", background: "hsl(var(--tf-accent)/.15)", color: "hsl(var(--tf-accent))", fontSize: "0.825rem", fontWeight: 600 }}>
                                ✅ Profilo aggiornato con successo
                            </p>
                        )}

                        <Button type="submit" isLoading={saving} style={{ alignSelf: "flex-start" }}>
                            Salva modifiche
                        </Button>
                    </form>
                </Card>

                {/* Change password (link) */}
                <Card title="Sicurezza">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                            <p style={{ fontWeight: 600, fontSize: "0.9rem" }}>Password</p>
                            <p style={{ fontSize: "0.78rem", color: "hsl(var(--tf-text-muted))" }}>
                                Aggiorna la tua password per mantenere l&apos;account al sicuro
                            </p>
                        </div>
                        <Button variant="secondary" size="sm" onClick={() => router.push("/forgot-password")}>
                            Cambia
                        </Button>
                    </div>
                </Card>

                {/* Danger zone */}
                <Card title="Zona pericolosa" style={{ border: "1px solid hsl(var(--tf-danger)/.3)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
                        <div>
                            <p style={{ fontWeight: 600, fontSize: "0.9rem", color: "hsl(var(--tf-danger))" }}>
                                Elimina account
                            </p>
                            <p style={{ fontSize: "0.78rem", color: "hsl(var(--tf-text-muted))", marginTop: 2 }}>
                                Cancella permanentemente il tuo account e tutti i dati (GDPR)
                            </p>
                        </div>
                        {!confirmDel ? (
                            <Button variant="danger" size="sm" onClick={() => setConfirmDel(true)}>
                                Elimina
                            </Button>
                        ) : (
                            <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                                <Button variant="ghost" size="sm" onClick={() => setConfirmDel(false)}>Annulla</Button>
                                <Button variant="danger" size="sm" isLoading={deleting} onClick={handleDelete}>
                                    Conferma
                                </Button>
                            </div>
                        )}
                    </div>
                    {confirmDel && (
                        <p style={{ marginTop: "0.75rem", fontSize: "0.78rem", color: "hsl(var(--tf-danger))", fontWeight: 600 }}>
                            ⚠️ Questa azione è irreversibile. Tutti i tuoi dati verranno eliminati definitivamente.
                        </p>
                    )}
                </Card>
            </div>
        </div>
    );
}
