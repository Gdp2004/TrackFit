"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRealtime, type NotificationItem } from "@frontend/hooks/useRealtime";

// ─── Toast ────────────────────────────────────────────────────
interface ToastState {
    id: string;
    titolo: string;
    messaggio: string;
    tipo: string;
}

function NotificationToast({ toast, onClose }: { toast: ToastState; onClose: () => void }) {
    useEffect(() => {
        const t = setTimeout(onClose, 4500);
        return () => clearTimeout(t);
    }, [onClose]);

    const icons: Record<string, string> = {
        promemoria: "⏰", conferma: "✅", cancellazione: "❌",
        lista_attesa: "📋", modifica_piano: "📝", annullamento_piano: "🚫",
    };

    return (
        <div style={{
            minWidth: 300, maxWidth: 380,
            background: "hsl(var(--tf-surface))",
            border: "1px solid hsl(var(--tf-border))",
            borderLeft: "4px solid hsl(var(--tf-primary))",
            borderRadius: "var(--tf-radius)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            padding: "0.875rem 1rem",
            display: "flex", gap: "0.75rem", alignItems: "flex-start",
            animation: "tf-toast-in 0.25s ease",
        }}>
            <span style={{ fontSize: "1.25rem", flexShrink: 0 }}>{icons[toast.tipo] ?? "🔔"}</span>
            <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: "0.875rem", marginBottom: "0.2rem" }}>
                    {toast.titolo}
                </p>
                <p style={{ fontSize: "0.8rem", color: "hsl(var(--tf-text-muted))", lineHeight: 1.4 }}>
                    {toast.messaggio}
                </p>
            </div>
            <button onClick={onClose} style={{
                background: "none", border: "none", cursor: "pointer",
                color: "hsl(var(--tf-text-muted))", fontSize: "1.1rem", flexShrink: 0,
            }}>×</button>
        </div>
    );
}

// ─── Riga notifica nel dropdown ───────────────────────────────
function NotificationRow({ n, onRead }: { n: NotificationItem; onRead: (id: string) => void }) {
    const icons: Record<string, string> = {
        promemoria: "⏰", conferma: "✅", cancellazione: "❌",
        lista_attesa: "📋", modifica_piano: "📝", annullamento_piano: "🚫",
    };
    return (
        <li style={{
            padding: "0.75rem 1rem",
            borderBottom: "1px solid hsl(var(--tf-border))",
            display: "flex", gap: "0.6rem", alignItems: "flex-start",
            background: n.letta ? "transparent" : "hsl(var(--tf-primary)/.05)",
        }}>
            <span style={{ fontSize: "1rem", flexShrink: 0, marginTop: 2 }}>
                {icons[n.tipo] ?? "🔔"}
            </span>
            <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, fontSize: "0.8rem" }}>{n.titolo}</p>
                <p style={{ color: "hsl(var(--tf-text-muted))", fontSize: "0.75rem", marginTop: 2 }}>
                    {n.messaggio}
                </p>
                <p style={{ color: "hsl(var(--tf-text-muted))", fontSize: "0.7rem", marginTop: 4 }}>
                    {new Date(n.created_at).toLocaleString("it-IT")}
                </p>
            </div>
            {!n.letta && (
                <button onClick={() => onRead(n.id)} title="Segna come letta"
                    style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "hsl(var(--tf-primary))", fontSize: "0.85rem", flexShrink: 0,
                    }}>✓</button>
            )}
        </li>
    );
}

// ─── Componente principale ────────────────────────────────────
export function NotificationBell({ userid }: { userid: string }) {
    const [open, setOpen] = useState(false);
    const [toasts, setToasts] = useState<ToastState[]>([]);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const prevIdsRef = useRef<Set<string>>(new Set());
    const initialLoadRef = useRef(true);

    const { notifications, unreadCount, markAllAsRead, markAsRead } = useRealtime(userid);

    // Mostra toast solo per notifiche nuove (non al caricamento iniziale)
    useEffect(() => {
        if (initialLoadRef.current && notifications.length > 0) {
            notifications.forEach(n => prevIdsRef.current.add(n.id));
            initialLoadRef.current = false;
            return;
        }
        notifications.forEach(n => {
            if (!prevIdsRef.current.has(n.id)) {
                prevIdsRef.current.add(n.id);
                setToasts(prev => [...prev, {
                    id: n.id, titolo: n.titolo, messaggio: n.messaggio, tipo: n.tipo,
                }]);
            }
        });
    }, [notifications]);

    // Chiudi dropdown cliccando fuori
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
                setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const removeToast = useCallback((id: string) =>
        setToasts(prev => prev.filter(t => t.id !== id)), []);

    return (
        <>
            {/* Stack toast in basso a destra */}
            <div style={{
                position: "fixed", bottom: "1.5rem", right: "1.5rem",
                zIndex: 9999, display: "flex", flexDirection: "column", gap: "0.75rem",
                pointerEvents: "none",
            }}>
                {toasts.map(t => (
                    <div key={t.id} style={{ pointerEvents: "auto" }}>
                        <NotificationToast toast={t} onClose={() => removeToast(t.id)} />
                    </div>
                ))}
            </div>

            {/* Campanellino */}
            <div ref={dropdownRef} style={{ position: "relative" }}>
                <button
                    onClick={() => setOpen(o => !o)}
                    title="Notifiche"
                    aria-label={`Notifiche${unreadCount > 0 ? ` (${unreadCount})` : ""}`}
                    style={{
                        width: 36, height: 36, borderRadius: "50%",
                        background: "hsl(var(--tf-surface-2))",
                        border: "1px solid hsl(var(--tf-border))",
                        cursor: "pointer", display: "flex",
                        alignItems: "center", justifyContent: "center",
                        position: "relative", fontSize: "1rem",
                    }}
                >
                    🔔
                    {unreadCount > 0 && (
                        <span style={{
                            position: "absolute", top: -2, right: -2,
                            minWidth: 16, height: 16, borderRadius: "999px",
                            background: "hsl(var(--tf-danger))", color: "#fff",
                            fontSize: "0.6rem", fontWeight: 700,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            padding: "0 3px",
                        }}>
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </button>

                {/* Dropdown */}
                {open && (
                    <div style={{
                        position: "absolute", right: 0, top: "calc(100% + 8px)",
                        width: 320, background: "hsl(var(--tf-surface))",
                        border: "1px solid hsl(var(--tf-border))",
                        borderRadius: "var(--tf-radius)",
                        boxShadow: "var(--tf-shadow-lg)",
                        zIndex: 50, overflow: "hidden",
                        animation: "tf-dropdown-in 0.15s ease",
                    }}>
                        <div style={{
                            padding: "0.75rem 1rem",
                            borderBottom: "1px solid hsl(var(--tf-border))",
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                        }}>
                            <p style={{ fontWeight: 700, fontSize: "0.875rem" }}>
                                Notifiche{unreadCount > 0 && (
                                    <span style={{ color: "hsl(var(--tf-primary))", marginLeft: 4 }}>
                                        ({unreadCount})
                                    </span>
                                )}
                            </p>
                            {unreadCount > 0 && (
                                <button onClick={markAllAsRead} style={{
                                    background: "none", border: "none",
                                    color: "hsl(var(--tf-primary))", fontSize: "0.75rem",
                                    cursor: "pointer", fontWeight: 600,
                                }}>Segna tutte ✓</button>
                            )}
                        </div>

                        {notifications.length === 0 ? (
                            <p style={{
                                padding: "2rem 1rem", textAlign: "center",
                                color: "hsl(var(--tf-text-muted))", fontSize: "0.875rem",
                            }}>🎉 Nessuna notifica non letta</p>
                        ) : (
                            <ul style={{
                                listStyle: "none", margin: 0, padding: 0,
                                maxHeight: 360, overflowY: "auto",
                            }}>
                                {notifications.map(n => (
                                    <NotificationRow key={n.id} n={n} onRead={markAsRead} />
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes tf-toast-in {
                    from { opacity: 0; transform: translateY(12px) scale(0.97); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes tf-dropdown-in {
                    from { opacity: 0; transform: translateY(-6px) scale(0.97); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </>
    );
}
