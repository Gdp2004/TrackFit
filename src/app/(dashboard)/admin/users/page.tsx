"use client";

import { useEffect, useState } from "react";
import { Card } from "@frontend/components/ui/Card";
import { Badge } from "@frontend/components/ui/Badge";
import { Button } from "@frontend/components/ui/Button";

// Importiamo il tipo RuoloEnum dal backend
enum RuoloEnum {
    UTENTE = "UTENTE",
    COACH = "COACH",
    GESTORE = "GESTORE",
    ADMIN = "ADMIN",
}

interface UserData {
    id: string;
    email: string;
    nome: string;
    cognome: string;
    ruolo: RuoloEnum;
    createdat: string;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/admin/users?pageSize=50", { cache: "no-store" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Errore sconosciuto");
            setUsers(data.data || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId: string, targetRole: string) => {
        if (!confirm(`Sei sicuro di voler cambiare il ruolo a ${targetRole}?`)) return;

        setUpdatingId(userId);
        setError(null);
        setSuccessMsg(null);

        try {
            const res = await fetch("/api/admin/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userid: userId, ruolo: targetRole }),
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Errore durante l'aggiornamento");

            setSuccessMsg("Ruolo aggiornato con successo!");

            // Aggiorna lo stato locale senza ricaricare tutto
            setUsers((prev) =>
                prev.map((u) => (u.id === userId ? { ...u, ruolo: targetRole as RuoloEnum } : u))
            );

            setTimeout(() => setSuccessMsg(null), 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setUpdatingId(null);
        }
    };

    const getRoleColor = (ruolo: string): "red" | "yellow" | "green" | "gray" => {
        switch (ruolo) {
            case "ADMIN": return "red";
            case "GESTORE": return "yellow";
            case "COACH": return "green";
            default: return "gray";
        }
    };

    return (
        <div className="animate-fadeIn max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-4 border-b border-[hsl(var(--tf-border))]">
                <div className="mb-4 md:mb-0">
                    <h1 className="text-3xl font-extrabold mb-1">
                        Gestione Utenti <span className="text-[hsl(var(--tf-primary))]">⚙️</span>
                    </h1>
                    <p className="text-sm text-[hsl(var(--tf-text-muted))]">
                        Visualizza e modifica i ruoli (Coach, Gestore, ecc.) di tutti gli iscritti.
                    </p>
                </div>
                <Button variant="secondary" onClick={fetchUsers} disabled={loading} style={{ alignSelf: "flex-start" }}>
                    🔄 Ricarica Lista
                </Button>
            </div>

            {error && (
                <div style={{ padding: "0.85rem", marginBottom: "1rem", borderRadius: "var(--tf-radius-md)", background: "hsl(var(--tf-danger)/0.15)", color: "hsl(var(--tf-danger))" }}>
                    <strong>Attenzione:</strong> {error}
                </div>
            )}

            {successMsg && (
                <div style={{ padding: "0.85rem", marginBottom: "1rem", borderRadius: "var(--tf-radius-md)", background: "hsl(var(--tf-primary)/0.15)", color: "hsl(var(--tf-primary))", fontWeight: 500 }}>
                    ✅ {successMsg}
                </div>
            )}

            <Card style={{ padding: 0, overflow: "hidden" }}>
                {loading ? (
                    <div className="p-8 text-center text-[hsl(var(--tf-text-muted))] animate-pulse">
                        Caricamento utenti in corso...
                    </div>
                ) : users.length === 0 ? (
                    <div className="p-8 text-center text-[hsl(var(--tf-text-muted))]">
                        Nessun utente trovato a sistema.
                    </div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                            <thead>
                                <tr style={{ background: "hsl(var(--tf-surface-2))", borderBottom: "1px solid hsl(var(--tf-border))" }}>
                                    <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600 }}>Utente</th>
                                    <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600 }}>Email</th>
                                    <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600 }}>Ruolo Attuale</th>
                                    <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600 }}>Promuovi / Modifica Ruolo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u.id} style={{ borderBottom: "1px solid hsl(var(--tf-border))" }}>
                                        <td style={{ padding: "1rem" }}>
                                            <div style={{ fontWeight: 600 }}>{u.nome} {u.cognome}</div>
                                            <div style={{ fontSize: "0.75rem", color: "hsl(var(--tf-text-muted))" }}>Registrato: {new Date(u.createdat).toLocaleDateString()}</div>
                                        </td>
                                        <td style={{ padding: "1rem", color: "hsl(var(--tf-text-muted))" }}>{u.email}</td>
                                        <td style={{ padding: "1rem" }}>
                                            <Badge color={getRoleColor(u.ruolo)}>{u.ruolo}</Badge>
                                        </td>
                                        <td style={{ padding: "1rem" }}>
                                            <select
                                                style={{
                                                    padding: "0.5rem",
                                                    borderRadius: "var(--tf-radius-sm)",
                                                    border: "1px solid hsl(var(--tf-border))",
                                                    background: "hsl(var(--tf-surface-2))",
                                                    color: "hsl(var(--tf-text))",
                                                    cursor: "pointer",
                                                    opacity: updatingId === u.id ? 0.5 : 1
                                                }}
                                                value={u.ruolo}
                                                disabled={updatingId === u.id}
                                                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                            >
                                                <option value="UTENTE">Utente Base</option>
                                                <option value="COACH">Promuovi a Coach</option>
                                                <option value="GESTORE">Promuovi a Gestore</option>
                                                <option value="ADMIN">Amministratore</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
}
