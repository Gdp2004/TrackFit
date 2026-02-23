"use client";

import { useState } from "react";
import { useRealtime } from "@frontend/hooks/useRealtime";

interface NotificationItem {
    titolo: string;
    corpo: string;
    timestamp: string;
}

export function NotificationBell({ userid }: { userid: string }) {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [open, setOpen] = useState(false);
    const unread = notifications.length;

    useRealtime(userid, (payload) => {
        setNotifications((prev) => [
            {
                titolo: (payload.titolo as string) ?? payload.tipo,
                corpo: (payload.messaggio as string),
                timestamp: payload.timestamp,
            },
            ...prev.slice(0, 4),
        ]);
    });

    return (
        <div style={{ position: "relative" }}>
            <button
                onClick={() => setOpen((o) => !o)}
                style={{
                    width: 36, height: 36,
                    borderRadius: "50%",
                    background: "hsl(var(--tf-surface-2))",
                    border: "1px solid hsl(var(--tf-border))",
                    cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    position: "relative",
                    fontSize: "1rem",
                }}
                title="Notifiche"
            >
                🔔
                {unread > 0 && (
                    <span style={{
                        position: "absolute", top: 0, right: 0,
                        width: 16, height: 16,
                        borderRadius: "50%",
                        background: "hsl(var(--tf-danger))",
                        color: "#fff",
                        fontSize: "0.6rem", fontWeight: 700,
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        {unread}
                    </span>
                )}
            </button>

            {open && (
                <div style={{
                    position: "absolute", right: 0, top: "calc(100% + 8px)",
                    width: 300,
                    background: "hsl(var(--tf-surface))",
                    border: "1px solid hsl(var(--tf-border))",
                    borderRadius: "var(--tf-radius)",
                    boxShadow: "var(--tf-shadow-lg)",
                    zIndex: 50,
                    overflow: "hidden",
                }}
                    className="animate-fadeIn"
                >
                    <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid hsl(var(--tf-border))" }}>
                        <p style={{ fontWeight: 700, fontSize: "0.875rem" }}>Notifiche</p>
                    </div>
                    {notifications.length === 0 ? (
                        <p style={{ padding: "1.5rem 1rem", color: "hsl(var(--tf-text-muted))", fontSize: "0.875rem", textAlign: "center" }}>
                            Nessuna notifica recente
                        </p>
                    ) : (
                        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                            {notifications.map((n, i) => (
                                <li key={i} style={{
                                    padding: "0.75rem 1rem",
                                    borderBottom: "1px solid hsl(var(--tf-border))",
                                }}>
                                    <p style={{ fontWeight: 600, fontSize: "0.8rem" }}>{n.titolo}</p>
                                    <p style={{ color: "hsl(var(--tf-text-muted))", fontSize: "0.75rem", marginTop: 2 }}>{n.corpo}</p>
                                    <p style={{ color: "hsl(var(--tf-text-muted))", fontSize: "0.7rem", marginTop: 4 }}>
                                        {new Date(n.timestamp).toLocaleString("it-IT")}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    )}
                    <button
                        onClick={() => { setNotifications([]); setOpen(false); }}
                        style={{
                            width: "100%", padding: "0.625rem",
                            background: "none", border: "none",
                            color: "hsl(var(--tf-text-muted))", fontSize: "0.75rem",
                            cursor: "pointer",
                        }}
                    >
                        Segna tutte come lette
                    </button>
                </div>
            )}
        </div>
    );
}
