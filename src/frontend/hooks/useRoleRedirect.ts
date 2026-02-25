// ============================================================
// useRoleRedirect – Hook per redirect basato sul ruolo utente
// Da usare nelle pagine dashboard per proteggere le route
// e reindirizzare gli utenti sulla loro dashboard corretta.
// ============================================================

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@frontend/contexts/AuthContext";
import { RuoloEnum } from "@backend/domain/model/enums";

/** Mappa ruolo → path dashboard */
const ROLE_DASHBOARD: Record<RuoloEnum, string> = {
    [RuoloEnum.COACH]: "/coach/dashboard",
    [RuoloEnum.GESTORE]: "/gym/dashboard",
    [RuoloEnum.UTENTE]: "/dashboard",
    [RuoloEnum.ADMIN]: "/dashboard",
};

/**
 * Reindirizza l'utente non autenticato al login.
 * Se il ruolo non corrisponde alla pagina corrente, reindirizza alla dashboard corretta.
 *
 * @param requiredRole – Se specificato, solo quel ruolo può accedere alla pagina; altri vengono reindirizzati.
 */
export function useRoleRedirect(requiredRole?: RuoloEnum | RuoloEnum[]) {
    const { user, ruolo, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;

        // Non autenticato → login
        if (!user || !ruolo) {
            router.replace("/login");
            return;
        }

        // Controllo ruolo richiesto
        if (requiredRole) {
            const allowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
            if (!allowed.includes(ruolo)) {
                // Reindirizza alla propria dashboard corretta
                router.replace(ROLE_DASHBOARD[ruolo] ?? "/dashboard");
            }
        }
    }, [user, ruolo, loading, router, requiredRole]);

    return { user, ruolo, loading };
}

/**
 * Reindirizza l'utente autenticato alla sua dashboard in base al ruolo.
 * Da usare nelle pagine di auth (login, register) per evitare accesso doppio.
 */
export function useAuthRedirect() {
    const { user, ruolo, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading || !user || !ruolo) return;
        router.replace(ROLE_DASHBOARD[ruolo] ?? "/dashboard");
    }, [user, ruolo, loading, router]);

    return { loading };
}
