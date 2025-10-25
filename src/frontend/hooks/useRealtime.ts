// ============================================================
// useRealtime – Custom Hook
// Subscribes to a Supabase Realtime channel for a given userId.
// Use this in React components to receive live notifications.
// ============================================================

"use client";

import { useEffect, useRef } from "react";
import { supabaseBrowser } from "@frontend/lib/supabase-browser";
import type { NotificationPayload } from "@backend/domain/port/out/NotificationServicePort";

type RealtimeCallback = (payload: NotificationPayload & { timestamp: string }) => void;

export function useRealtime(userId: string | null, onNotifica: RealtimeCallback) {
    const callbackRef = useRef(onNotifica);
    callbackRef.current = onNotifica;

    useEffect(() => {
        if (!userId) return;

        const channel = supabaseBrowser
            .channel(`notifiche:${userId}`)
            .on("broadcast", { event: "notifica" }, ({ payload }) => {
                callbackRef.current(payload as NotificationPayload & { timestamp: string });
            })
            .subscribe();

        return () => {
            supabaseBrowser.removeChannel(channel);
        };
    }, [userId]);
}
