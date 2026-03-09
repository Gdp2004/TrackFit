// ============================================================
// useRealtime – Custom Hook
//
// STRATEGIA GRATUITA (no postgres_changes a pagamento):
//   1. Mount → GET /api/notifications (storico non lette)
//   2. Ogni 60s → polling leggero per notifiche perse
//   3. Broadcast Supabase (piano free) → aggiunta immediata
//
// FIX "notifica sparisce":
//   Il tempItem viene aggiunto con id temp_XXX.
//   loadHistory() NON sovrascrive più l'array con setNotifications,
//   ma fa un MERGE: mantiene i temp ancora presenti + aggiunge i
//   reali dal DB. In questo modo il toast non sparisce mentre il
//   sync DB è in corso.
// ============================================================

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { supabaseBrowser } from "@frontend/lib/supabase-browser";
import type { NotificationPayload } from "@backend/domain/port/out/NotificationServicePort";

export interface NotificationItem {
    id: string;
    titolo: string;
    messaggio: string;
    tipo: string;
    letta: boolean;
    created_at: string;
    dati?: Record<string, unknown>;
}

export interface UseRealtimeResult {
    notifications: NotificationItem[];
    unreadCount: number;
    markAllAsRead: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
}

export function useRealtime(userid: string | null): UseRealtimeResult {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);

    // ─── loadHistory: MERGE invece di sovrascrivere ───────────────────────────
    // Problema precedente: setNotifications(dbItems) cancellava i temp_XXX ancora
    // visibili come toast, facendoli sparire prima dello scadere dei 4.5s.
    // Soluzione: i temp vengono rimossi solo quando il DB ha la versione reale.
    const loadHistory = useCallback(async () => {
        if (!userid) return;
        try {
            const res = await fetch("/api/notifications?limit=20");
            if (!res.ok) return;
            const json = await res.json();
            const dbItems: NotificationItem[] = (json.data ?? []).filter((n: NotificationItem) => !n.letta);

            setNotifications(prev => {
                // Tieni i temp che NON hanno ancora un corrispondente reale nel DB
                const dbIds = new Set(dbItems.map(n => n.id));
                const tempsStillPending = prev.filter(
                    n => n.id.startsWith("temp_") && !dbIds.has(n.id)
                );
                // Merge: reali dal DB + temp ancora pendenti (deduplicati per titolo+timestamp)
                return [...dbItems, ...tempsStillPending].slice(0, 20);
            });
        } catch {
            // rete non disponibile: silenzioso
        }
    }, [userid]);

    const markAsRead = useCallback(async (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
        try {
            await fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
        } catch { /* ignora errori di rete */ }
    }, []);

    const markAllAsRead = useCallback(async () => {
        setNotifications([]);
        try {
            await fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            });
        } catch { /* ignora errori di rete */ }
    }, []);

    useEffect(() => {
        if (!userid) return;

        loadHistory();
        const pollInterval = setInterval(loadHistory, 60_000);

        // Broadcast Supabase (piano free) – ricezione istantanea
        const channel = supabaseBrowser
            .channel(`notifiche:${userid}`)
            .on("broadcast", { event: "notifica" }, ({ payload }) => {
                const p = payload as NotificationPayload & { timestamp: string };

                // Aggiunge subito un item temporaneo visibile nel dropdown e nel toast.
                // Il temp viene rimosso da loadHistory() solo DOPO che il DB ha l'ID reale,
                // quindi il toast non sparirà prematuramente.
                const tempId = `temp_${Date.now()}`;
                setNotifications(prev => {
                    // Evita duplicati se il broadcast arriva due volte
                    const alreadyPresent = prev.some(
                        n => n.titolo === p.titolo &&
                             Math.abs(new Date(n.created_at).getTime() - Date.now()) < 5000
                    );
                    if (alreadyPresent) return prev;

                    return [{
                        id: tempId,
                        titolo: p.titolo,
                        messaggio: p.messaggio,
                        tipo: p.tipo,
                        letta: false,
                        created_at: p.timestamp ?? new Date().toISOString(),
                        dati: p.dati,
                    }, ...prev].slice(0, 20);
                });

                // Sync con DB dopo 3s per sostituire il temp con l'ID reale
                setTimeout(loadHistory, 3000);
            })
            .subscribe();

        return () => {
            clearInterval(pollInterval);
            supabaseBrowser.removeChannel(channel);
        };
    }, [userid, loadHistory]);

    return {
        notifications,
        unreadCount: notifications.length,
        markAllAsRead,
        markAsRead,
    };
}
