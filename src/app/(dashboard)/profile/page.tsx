"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@frontend/contexts/AuthContext";
import { Card } from "@frontend/components/ui/Card";
import { Input } from "@frontend/components/ui/Input";
import { Button } from "@frontend/components/ui/Button";

export default function ProfilePage() {
    const { user, ruolo, signOut } = useAuth();
    const router = useRouter();

    const [form, setForm] = useState({
        nome: user?.user_metadata?.nome ?? "",
        cognome: user?.user_metadata?.cognome ?? "",
        telefono: user?.user_metadata?.telefono ?? "",
        dataNascita: user?.user_metadata?.data_nascita ?? "",
        peso: user?.user_metadata?.peso ? String(user.user_metadata.peso) : "",
        altezza: user?.user_metadata?.altezza ? String(user.user_metadata.altezza) : "",
        eta: user?.user_metadata?.eta ? String(user.user_metadata.eta) : "",
        obiettivo: user?.user_metadata?.obiettivo ?? "",
        bio: user?.user_metadata?.bio ?? "",
    });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [confirmDel, setConfirmDel] = useState(false);

    // Carica profilo aggiornato dal backend
    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch("/api/users/me");
                if (!res.ok) return;
                const json = await res.json();
                const u = json?.data ?? json;
                if (!u) return;
                setForm(prev => ({
                    nome: u.nome ?? prev.nome,
                    cognome: u.cognome ?? prev.cognome,
                    telefono: u.telefono ?? prev.telefono,
                    dataNascita: u.data_nascita ?? prev.dataNascita,
                    peso: u.peso ? String(u.peso) : prev.peso,
                    altezza: u.altezza ? String(u.altezza) : prev.altezza,
                    eta: u.eta ? String(u.eta) : prev.eta,
                    obiettivo: u.obiettivo ?? prev.obiettivo,
                    bio: u.bio ?? prev.bio,
                }));
            } catch { /* silent */ }
        };
        load();
    }, []);

    const set = (field: string) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
            setForm(f => ({ ...f, [field]: e.target.value }));

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true); setSaveError(null);
        try {
            const res = await fetch("/api/users/me", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nome: form.nome,
                    cognome: form.cognome,
                    peso: form.peso ? Number(form.peso) : undefined,
                    altezza: form.altezza ? Number(form.altezza) : undefined,
                    eta: form.eta ? Number(form.eta) : undefined,
                    obiettivo: form.obiettivo,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Errore nel salvataggio");
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            setSaveError(String(err));
        } finally { setSaving(false); }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await fetch("/api/auth", { method: "DELETE" });
            await signOut();
            router.push("/login");
        } finally { setDeleting(false); }
    };

    const initials = `${form.nome[0] ?? "?"}${form.cognome[0] ?? ""}`.toUpperCase();

    const OBIETTIVI = [
        { value: "", label: "Seleziona un obiettivo" },
        { value: "Perdita di peso", label: "🔥 Perdita di peso" },
        { value: "Aumento massa muscolare", label: "💪 Aumento massa muscolare" },
        { value: "Resistenza cardiovascolare", label: "❤️ Resistenza cardiovascolare" },
        { value: "Flessibilità e mobilità", label: "🧘 Flessibilità e mobilità" },
        { value: "Mantenimento forma", label: "⚖️ Mantenimento forma" },
        { value: "Preparazione gara", label: "🏅 Preparazione gara" },
    ];

    const inputStyle = {
        width: "100%", padding: "0.65rem 0.85rem",
        borderRadius: "var(--tf-radius-sm)",
        border: "1px solid hsl(var(--tf-border))",
        background: "hsl(var(--tf-bg))", color: "hsl(var(--tf-text))",
        fontSize: "0.875rem", outline: "none", boxSizing: "border-box" as const,
    };
    const labelStyle = { fontSize: "0.8rem", fontWeight: 600 as const, color: "hsl(var(--tf-text-muted))", display: "block" as const, marginBottom: "0.4rem" };

    return (
        <div style={{ maxWidth: 700, margin: "0 auto" }} className="animate-fadeIn">
            <div style={{ marginBottom: "1.5rem" }}>
                <h1 style={{ fontSize: "1.6rem", fontWeight: 800 }}>👤 Profilo</h1>
                <p style={{ color: "hsl(var(--tf-text-muted))", fontSize: "0.875rem", marginTop: 2 }}>
                    Gestisci i tuoi dati personali
                </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {/* Avatar card */}
                <Card>
                    <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                        <div style={{
                            width: 72, height: 72, borderRadius: "50%", flexShrink: 0,
                            background: "linear-gradient(135deg, hsl(var(--tf-primary)), hsl(var(--tf-accent)))",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontWeight: 800, fontSize: "1.5rem", color: "#fff",
                        }}>
                            {initials}
                        </div>
                        <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: 700, fontSize: "1.1rem" }}>
                                {form.nome || "Nome"} {form.cognome || "Cognome"}
                            </p>
                            <p style={{ fontSize: "0.825rem", color: "hsl(var(--tf-text-muted))" }}>{user?.email ?? "—"}</p>
                            <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                                <span style={{ fontSize: "0.72rem", padding: "0.2rem 0.6rem", borderRadius: "999px", background: "hsl(var(--tf-primary)/.15)", color: "hsl(var(--tf-primary))", fontWeight: 700 }}>
                                    {ruolo ?? "UTENTE"}
                                </span>
                                <span style={{ fontSize: "0.72rem", color: "hsl(var(--tf-text-muted))" }}>
                                    Membro dal {user?.created_at ? new Date(user.created_at).toLocaleDateString("it-IT") : "—"}
                                </span>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Dati personali */}
                <Card title="Dati personali">
                    <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                            <Input id="nome" label="Nome *" value={form.nome} onChange={set("nome")} required icon="👤" />
                            <Input id="cognome" label="Cognome *" value={form.cognome} onChange={set("cognome")} required icon="👤" />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                            <Input id="telefono" label="Telefono" type="tel" value={form.telefono} onChange={set("telefono")} icon="📞" placeholder="+39 333 1234567" />
                            <div>
                                <label style={labelStyle}>Data di nascita</label>
                                <input style={inputStyle} type="date" value={form.dataNascita} onChange={set("dataNascita")} />
                            </div>
                        </div>

                        {/* Campi fisici */}
                        <div style={{ borderTop: "1px solid hsl(var(--tf-border))", paddingTop: "1rem" }}>
                            <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "hsl(var(--tf-text-muted))", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                Parametri fisici
                            </p>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                                <Input id="peso" label="Peso (kg)" type="number" placeholder="70" value={form.peso} onChange={set("peso")} icon="⚖️" min="30" max="300" />
                                <Input id="altezza" label="Altezza (cm)" type="number" placeholder="175" value={form.altezza} onChange={set("altezza")} icon="📏" min="100" max="250" />
                                <Input id="eta" label="Età (anni)" type="number" placeholder="25" value={form.eta} onChange={set("eta")} icon="🎂" min="13" max="120" />
                            </div>
                        </div>

                        {/* Obiettivo */}
                        <div>
                            <label style={labelStyle}>Obiettivo fitness</label>
                            <select style={inputStyle} value={form.obiettivo} onChange={set("obiettivo")}>
                                {OBIETTIVI.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>

                        {saved && (
                            <p style={{ padding: "0.75rem", borderRadius: "var(--tf-radius-sm)", background: "hsl(145 60% 45%/.15)", color: "hsl(145 60% 45%)", fontSize: "0.825rem", fontWeight: 600 }}>
                                ✅ Profilo aggiornato con successo
                            </p>
                        )}
                        {saveError && (
                            <p style={{ padding: "0.75rem", borderRadius: "var(--tf-radius-sm)", background: "hsl(var(--tf-danger)/.1)", color: "hsl(var(--tf-danger))", fontSize: "0.8rem" }}>
                                ⚠️ {saveError}
                            </p>
                        )}

                        <Button type="submit" isLoading={saving} style={{ alignSelf: "flex-start" }}>
                            Salva modifiche
                        </Button>
                    </form>
                </Card>

                {/* Info readonly */}
                <Card title="Informazioni account">
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        {[
                            { label: "Email", val: user?.email ?? "—", icon: "✉️" },
                            { label: "Ruolo", val: ruolo ?? "UTENTE", icon: "🎖️" },
                            { label: "ID Utente", val: user?.id ? user.id.slice(0, 8) + "…" : "—", icon: "🔑" },
                            { label: "Provider", val: user?.app_metadata?.provider ?? "email", icon: "🔐" },
                        ].map(item => (
                            <div key={item.label}>
                                <p style={{ fontSize: "0.75rem", color: "hsl(var(--tf-text-muted))", marginBottom: "0.2rem" }}>{item.icon} {item.label}</p>
                                <p style={{ fontWeight: 600, fontSize: "0.875rem", fontFamily: item.label === "ID Utente" ? "monospace" : undefined }}>
                                    {item.val}
                                </p>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Sicurezza */}
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
                            <p style={{ fontWeight: 600, fontSize: "0.9rem", color: "hsl(var(--tf-danger))" }}>Elimina account</p>
                            <p style={{ fontSize: "0.78rem", color: "hsl(var(--tf-text-muted))", marginTop: 2 }}>
                                Cancella permanentemente il tuo account e tutti i dati (GDPR Art. 17)
                            </p>
                        </div>
                        {!confirmDel ? (
                            <Button variant="danger" size="sm" onClick={() => setConfirmDel(true)}>Elimina</Button>
                        ) : (
                            <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                                <Button variant="ghost" size="sm" onClick={() => setConfirmDel(false)}>Annulla</Button>
                                <Button variant="danger" size="sm" isLoading={deleting} onClick={handleDelete}>Conferma</Button>
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
